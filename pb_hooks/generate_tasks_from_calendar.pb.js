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

		return events.map((event) => {
			const isAllDay = !event.start?.dateTime
			let start, end

			if (isAllDay && event.start?.date) {
				// For all-day events, Google returns dates like "2025-03-30".
				// Use UTC midnight so the stored value matches PocketBase's
				// @todayStart filter macro (also UTC) and is DST-stable.
				const [startYear, startMonth, startDay] = event.start.date
					.split("-")
					.map(Number)
				const [endYear, endMonth, endDay] = event.end.date.split("-").map(Number)

				start = new Date(
					Date.UTC(startYear, startMonth - 1, startDay),
				).toISOString()
				end = new Date(Date.UTC(endYear, endMonth - 1, endDay)).toISOString()
			} else {
				start = event.start?.dateTime
				end = event.end?.dateTime
			}

			// originalStartTime is the instance's originally scheduled start.
			// Combined with recurringEventId, it identifies a recurring instance
			// in a way that's stable across DST transitions (whereas event.id
			// embeds the UTC start time, which shifts when the local→UTC offset
			// changes — that mismatch was deleting & recreating tasks).
			const originalStartTime =
				event.originalStartTime?.dateTime ||
				event.originalStartTime?.date ||
				null

			return {
				id: event.id,
				recurringEventId: event.recurringEventId || null,
				originalStartTime: originalStartTime,
				summary: event.summary,
				description: event.description ?? "",
				start: start,
				end: end,
				htmlLink: event.htmlLink,
				status: event.status,
				created: event.created,
				updated: event.updated,
				isAllDay: isAllDay,
			}
		})
		}

		const now = new Date()
		now.setUTCHours(0, 0, 0, 0) // Start of today (UTC) — matches @todayStart
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
		//         @nodue (optional - explicitly set no due date)
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

			// Look for @nodue attribute (optional - explicitly no due date)
			const noDueMatch = description.match(/@nodue\b/i)
			const hasNoDue = !!noDueMatch

			// Look for @due attribute (optional - N days before event)
			const dueMatch = description.match(/@due\s+(\d+)d/i)
			const daysBeforeDue = dueMatch ? parseInt(dueMatch[1], 10) : null

			return {
				daysBefore: daysBefore,
				title: title,
				daysBeforeDue: daysBeforeDue,
				hasNoDue: hasNoDue,
			}
		}

		// Helper function to calculate allocated date (N days before event start).
		// Uses UTC midnight so the value is DST-stable and comparable to
		// @todayStart in PocketBase filters.
		function calculateAllocatedDate(eventStartDate, daysBefore) {
			const eventDate = new Date(eventStartDate)
			const allocatedDate = new Date(
				eventDate.getTime() - daysBefore * 24 * 60 * 60 * 1000,
			)
			allocatedDate.setUTCHours(0, 0, 0, 0)

			const today = new Date()
			today.setUTCHours(0, 0, 0, 0)

			if (allocatedDate < today) {
				return today.toISOString()
			}

			return allocatedDate.toISOString()
		}

		// Create a map of event IDs for quick lookup
		const eventIds = new Set(events.map((event) => event.id))

		// Recurring-instance lookup keyed by (recurringEventId, originalStartTime).
		// Used to migrate stored google_calendar_id when DST shifts the UTC
		// component of an instance id (e.g. "..._20260330T080000Z" ->
		// "..._20260330T070000Z"), which would otherwise look like a deleted
		// event and cause the task to be wiped + recreated.
		const recurringInstanceById = new Map()
		for (const event of events) {
			if (event.recurringEventId && event.originalStartTime) {
				const key = `${event.recurringEventId}|${event.originalStartTime}`
				recurringInstanceById.set(key, event)
			}
		}

		// Get all tasks generated by google calendar that is in the future
		// If the event is in the past, we just leave it as it is (Since we don't want to process them, especially since we don't fetch the data)
		const existingCalendarTasks = $app.findRecordsByFilter(
			"tasks",
			"google_calendar_date >= @todayStart",
		)

		// Step 1: Reconcile tasks against fetched events. Migrate ids for
		// recurring instances whose id shifted (DST). Delete only true orphans.
		for (const task of existingCalendarTasks) {
			const calendarId = task.get("google_calendar_id")
			if (eventIds.has(calendarId)) continue

			// Try to recover a recurring instance whose id changed.
			// The stored id has the form "<recurringEventId>_<originalStartTime>".
			const sepIdx = calendarId.lastIndexOf("_")
			let migrated = false
			if (sepIdx > 0) {
				const baseId = calendarId.substring(0, sepIdx)
				const storedDate = new Date(task.get("google_calendar_date"))
				for (const [, event] of recurringInstanceById) {
					if (event.recurringEventId !== baseId) continue
					// Match by the same wall-clock instant (within a day) — DST
					// only shifts the UTC offset by an hour or two, so any
					// instance within ±1 day of the stored date is the same one.
					const eventStart = new Date(event.start)
					const diffMs = Math.abs(eventStart.getTime() - storedDate.getTime())
					if (diffMs < 24 * 60 * 60 * 1000) {
						console.log(
							`Migrating task "${task.get(
								"title",
							)}" calendar id ${calendarId} -> ${event.id}`,
						)
						task.set("google_calendar_id", event.id)
						$app.save(task)
						eventIds.add(event.id) // prevent step 2 from creating a duplicate
						migrated = true
						break
					}
				}
			}

			if (!migrated) {
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
			// Calculate due date:
			// - If @nodue is specified, set to null
			// - If @due Nd is specified, calculate N days before event
			// - Otherwise, default to today
			let dueDate = null
			if (taskBlock.hasNoDue) {
				dueDate = null
			} else if (taskBlock.daysBeforeDue !== null) {
				dueDate = calculateAllocatedDate(event.start, taskBlock.daysBeforeDue)
			} else {
				// Default due date is the event date
				const eventDate = new Date(event.start)
				eventDate.setHours(0, 0, 0, 0)
				dueDate = eventDate.toISOString()
			}
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
				// Update existing task if allocated_date, title, due_date, or google_calendar_date changed
				const currentAllocatedDate = new Date(
					existingTask.get("allocated_date"),
				).toISOString()
				const currentTitle = existingTask.get("title")
				const currentDueDate = existingTask.get("due_date")
				const currentGoogleCalendarDate = existingTask.get("google_calendar_date")
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
				const newGoogleCalendarDate = event.start
				const parsedCurrentGoogleCalendarDate = new Date(currentGoogleCalendarDate)
				const currentGoogleCalendarDateNormalized =
					currentGoogleCalendarDate && !isNaN(parsedCurrentGoogleCalendarDate)
						? parsedCurrentGoogleCalendarDate.toISOString().split("T")[0]
						: ""
				const newGoogleCalendarDateNormalized = newGoogleCalendarDate
					? newGoogleCalendarDate.split("T")[0]
					: ""

				const needsUpdate =
					currentAllocatedDateNormalized !== newAllocatedDateNormalized ||
					currentTitle !== taskTitle ||
					currentDueDateNormalized !== newDueDateNormalized ||
					currentGoogleCalendarDateNormalized !== newGoogleCalendarDateNormalized

				if (needsUpdate) {
					console.log(
						`Updating task "${taskTitle}" - allocated_date: ${currentAllocatedDateNormalized} -> ${newAllocatedDateNormalized}, title: ${currentTitle} -> ${taskTitle}, due_date: ${currentDueDateNormalized} -> ${newDueDateNormalized}, google_calendar_date: ${currentGoogleCalendarDateNormalized} -> ${newGoogleCalendarDateNormalized}`,
					)
					existingTask.set("allocated_date", allocatedDate)
					existingTask.set("title", taskTitle)
					existingTask.set("due_date", dueDate)
					existingTask.set("google_calendar_date", newGoogleCalendarDate)
					$app.save(existingTask)
				}
			} else {
				// Create new task
				console.log(
					`Creating new task "${taskTitle}" for ${allocatedDate}${
						dueDate ? `, due: ${dueDate.split("T")[0]}` : ""
					}, calendar event date: ${event.start}`,
				)
				const collection = $app.findCollectionByNameOrId("tasks")
				const newTask = new Record(collection)
				newTask.set("title", taskTitle)
				newTask.set("google_calendar_id", event.id)
				newTask.set("google_calendar_date", event.start)
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
