# @eyueldk/cursor-cloud-agent-mcp

MCP server for the [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). Launch and manage cloud agents from [OpenClaw](https://docs.openclaw.ai/) or any MCP client.

## Setup

1. Create an API key in **Cursor Dashboard → Integrations**.

2. Add the server to your MCP host (OpenClaw recommended).

### OpenClaw (recommended)

Add the server under **`mcp.servers`** in your OpenClaw gateway config (default: `~/.openclaw/openclaw.json`, JSON5). Replace `your_api_key_here` with your key:

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

Or use the CLI (equivalent to editing `mcp.servers`):

```bash
openclaw config set mcp.servers.cursor-cloud-agent '{"command":"npx","args":["-y","@eyueldk/cursor-cloud-agent-mcp"],"env":{"CURSOR_API_KEY":"your_api_key_here"}}'
openclaw gateway restart
```

After editing the file directly, restart the gateway so the new MCP server is picked up:

```bash
openclaw gateway restart
```

See the [OpenClaw MCP configuration reference](https://docs.openclaw.ai/gateway/configuration-reference#mcp) for remote servers, env substitution, and other options.

### Cursor (alternative)

**Option A — [mcp-add](https://github.com/paoloricciuti/mcp-add)**. Replace `your_api_key_here`; pick scope and clients when prompted:

```bash
npx mcp-add --name cursor-cloud-agent --type stdio --command "npx -y @eyueldk/cursor-cloud-agent-mcp" --env "CURSOR_API_KEY=your_api_key_here"
```

Or run `npx mcp-add` and follow the prompts (`npx -y @eyueldk/cursor-cloud-agent-mcp` as the command).

**Option B — manual** — add to `.cursor/mcp.json` or `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cursor-cloud-agent": {
      "command": "npx",
      "args": ["-y", "@eyueldk/cursor-cloud-agent-mcp"],
      "env": {
        "CURSOR_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Enable the server under **Settings → Tools & MCP** if needed.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | Yes | Your Cursor API key |
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
