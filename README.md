# @eyueldk/cursor-cloud-agent-mcp

MCP server for the [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). Launch and manage cloud agents from Cursor, Claude Desktop, or any MCP client.

## Install

Run with npx (no global install required):

```bash
npx @eyueldk/cursor-cloud-agent-mcp
```

### Quick install with mcp-add

[mcp-add](https://github.com/paoloricciuti/mcp-add) writes the MCP config for Cursor for you.

1. Create an API key in **Cursor Dashboard → Integrations**.
2. Run:

```bash
npx mcp-add \
  --name cursor-cloud-agent \
  --type stdio \
  --command "npx -y @eyueldk/cursor-cloud-agent-mcp" \
  --env "CURSOR_API_KEY=your_api_key_here" \
  --scope project \
  --clients cursor \
  -y
```

Use `--scope global` for `~/.cursor/mcp.json`. Or run `npx mcp-add` interactively and use command `npx -y @eyueldk/cursor-cloud-agent-mcp`.

Reload Cursor (or enable the server under **Settings → Tools & MCP**) after installing.

## Configure

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

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

Cursor runs `npx -y @eyueldk/cursor-cloud-agent-mcp`, which downloads the package if needed and starts the MCP server on stdio.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `CURSOR_API_KEY` | Yes | Cursor API key from **Dashboard → Integrations** |
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


### First publish (404 on `@eyueldk`?)

If publish fails with **404 Not Found** for `@eyueldk/cursor-cloud-agent-mcp`:

1. Ensure the **`@eyueldk`** scope exists on your npm account (user or org).
2. Add a **Trusted Publisher** on npm: repo `eyueldk/cursor-cloud-agent-mcp`, workflow `publish-npm.yml`.
3. Or publish once from your machine:

```bash
npm login
pnpm publish:npm
```

Publishing is automatic via [GitHub Actions](.github/workflows/publish-npm.yml) and [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (no `NPM_TOKEN`).

### One-time npm setup

1. Create the **`@eyueldk`** scope on npm if needed.
2. Add a trusted publisher for **`@eyueldk/cursor-cloud-agent-mcp`**:
   - Repository: `eyueldk/cursor-cloud-agent-mcp`
   - Workflow: `publish-npm.yml`

### Automatic publish

The workflow runs when you:

- **Push to `main`** with a new `version` in `package.json` (skips if that version is already on npm)
- **Push a tag** `vX.Y.Z` matching `package.json` (e.g. `git tag v1.0.1 && git push origin v1.0.1`)
- **Publish a GitHub release** with tag `vX.Y.Z`

Typical flow:

```bash
# bump "version" in package.json, then:
git add package.json
git commit -m "chore: release v1.0.1"
git push origin main
git tag v1.0.1
git push origin v1.0.1
```

Or run manually: **Actions → Publish to npm → Run workflow** (optional `force` to republish).

CI on `main` must pass before publish steps run build + test in the publish job.

## License

MIT
