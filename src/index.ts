#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createClientFromEnv } from "./client.js";
import { readPackageVersion } from "./package-meta.js";
import { registerCloudAgentTools } from "./tools.js";

export async function main(): Promise<void> {
  const client = createClientFromEnv();
  const server = new McpServer({
    name: "cursor-cloud-agent-mcp",
    version: readPackageVersion(),
  });

  registerCloudAgentTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const entryPath = process.argv[1];
if (entryPath !== undefined) {
  const entryUrl = pathToFileURL(entryPath).href;
  if (import.meta.url === entryUrl) {
    main().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exit(1);
    });
  }
}
