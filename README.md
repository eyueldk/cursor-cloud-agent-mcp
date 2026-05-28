# @eyueldk/cursor-cloud-agent-mcp

MCP server for the [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). Launch and manage cloud agents from [OpenClaw](https://docs.openclaw.ai/).

## Setup

1. Get a Cloud Agents API key from the [API documentation](https://cursor.com/docs/cloud-agent/api/endpoints).

2. Add the server under `mcp.servers` in `~/.openclaw/openclaw.json` (JSON5). Replace `your_api_key_here`:

```json5
{
  mcp: {
    servers: {
      "cursor-cloud-agent": {
        command: "npx",
        args: ["-y", "@eyueldk/cursor-cloud-agent-mcp"],
        env: {
          CURSOR_API_KEY: "your_api_key_here",
        },
      },
    },
  },
}
```

3. Restart the gateway:

```bash
openclaw gateway restart
```

**CLI alternative** (same config as above):

```bash
openclaw config set mcp.servers.cursor-cloud-agent '{"command":"npx","args":["-y","@eyueldk/cursor-cloud-agent-mcp"],"env":{"CURSOR_API_KEY":"your_api_key_here"}}'
openclaw gateway restart
```

More options: [OpenClaw MCP configuration](https://docs.openclaw.ai/gateway/configuration-reference#mcp).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | Yes | Your Cloud Agents API key |
| `CURSOR_API_AUTH` | No | `basic` (default) or `bearer` |
| `CURSOR_API_BASE_URL` | No | API base URL (default `https://api.cursor.com`) |

## Tools

| Tool | Description |
|------|-------------|
| `cloud_agent_get_me` | API key info |
| `cloud_agent_list_models` | List available models |
| `cloud_agent_create` | Create an agent and start a run |
| `cloud_agent_list` | List your agents |
| `cloud_agent_get` | Get agent details |
| `cloud_agent_create_run` | Send a follow-up prompt |
| `cloud_agent_list_runs` | List runs for an agent |
| `cloud_agent_get_run` | Get run status and result |
| `cloud_agent_wait_for_run` | Wait until a run finishes |
| `cloud_agent_cancel_run` | Cancel a run |
| `cloud_agent_list_artifacts` | List agent artifacts |
| `cloud_agent_download_artifact` | Get a download URL for an artifact |
| `cloud_agent_archive` | Archive an agent |
| `cloud_agent_unarchive` | Unarchive an agent |
| `cloud_agent_delete` | Permanently delete an agent |

## License

MIT
