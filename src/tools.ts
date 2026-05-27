import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { CursorApiError, CursorCloudAgentClient } from "./client.js";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

const promptSchema = z.object({
  text: z.string().min(1).describe("Instruction text for the agent or run"),
  images: z
    .array(
      z.union([
        z.object({
          data: z.string().describe("Base64-encoded image bytes"),
          mimeType: z
            .enum(["image/png", "image/jpeg", "image/gif", "image/webp"])
            .describe("MIME type for base64 image data"),
        }),
        z.object({
          url: z.url().describe("HTTP(S) URL for Cursor to fetch"),
        }),
      ]),
    )
    .optional()
    .describe("Optional image inputs (max 5 per API)"),
});

const repoSchema = z.object({
  url: z.url().describe("GitHub repository URL, e.g. https://github.com/org/repo"),
  startingRef: z
    .string()
    .optional()
    .describe("Branch name or commit SHA (ignored when prUrl is set)"),
  prUrl: z.url().optional().describe("GitHub pull request URL to work on"),
});

const modelSchema = z.object({
  id: z.string().describe("Model ID from cloud_agent_list_models"),
  params: z
    .array(
      z.object({
        id: z.string(),
        value: z.string(),
      }),
    )
    .optional()
    .describe("Per-model parameters supported by the selected model"),
});

const createAgentInputSchema = z.object({
  prompt: promptSchema,
  model: modelSchema.optional(),
  name: z.string().max(100).optional(),
  repos: z.array(repoSchema).max(20).optional(),
  workOnCurrentBranch: z.boolean().optional(),
  autoCreatePR: z.boolean().optional(),
  skipReviewerRequest: z.boolean().optional(),
  mode: z.enum(["agent", "plan"]).optional(),
  agentId: z
    .string()
    .optional()
    .describe("Client-supplied id for idempotent creates (bc-...)"),
});

