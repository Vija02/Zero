/// <reference path="../pb_data/types.d.ts" />

// TODO: Cron how often
cronAdd("generate_tasks_from_calendar", "*/30 * * * *", () => {
	try {
		function getSetting(key) {
			const record = $app.findRecordsByFilter(
				"settings",
				`key = '${key}'`,
				null,
				1,
				0,
			)
			return record?.[0]?.get("value")
		}

		const accessToken = getSetting("access_token")
		const daysInAdvance = getSetting("days_in_advance") ?? 30
		const calendarIds = (getSetting("task_import_calendar_ids") ?? "").split(
			"\n",
		)

		if (!accessToken) {
			console.log("No access token found. Aborting")
			return
		}

		// Helper function to fetch Google Calendar events using direct HTTP API
		function fetchGoogleCalendarEvents(accessToken, options) {
			options = options || {}
			const calendarId = options.calendarId || "primary"
			const timeMin = options.timeMin || new Date()
			const timeMax = options.timeMax
			const maxResults = options.maxResults || 250
			const singleEvents = options.singleEvents !== false
			const orderBy = options.orderBy || "startTime"

			// Build query string manually (URLSearchParams not available)
			const queryParts = [
				"timeMin=" + encodeURIComponent(timeMin.toISOString()),
				"maxResults=" + encodeURIComponent(maxResults.toString()),
				"singleEvents=" + encodeURIComponent(singleEvents.toString()),
				"orderBy=" + encodeURIComponent(orderBy),
			]

			if (timeMax) {
				queryParts.push("timeMax=" + encodeURIComponent(timeMax.toISOString()))
			}

			const url =
				"https://www.googleapis.com/calendar/v3/calendars/" +
				encodeURIComponent(calendarId) +
				"/events?" +
				queryParts.join("&")

			const response = $http.send({
				url: url,
				method: "GET",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			})

			if (response.statusCode !== 200) {
				throw new Error(
					`Google Calendar API error: ${response.statusCode} - ${response.raw}`,
				)
			}

			const data = JSON.parse(response.raw)
			const events = data.items || []

			return events.map((event) => ({
				id: event.id,
				summary: event.summary,
				description: event.description ?? "",
				start: event.start?.dateTime || event.start?.date,
				end: event.end?.dateTime || event.end?.date,
				htmlLink: event.htmlLink,
				status: event.status,
				created: event.created,
				updated: event.updated,
			}))
		}

		const now = new Date()
		const daysLater = new Date(
			now.getTime() + daysInAdvance * 24 * 60 * 60 * 1000,
		)

		const events = calendarIds
			.map((calendarId) =>
				fetchGoogleCalendarEvents(accessToken, {
					calendarId,
					timeMin: now,
					timeMax: daysLater,
					// Should be enough. This is the max. https://developers.google.com/workspace/calendar/api/v3/reference/events/list
					maxResults: 2500,
					singleEvents: true,
					orderBy: "startTime",
				}),
			)
			.flat()

		// Helper function to parse task block from description
		// Format: @@task Nd (where N is number of days before event)
		//         @title Custom Title (optional)
		//         @due Nd (optional - N days before event for due date)
		function parseTaskBlock(rawDescription) {
			function htmlToPlainText(html) {
				return html
					.replace(/<style([\s\S]*?)<\/style>/gi, "")
					.replace(/<script([\s\S]*?)<\/script>/gi, "")
					.replace(/<\/div>/gi, "\n")
					.replace(/<\/li>/gi, "\n")
					.replace(/<li>/gi, "  *  ")
					.replace(/<\/ul>/gi, "\n")
					.replace(/<\/p>/gi, "\n")
					.replace(/<br\s*\/?>/gi, "\n")
					.replace(/<[^>]+>/gi, "")
			}

			if (!rawDescription) return null

			const description = htmlToPlainText(rawDescription)

			// Look for @@task block - takes the first one if duplicates
			const taskMatch = description.match(/@@task\s+(\d+)d/i)
			if (!taskMatch) {
				return null
			}

			const daysBefore = parseInt(taskMatch[1], 10)

			// Look for @title attribute (optional)
			const titleMatch = description.match(/@title\s+(.+?)(?:\n|$)/i)
			const title = titleMatch ? titleMatch[1].trim() : null

			// Look for @due attribute (optional - N days before event)
			const dueMatch = description.match(/@due\s+(\d+)d/i)
			const daysBeforeDue = dueMatch ? parseInt(dueMatch[1], 10) : null

			return {
				daysBefore: daysBefore,
				title: title,
				daysBeforeDue: daysBeforeDue,
			}
		}

		// Helper function to calculate allocated date (N days before event start)
		function calculateAllocatedDate(eventStartDate, daysBefore) {
			const eventDate = new Date(eventStartDate)
			const allocatedDate = new Date(
				eventDate.getTime() - daysBefore * 24 * 60 * 60 * 1000,
			)
			// Set to start of day
			allocatedDate.setHours(0, 0, 0, 0)
			
			// Clamp to today if allocated date is in the past
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			if (allocatedDate < today) {
				return today.toISOString()
			}
			
			return allocatedDate.toISOString()
		}

		// Create a map of event IDs for quick lookup
		const eventIds = new Set(events.map((event) => event.id))

		// Get all tasks that have a google_calendar_id (linked to calendar events)
		const existingCalendarTasks = $app.findRecordsByFilter(
			"tasks",
			"google_calendar_id != ''",
		)

		// Step 1: Delete tasks whose calendar events no longer exist
		for (const task of existingCalendarTasks) {
			const calendarId = task.get("google_calendar_id")
			if (!eventIds.has(calendarId)) {
				// Calendar event was deleted, delete the task
				console.log(
					`Deleting task "${task.get(
						"title",
					)}" - calendar event no longer exists`,
				)
				$app.delete(task)
			}
		}

		// Step 2: Process events - create or update tasks
		for (const event of events) {
			const taskBlock = parseTaskBlock(event.description)

			// If no @@task block in description, skip this event (or delete existing task)
			if (taskBlock === null) {
				// Check if there's an existing task for this event and delete it
				try {
					const existingTask = $app.findFirstRecordByFilter(
						"tasks",
						`google_calendar_id = '${event.id}'`,
					)
					if (existingTask) {
						console.log(
							`Deleting task "${existingTask.get(
								"title",
							)}" - no @@task block in event`,
						)
						$app.delete(existingTask)
					}
				} catch (e) {
					// No existing task found, nothing to do
				}
				continue
			}

			const allocatedDate = calculateAllocatedDate(
				event.start,
				taskBlock.daysBefore,
			)
			// Calculate due date if @due was specified, otherwise leave blank
			const dueDate =
				taskBlock.daysBeforeDue !== null
					? calculateAllocatedDate(event.start, taskBlock.daysBeforeDue)
					: null
			// Use custom title from @title attribute, or fall back to event summary
			const taskTitle = taskBlock.title || event.summary

			// Check if a task already exists for this calendar event
			let existingTask = null
			try {
				existingTask = $app.findFirstRecordByFilter(
					"tasks",
					`google_calendar_id = '${event.id}'`,
				)
			} catch (e) {
				// No existing task found
			}

			if (existingTask) {
				// Update existing task if allocated_date, title, or due_date changed
				const currentAllocatedDate = new Date(
					existingTask.get("allocated_date"),
				).toISOString()
				const currentTitle = existingTask.get("title")
				const currentDueDate = existingTask.get("due_date")
				const newAllocatedDateNormalized = allocatedDate.split("T")[0]
				const currentAllocatedDateNormalized = currentAllocatedDate
					? currentAllocatedDate.split("T")[0]
					: ""
				const newDueDateNormalized = dueDate ? dueDate.split("T")[0] : ""
				const parsedCurrentDueDate = new Date(currentDueDate)
				const currentDueDateNormalized =
					currentDueDate && !isNaN(parsedCurrentDueDate)
						? parsedCurrentDueDate.toISOString().split("T")[0]
						: ""

				const needsUpdate =
					currentAllocatedDateNormalized !== newAllocatedDateNormalized ||
					currentTitle !== taskTitle ||
					currentDueDateNormalized !== newDueDateNormalized

				if (needsUpdate) {
					console.log(
						`Updating task "${taskTitle}" - allocated_date: ${currentAllocatedDateNormalized} -> ${newAllocatedDateNormalized}, title: ${currentTitle} -> ${taskTitle}, due_date: ${currentDueDateNormalized} -> ${newDueDateNormalized}`,
					)
					existingTask.set("allocated_date", allocatedDate)
					existingTask.set("title", taskTitle)
					existingTask.set("due_date", dueDate)
					$app.save(existingTask)
				}
			} else {
				// Create new task
				console.log(
					`Creating new task "${taskTitle}" for ${allocatedDate}${
						dueDate ? `, due: ${dueDate.split("T")[0]}` : ""
					}`,
				)
				const collection = $app.findCollectionByNameOrId("tasks")
				const newTask = new Record(collection)
				newTask.set("title", taskTitle)
				newTask.set("google_calendar_id", event.id)
				newTask.set("allocated_date", allocatedDate)
				newTask.set("due_date", dueDate)
				newTask.set("completed", false)
				$app.save(newTask)
			}
		}

		console.log("Calendar task sync completed successfully")
	} catch (e) {
		console.error(e)
	}
})
