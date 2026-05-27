# cursor-cloud-agent-mcp

MCP server that wraps the [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints) so you can launch and manage cloud agents from any MCP client (Cursor, Claude Desktop, etc.).

## Install

```bash
npm install -g cursor-cloud-agent-mcp
# or use without global install:
npx cursor-cloud-agent-mcp
```

## Setup

1. Generate a Cursor API key from **Dashboard → Integrations**.
2. Configure your MCP client:

```json
{
  "mcpServers": {
    "cursor-cloud-agent": {
      "command": "cursor-cloud-agent-mcp",
      "env": {
        "CURSOR_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or with `npx`:

```json
{
  "mcpServers": {
    "cursor-cloud-agent": {
      "command": "npx",
      "args": ["-y", "cursor-cloud-agent-mcp"],
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
pnpm install
pnpm run build
pnpm test
pnpm run dev
```

HTTP requests are built via `src/request-utils.ts` (`buildApiRequest`), which encodes path params (`{agentId}`) and query params automatically.

## Publishing (maintainers)

This package uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) via GitHub Actions OIDC — no long-lived `NPM_TOKEN` is required.

### One-time npm setup

1. Create the package on [npmjs.com](https://www.npmjs.com/) (first publish must claim the name `cursor-cloud-agent-mcp`).
2. Open **Package Settings → Trusted Publisher**.
3. Add a GitHub Actions trusted publisher:
   - **Organization or user:** `eyueldk`
   - **Repository:** `cursor-cloud-mcp`
   - **Workflow filename:** `publish-npm.yml`
   - **Environment:** (leave empty unless you use a GitHub Environment)

### Release flow

1. Bump `version` in `package.json` and commit.
2. Create a GitHub Release with tag `vX.Y.Z` matching that version (e.g. tag `v1.0.1` → version `1.0.1`).
3. The [Publish to npm](.github/workflows/publish-npm.yml) workflow runs on `release: published`, verifies the version, runs tests, and publishes with provenance.

You can also trigger a publish manually from the Actions tab via **workflow_dispatch** (after trusted publishing is configured).

## License

MIT