export function registerCloudAgentTools(
  server: McpServer,
  client: CursorCloudAgentClient,
): void {
  server.registerTool(
    "cloud_agent_get_me",
    {
      title: "Get API key info",
      description:
        "Returns metadata about the Cursor API key in use (name, owner, creation time).",
      inputSchema: z.object({}),
      annotations: readOnlyAnnotations,
    },
    async () => runTool(() => client.getMe()),
  );

  server.registerTool(
    "cloud_agent_list_models",
    {
      title: "List available models",
      description:
        "Lists models and parameters you can pass when creating a cloud agent.",
      inputSchema: z.object({}),
      annotations: readOnlyAnnotations,
    },
    async () => runTool(() => client.listModels()),
  );

  server.registerTool(
    "cloud_agent_create",
    {
      title: "Create cloud agent",
      description:
        "Creates a Cursor Cloud Agent and enqueues its initial run. Returns agent and run metadata.",
      inputSchema: createAgentInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => runTool(() => client.createAgent(input)),
  );

  server.registerTool(
    "cloud_agent_list",
    {
      title: "List cloud agents",
      description: "Lists cloud agents for the authenticated user, newest first.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
        prUrl: z.url().optional(),
        includeArchived: z.boolean().optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input) => runTool(() => client.listAgents(input)),
  );

  server.registerTool(
    "cloud_agent_get",
    {
      title: "Get cloud agent",
      description:
        "Retrieves durable metadata for a cloud agent. Use cloud_agent_get_run for execution status.",
      inputSchema: z.object({
        agentId: z.string().describe("Agent ID, e.g. bc-00000000-..."),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ agentId }) => runTool(() => client.getAgent(agentId)),
  );

  server.registerTool(
    "cloud_agent_create_run",
    {
      title: "Create follow-up run",
      description:
        "Sends a follow-up prompt to an existing active cloud agent. Only one run can be active at a time.",
      inputSchema: z.object({
        agentId: z.string(),
        prompt: promptSchema,
        mode: z.enum(["agent", "plan"]).optional(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agentId, ...body }) => runTool(() => client.createRun(agentId, body)),
  );

  server.registerTool(
    "cloud_agent_list_runs",
    {
      title: "List agent runs",
      description: "Lists runs for a cloud agent, newest first.",
      inputSchema: z.object({
        agentId: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ agentId, ...query }) => runTool(() => client.listRuns(agentId, query)),
  );

  server.registerTool(
    "cloud_agent_get_run",
    {
      title: "Get run status",
      description:
        "Retrieves run status, result text, duration, and git branches when available.",
      inputSchema: z.object({
        agentId: z.string(),
        runId: z.string(),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ agentId, runId }) => runTool(() => client.getRun(agentId, runId)),
  );

  server.registerTool(
    "cloud_agent_wait_for_run",
    {
      title: "Wait for run completion",
      description:
        "Polls a run until it reaches a terminal state (FINISHED, ERROR, CANCELLED, or EXPIRED).",
      inputSchema: z.object({
        agentId: z.string(),
        runId: z.string(),
        pollIntervalMs: z
          .number()
          .int()
          .min(500)
          .optional()
          .describe("Polling interval in ms (default 3000)"),
        timeoutMs: z
          .number()
          .int()
          .min(1000)
          .optional()
          .describe("Max wait time in ms (default 600000)"),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ agentId, runId, pollIntervalMs, timeoutMs }) =>
      runTool(() => client.waitForRun(agentId, runId, { pollIntervalMs, timeoutMs })),
  );

  server.registerTool(
    "cloud_agent_cancel_run",
    {
      title: "Cancel run",
      description: "Cancels the active run for a cloud agent.",
      inputSchema: z.object({
        agentId: z.string(),
        runId: z.string(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agentId, runId }) => runTool(() => client.cancelRun(agentId, runId)),
  );

  server.registerTool(
    "cloud_agent_list_artifacts",
    {
      title: "List artifacts",
      description:
        "Lists artifacts produced by a cloud agent under the workspace artifacts/ directory.",
      inputSchema: z.object({
        agentId: z.string(),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ agentId }) => runTool(() => client.listArtifacts(agentId)),
  );

  server.registerTool(
    "cloud_agent_download_artifact",
    {
      title: "Download artifact URL",
      description:
        "Returns a temporary presigned URL for an artifact path from cloud_agent_list_artifacts.",
      inputSchema: z.object({
        agentId: z.string(),
        path: z
          .string()
          .describe("Relative path, e.g. artifacts/screenshot.png"),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ agentId, path }) =>
      runTool(() => client.downloadArtifact(agentId, path)),
  );

  server.registerTool(
    "cloud_agent_archive",
    {
      title: "Archive agent",
      description:
        "Archives a cloud agent (soft delete). Archived agents cannot accept new runs until unarchived.",
      inputSchema: z.object({
        agentId: z.string(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agentId }) => runTool(() => client.archiveAgent(agentId)),
  );

  server.registerTool(
    "cloud_agent_unarchive",
    {
      title: "Unarchive agent",
      description: "Unarchives a cloud agent so it can accept new runs again.",
      inputSchema: z.object({
        agentId: z.string(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agentId }) => runTool(() => client.unarchiveAgent(agentId)),
  );

  server.registerTool(
    "cloud_agent_delete",
    {
      title: "Delete agent permanently",
      description:
        "Permanently deletes a cloud agent. This is irreversible; prefer cloud_agent_archive for soft delete.",
      inputSchema: z.object({
        agentId: z.string(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agentId }) => runTool(() => client.deleteAgent(agentId)),
  );
}

async function runTool(action: () => Promise<unknown>) {
  try {
    return toolResult(await action());
  } catch (error) {
    return toolError(error);
  }
}

function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function toolError(error: unknown) {
  if (error instanceof CursorApiError) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: error.message,
              status: error.status,
              body: error.body,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ error: message }, null, 2) },
    ],
    isError: true,
  };
}
