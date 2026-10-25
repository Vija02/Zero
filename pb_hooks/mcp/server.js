/// <reference path="../../pb_data/types.d.ts" />

// JSON-RPC message handling and tool implementations for the MCP endpoint.
// Loaded via require() from mcp.pb.js (not a hook file itself).

const SUPPORTED_PROTOCOL_VERSIONS = [
	"2025-11-25",
	"2025-06-18",
	"2025-03-26",
	"2024-11-05",
]

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Dates are stored as UTC midnight to match PocketBase's @todayStart macro
// (see move_tasks_to_new_day.pb.js), so the API only deals in YYYY-MM-DD.
function toStoredDate(value, field) {
	if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
		throw new Error(`${field} must be a date in YYYY-MM-DD format`)
	}
	return `${value} 00:00:00.000Z`
}

function todayDate() {
	return new Date().toISOString().slice(0, 10)
}

function readDate(record, field) {
	const dateTime = record.getDateTime(field)
	return dateTime.isZero() ? null : dateTime.string().slice(0, 10)
}

function escapeHtml(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
}

// Descriptions are Tiptap HTML. Wrap plain text so it renders as paragraphs.
function toDescriptionHtml(text) {
	if (!text) return ""
	if (/^\s*<[a-z]/i.test(text)) return text
	return text
		.split(/\n{2,}/)
		.map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
		.join("")
}

function serializeTask(record) {
	return {
		id: record.id,
		title: record.getString("title"),
		description: record.getString("description"),
		date: readDate(record, "allocated_date"),
		due_date: readDate(record, "due_date"),
		completed: record.getBool("completed"),
		highlight_color: record.getString("highlight_color") || null,
		carry_over: record.getInt("carry_over"),
		from_google_calendar: !!record.getString("google_calendar_id"),
	}
}

function findTask(id) {
	if (typeof id !== "string" || !id) throw new Error("id is required")
	try {
		return $app.findRecordById("tasks", id)
	} catch (err) {
		throw new Error(`Task ${id} not found`)
	}
}

// Same placement as trigger_tasks__set_order.pb.js: top of the day
function topOrderForDate(storedDate) {
	const highest = $app.findRecordsByFilter(
		"tasks",
		"allocated_date = {:allocatedDate}",
		"-order",
		1,
		0,
		{ allocatedDate: storedDate },
	)
	return (highest?.[0]?.getFloat("order") ?? 0) + 1000
}

