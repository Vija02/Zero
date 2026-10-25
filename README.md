# Zero

## MCP server

Zero exposes an [MCP](https://modelcontextprotocol.io) endpoint at `/mcp` so AI clients (Claude Code, Claude Desktop, etc.) can read and manage tasks. It's implemented as a PocketBase hook (`pb_hooks/mcp.pb.js`), so it's served by the same container as the app.

### Tools

| Tool | Description |
|---|---|
| `list_tasks` | List tasks by `date`, `start_date`/`end_date`, text `query`, and `include_completed` |
| `create_task` | Create a task (defaults to today) with optional description, due date and highlight color |
| `update_task` | Update only the given fields: complete, rename, edit notes, move to another day, etc. |
| `delete_task` | Permanently delete a task |

Dates are `YYYY-MM-DD`. Descriptions may be plain text or HTML.

### Setup

The endpoint requires a superuser token. Generate a long-lived (1 year) one by impersonating your superuser:

```sh
HOST=https://your-zero-host

T=$(curl -s -X POST "$HOST/api/collections/_superusers/auth-with-password" \
  -H 'Content-Type: application/json' \
  -d '{"identity":"EMAIL","password":"PASSWORD"}' | jq -r .token)

ID=$(curl -s "$HOST/api/collections/_superusers/records" \
  -H "Authorization: $T" | jq -r '.items[0].id')

curl -s -X POST "$HOST/api/collections/_superusers/impersonate/$ID" \
  -H "Authorization: $T" -H 'Content-Type: application/json' \
  -d '{"duration":31536000}' | jq -r .token
```

Then register it with your client. For Claude Code:

```sh
claude mcp add --transport http zero "$HOST/mcp" --header "Authorization: Bearer <token>"
```

Other clients that support Streamable HTTP can use the same URL and header.

> **Note:** this is a full superuser token, not one scoped to tasks. Keep it secret. Changing the superuser's password invalidates it.
