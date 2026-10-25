/// <reference path="../pb_data/types.d.ts" />

// MCP (Model Context Protocol) server over Streamable HTTP.
// Lets AI clients (Claude Code, Claude Desktop, ...) list and manage tasks.
// Requires a superuser token: `Authorization: Bearer <token>`
// Logic lives in ./mcp/server.js since handlers can't share top-level scope.
routerAdd(
	"POST",
	"/mcp",
	(e) => {
		const { handleMessage } = require(`${__hooks}/mcp/server.js`)

		let message
		try {
			message = JSON.parse(toString(e.request.body))
		} catch (err) {
			return e.json(400, {
				jsonrpc: "2.0",
				id: null,
				error: { code: -32700, message: "Parse error" },
			})
		}

		// JSON-RPC batches (only allowed by older protocol versions)
		if (Array.isArray(message)) {
			const responses = message.map(handleMessage).filter(Boolean)
			return responses.length ? e.json(200, responses) : e.noContent(202)
		}

		const response = handleMessage(message)
		// Notifications and responses get no reply
		return response ? e.json(200, response) : e.noContent(202)
	},
	$apis.requireSuperuserAuth(),
)

// We don't push server-initiated messages, so there's no SSE stream to open
routerAdd(
	"GET",
	"/mcp",
	(e) => {
		e.response.header().set("Allow", "POST")
		return e.json(405, { message: "Method Not Allowed" })
	},
	$apis.requireSuperuserAuth(),
)