const TOOLS = [
	{
		name: "list_tasks",
		description:
			"List tasks from the Zero planner. Filter by a single day, a date range, and/or a text search. Tasks within a day are returned in display order (top first). Incomplete tasks from past days are automatically carried over to today.",
		inputSchema: {
			type: "object",
			properties: {
				date: {
					type: "string",
					description: "Only tasks allocated to this day (YYYY-MM-DD)",
				},
				start_date: {
					type: "string",
					description: "Range start, inclusive (YYYY-MM-DD)",
				},
				end_date: {
					type: "string",
					description: "Range end, inclusive (YYYY-MM-DD)",
				},
				query: {
					type: "string",
					description: "Case-insensitive search in title and description",
				},
				include_completed: {
					type: "boolean",
					description: "Include completed tasks (default true)",
				},
				limit: {
					type: "integer",
					description: "Maximum number of tasks to return (default 100)",
				},
			},
		},
		annotations: { readOnlyHint: true },
		handler: (args) => {
			const filters = []
			const params = {}

			if (args.date) {
				filters.push("allocated_date = {:date}")
				params.date = toStoredDate(args.date, "date")
			}
			if (args.start_date) {
				filters.push("allocated_date >= {:startDate}")
				params.startDate = toStoredDate(args.start_date, "start_date")
			}
			if (args.end_date) {
				filters.push("allocated_date <= {:endDate}")
				params.endDate = toStoredDate(args.end_date, "end_date")
			}
			if (args.query) {
				filters.push("(title ~ {:query} || description ~ {:query})")
				params.query = String(args.query)
			}
			if (args.include_completed === false) {
				filters.push("completed = false")
			}

			const limit = Math.min(Math.max(parseInt(args.limit) || 100, 1), 500)
			const records = $app.findRecordsByFilter(
				"tasks",
				filters.length ? filters.join(" && ") : "id != ''",
				"allocated_date,-order",
				limit,
				0,
				params,
			)
			return { tasks: records.map(serializeTask) }
		},
	},
	{
		name: "create_task",
		description: "Create a new task. It is placed at the top of its day.",
		inputSchema: {
			type: "object",
			properties: {
				title: { type: "string", description: "Task title" },
				date: {
					type: "string",
					description: "Day to allocate the task to (YYYY-MM-DD, default today)",
				},
				description: {
					type: "string",
					description: "Task notes, as plain text or HTML",
				},
				due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
				highlight_color: {
					type: "string",
					description: "Highlight color as a CSS hex color, e.g. #f97316",
				},
			},
			required: ["title"],
		},
		handler: (args) => {
			if (typeof args.title !== "string" || !args.title.trim()) {
				throw new Error("title is required")
			}

			const record = new Record($app.findCollectionByNameOrId("tasks"))
			record.set("title", args.title.trim())
			record.set(
				"allocated_date",
				toStoredDate(args.date || todayDate(), "date"),
			)
			record.set("completed", false)
			if (args.description) {
				record.set("description", toDescriptionHtml(args.description))
			}
			if (args.due_date) {
				record.set("due_date", toStoredDate(args.due_date, "due_date"))
			}
			if (args.highlight_color) {
				record.set("highlight_color", args.highlight_color)
			}

			$app.save(record)
			return { task: serializeTask(record) }
		},
	},
	{
		name: "update_task",
		description:
			"Update a task. Only the provided fields change. Use this to mark a task complete, rename it, edit its notes, or move it to another day.",
		inputSchema: {
			type: "object",
			properties: {
				id: { type: "string", description: "Task id" },
				title: { type: "string" },
				description: {
					type: "string",
					description: "Replaces the notes, as plain text or HTML",
				},
				date: {
					type: "string",
					description: "Move the task to this day (YYYY-MM-DD)",
				},
				due_date: {
					type: ["string", "null"],
					description: "Due date (YYYY-MM-DD), or null to clear it",
				},
				completed: { type: "boolean" },
				highlight_color: {
					type: ["string", "null"],
					description: "CSS hex color, or null to clear it",
				},
			},
			required: ["id"],
		},
		handler: (args) => {
			const record = findTask(args.id)

			if (args.title !== undefined) {
				if (!String(args.title).trim()) throw new Error("title cannot be empty")
				record.set("title", String(args.title).trim())
			}
			if (args.description !== undefined) {
				record.set("description", toDescriptionHtml(args.description))
			}
			if (args.date !== undefined) {
				const storedDate = toStoredDate(args.date, "date")
				if (readDate(record, "allocated_date") !== args.date) {
					record.set("order", topOrderForDate(storedDate))
					record.set("allocated_date", storedDate)
				}
			}
			if (args.due_date !== undefined) {
				record.set(
					"due_date",
					args.due_date ? toStoredDate(args.due_date, "due_date") : "",
				)
			}
			if (args.completed !== undefined) {
				record.set("completed", !!args.completed)
			}
			if (args.highlight_color !== undefined) {
				record.set("highlight_color", args.highlight_color || "")
			}

			$app.save(record)
			return { task: serializeTask(record) }
		},
	},
	{
		name: "delete_task",
		description:
			"Permanently delete a task. Tasks generated from Google Calendar may be recreated by the next calendar sync.",
		inputSchema: {
			type: "object",
			properties: {
				id: { type: "string", description: "Task id" },
			},
			required: ["id"],
		},
		annotations: { destructiveHint: true },
		handler: (args) => {
			const record = findTask(args.id)
			const task = serializeTask(record)
			$app.delete(record)
			return { deleted: task }
		},
	},
]

function callTool(params) {
	const tool = TOOLS.find((t) => t.name === params?.name)
	if (!tool) {
		throw { code: -32602, message: `Unknown tool: ${params?.name}` }
	}

	try {
		const result = tool.handler(params.arguments || {})
		return {
			content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			structuredContent: result,
		}
	} catch (err) {
		// Tool failures are reported to the model, not as protocol errors
		return {
			content: [{ type: "text", text: String(err?.message ?? err) }],
			isError: true,
		}
	}
}

function dispatch(method, params) {
	switch (method) {
		case "initialize": {
			const requested = params?.protocolVersion
			return {
				protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
					? requested
					: SUPPORTED_PROTOCOL_VERSIONS[0],
				capabilities: { tools: {} },
				serverInfo: { name: "zero", version: "1.0.0" },
				instructions:
					"Zero is a daily task planner. Each task is allocated to a single day; dates are YYYY-MM-DD.",
			}
		}
		case "ping":
			return {}
		case "tools/list":
			return {
				tools: TOOLS.map(({ handler, ...definition }) => definition),
			}
		case "tools/call":
			return callTool(params)
		default:
			throw { code: -32601, message: `Method not found: ${method}` }
	}
}

// Returns the JSON-RPC response, or null for notifications/responses
function handleMessage(message) {
	if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
		const isNotificationOrResponse =
			message &&
			(message.id === undefined ||
				message.result !== undefined ||
				message.error !== undefined)
		if (isNotificationOrResponse) return null
		return {
			jsonrpc: "2.0",
			id: message?.id ?? null,
			error: { code: -32600, message: "Invalid Request" },
		}
	}

	if (message.id === undefined) return null

	try {
		return {
			jsonrpc: "2.0",
			id: message.id,
			result: dispatch(message.method, message.params),
		}
	} catch (err) {
		return {
			jsonrpc: "2.0",
			id: message.id,
			error: {
				code: typeof err?.code === "number" ? err.code : -32603,
				message: String(err?.message ?? err),
			},
		}
	}
}

module.exports = { handleMessage }
