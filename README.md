# cursor-cloud-mcp

MCP server for the [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). Launch and manage cloud agents from Cursor, Claude Desktop, or any MCP client.

## Install

### Quick install with mcp-add (recommended)

[mcp-add](https://github.com/paoloricciuti/mcp-add) writes the MCP config for Cursor (and other clients) for you.

1. Create an API key in **Cursor Dashboard → Integrations**.
2. Run:

```bash
npx mcp-add \
  --name cursor-cloud \
  --type stdio \
  --command "npx -y cursor-cloud-mcp" \
  --env "CURSOR_API_KEY=your_api_key_here" \
  --scope project \
  --clients cursor \
  -y
```

Use `--scope global` to install in `~/.cursor/mcp.json` instead of `.cursor/mcp.json` in the current project.

Or run interactively:

```bash
npx mcp-add
```

Then choose **stdio**, command `npx -y cursor-cloud-mcp`, and set `CURSOR_API_KEY` when prompted.

Reload Cursor (or enable the server under **Settings → Tools & MCP**) after installing.

### Manual install

```bash
npm install -g cursor-cloud-mcp
```

Or run without installing:

```bash
npx cursor-cloud-mcp
```

## Configure

1. Create an API key in **Cursor Dashboard → Integrations**.
2. Add to your MCP config manually:

```json
{
  "mcpServers": {
    "cursor-cloud": {
      "command": "npx",
      "args": ["-y", "cursor-cloud-mcp"],
      "env": {
        "CURSOR_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Installed globally:

```json
{
  "mcpServers": {
    "cursor-cloud": {
      "command": "cursor-cloud-mcp",
      "env": {
        "CURSOR_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | Yes | Cursor API key |
| `CURSOR_API_AUTH` | No | `basic` (default) or `bearer` |
| `CURSOR_API_BASE_URL` | No | Default `https://api.cursor.com` |

## Tools

| Tool | Description |
|------|-------------|
| `cloud_agent_get_me` | API key metadata |
| `cloud_agent_list_models` | Available models |
| `cloud_agent_create` | Create agent + initial run |
| `cloud_agent_list` | List agents |
| `cloud_agent_get` | Get agent metadata |
| `cloud_agent_create_run` | Follow-up prompt |
| `cloud_agent_list_runs` | List runs |
| `cloud_agent_get_run` | Run status and result |
| `cloud_agent_wait_for_run` | Poll until terminal |
| `cloud_agent_cancel_run` | Cancel active run |
| `cloud_agent_list_artifacts` | List artifacts |
| `cloud_agent_download_artifact` | Presigned download URL |
| `cloud_agent_archive` | Archive agent |
| `cloud_agent_unarchive` | Unarchive agent |
| `cloud_agent_delete` | Permanently delete agent |

## Develop

```bash
pnpm install
pnpm run build
pnpm test
```

## Publish

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) from GitHub Actions.

1. On npm, add trusted publisher: repo `eyueldk/cursor-cloud-mcp`, workflow `publish-npm.yml`.
2. Bump `version` in `package.json`.
3. Create a GitHub release with tag `vX.Y.Z` (e.g. `v1.0.0`).

## License

MIT
