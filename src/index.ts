#!/usr/bin/env node

import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createClientFromEnv } from "./client.js";
import { registerCloudAgentTools } from "./tools.js";

export async function main(): Promise<void> {
  const client = createClientFromEnv();
  const server = new McpServer({
    name: "cursor-cloud-agent",
    version: "1.0.0",
  });

  registerCloudAgentTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
