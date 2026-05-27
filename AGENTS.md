# Agent and maintainer guide

Instructions for Cursor Cloud Agents and humans working on `@eyueldk/cursor-cloud-agent-mcp`.

## Publishing to npm (GitHub Actions)

**Always prefer the GitHub Action** (`.github/workflows/publish-npm.yml`). Do not rely on local `pnpm publish:npm` unless CI is broken or you are debugging auth.

### One-time setup (maintainer)

1. On [npm](https://www.npmjs.com/), ensure the package scope `@eyueldk` exists and you can publish `@eyueldk/cursor-cloud-agent-mcp`.
2. Configure **trusted publishing** for this repo:
   - npm → Package → **Publishing access** → **Trusted publishers**
   - Provider: **GitHub Actions**
   - Repository: `eyueldk/cursor-cloud-agent-mcp`
   - Workflow filename: `publish-npm.yml`
   - Environment: (leave empty unless you add a GitHub Environment)

The workflow uses OIDC (`id-token: write`) and `NPM_CONFIG_PROVENANCE=true` — no `NPM_TOKEN` secret is required.

The publish job upgrades to **npm 11+** before `npm publish`. Older npm versions (bundled with Node 22) fail trusted publishing with a misleading **404 Not Found** even when the package exists.

If publish still fails with 404, re-check the trusted publisher on npm matches this repo exactly (`eyueldk/cursor-cloud-agent-mcp`, workflow `publish-npm.yml`, environment blank unless you add one in the workflow).

### Before you publish

1. Bump `"version"` in `package.json` (semver).
2. Commit and push to `main` (or merge a PR into `main`).
3. Ensure `package.json` version matches the tag or workflow input you will use.

The workflow **skips** publishing if that version already exists on npm, unless `force` is `true`.

### How to trigger a publish

| Method | When to use |
|--------|-------------|
| **Push to `main`** | After changing `package.json`, `src/**`, `pnpm-lock.yaml`, or `tsconfig.json`. Runs only if the new version is not already on npm. |
| **Git tag `v*`** | e.g. `git tag v1.0.1 && git push origin v1.0.1`. Tag must match `package.json` (without the `v`). |
| **GitHub Release** | Publish a release; tag name must match `package.json` (with or without `v` prefix — workflow strips `v`). |
| **Manual workflow dispatch** | Full control; use for republish or when path filters did not run. |

#### Manual dispatch (recommended for agents with `gh` access)

From a machine logged in as a maintainer with **Actions: write** on the repo:

```bash
# Publish the version currently in package.json on main (checkout main first)
gh workflow run publish-npm.yml --ref main

# Publish a specific version (must match package.json on that ref)
gh workflow run publish-npm.yml --ref main -f version=1.0.1

# Republish even if the version already exists on npm (use sparingly)
gh workflow run publish-npm.yml --ref main -f version=1.0.0 -f force=true
```

In the GitHub UI: **Actions** → **Publish to npm** → **Run workflow** → choose branch `main`, optional **version** and **force**.

Watch the run:

```bash
gh run list --workflow=publish-npm.yml --limit 5
gh run watch
```

### Typical release flow

```bash
# 1. Bump version in package.json (e.g. 1.0.0 → 1.0.1)
# 2. Commit and push to main
git add package.json
git commit -m "chore: release v1.0.1"
git push origin main

# 3. Optional: tag for release notes
git tag v1.0.1
git push origin v1.0.1

# Or trigger manually without waiting for path-filtered push:
gh workflow run publish-npm.yml --ref main -f version=1.0.1
```

CI (`.github/workflows/ci.yml`) runs on PRs and pushes to `main`; publish runs build + test again before `npm publish`.

### Local publish (fallback only)

Requires `npm login` as a user with publish rights to `@eyueldk`:

```bash
pnpm run publish:npm
```

Local publish does not set npm provenance the same way as CI. Prefer the workflow.

### Cloud Agent limitations

The Cursor Cloud Agent integration token often **cannot** dispatch workflows (`gh workflow run` → HTTP 403). If publish is requested in a cloud session:

1. Add or update this repo with the version bump on `main`.
2. Ask the repo owner to run **Publish to npm** manually, or run the `gh workflow run` commands above locally.

## Development

```bash
pnpm install
pnpm run build
pnpm test
pnpm run dev   # stdio MCP server via tsx
```

## Repository layout

- `src/` — MCP server and Cloud Agents API client
- `tests/` — Vitest unit tests (mocked HTTP)
- `.github/workflows/ci.yml` — build and test
- `.github/workflows/publish-npm.yml` — npm publish
