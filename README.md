# cursor-cloud-agent-mcp

MCP server that wraps the [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints) so you can launch and manage cloud agents from any MCP client (Cursor, Claude Desktop, etc.).

## Setup

1. Generate a Cursor API key from **Dashboard → Integrations**.
2. Install dependencies and build:

```bash
npm install
npm run build
```

3. Configure your MCP client (example for Cursor):

```json
{
  "mcpServers": {
    "cursor-cloud-agent": {
      "command": "node",
      "args": ["/absolute/path/to/cursor-cloud-mcp/dist/index.js"],
      "env": {
        "CURSOR_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | Yes | Cursor API key (Basic or Bearer) |
| `CURSOR_API_AUTH` | No | `basic` (default) or `bearer` |
| `CURSOR_API_BASE_URL` | No | API base URL (default `https://api.cursor.com`) |

## Tools

| Tool | API |
|------|-----|
| `cloud_agent_get_me` | `GET /v1/me` |
| `cloud_agent_list_models` | `GET /v1/models` |
| `cloud_agent_create` | `POST /v1/agents` |
| `cloud_agent_list` | `GET /v1/agents` |
| `cloud_agent_get` | `GET /v1/agents/{id}` |
| `cloud_agent_create_run` | `POST /v1/agents/{id}/runs` |
| `cloud_agent_list_runs` | `GET /v1/agents/{id}/runs` |
| `cloud_agent_get_run` | `GET /v1/agents/{id}/runs/{runId}` |
| `cloud_agent_wait_for_run` | Polls until terminal status |
| `cloud_agent_cancel_run` | `POST .../runs/{runId}/cancel` |
| `cloud_agent_list_artifacts` | `GET /v1/agents/{id}/artifacts` |
| `cloud_agent_download_artifact` | `GET .../artifacts/download` |
| `cloud_agent_archive` | `POST /v1/agents/{id}/archive` |
| `cloud_agent_unarchive` | `POST /v1/agents/{id}/unarchive` |
| `cloud_agent_delete` | `DELETE /v1/agents/{id}` |

## Development

```bash
npm run dev      # run MCP server on stdio
npm test         # unit + MCP integration tests
```

## License

MIT
