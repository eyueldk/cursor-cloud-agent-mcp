import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";

import { CursorCloudAgentClient } from "../src/client.js";
import { registerCloudAgentTools } from "../src/tools.js";

function createTestPair() {
  const server = new McpServer({ name: "test", version: "1.0.0" });
  const fetchMock = vi.fn<typeof fetch>();
  const apiClient = new CursorCloudAgentClient({
    apiKey: "test-key",
    fetchImpl: fetchMock,
  });

  registerCloudAgentTools(server, apiClient);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });

  return { server, client, clientTransport, serverTransport, fetchMock };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("cloud agent MCP tools", () => {
  it("registers all expected tools", async () => {
    const { server, client, clientTransport, serverTransport } =
      createTestPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();

    expect(names).toEqual(
      [
        "cloud_agent_archive",
        "cloud_agent_cancel_run",
        "cloud_agent_create",
        "cloud_agent_create_run",
        "cloud_agent_delete",
        "cloud_agent_download_artifact",
        "cloud_agent_get",
        "cloud_agent_get_me",
        "cloud_agent_get_run",
        "cloud_agent_list",
        "cloud_agent_list_artifacts",
        "cloud_agent_list_models",
        "cloud_agent_list_runs",
        "cloud_agent_unarchive",
        "cloud_agent_wait_for_run",
      ].sort(),
    );

    await client.close();
    await server.close();
  });

  it("cloud_agent_get_me returns API key metadata", async () => {
    const { server, client, clientTransport, serverTransport, fetchMock } =
      createTestPair();

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        apiKeyName: "CI Key",
        userId: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        userEmail: "dev@example.com",
      }),
    );

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "cloud_agent_get_me",
      arguments: {},
    });

    expect(result.isError).not.toBe(true);
    const text = result.content[0];
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      const parsed = JSON.parse(text.text);
      expect(parsed.apiKeyName).toBe("CI Key");
      expect(parsed.userEmail).toBe("dev@example.com");
    }

    await client.close();
    await server.close();
  });

  it("cloud_agent_create forwards body to the API", async () => {
    const { server, client, clientTransport, serverTransport, fetchMock } =
      createTestPair();

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        agent: {
          id: "bc-99",
          name: "README",
          status: "ACTIVE",
          url: "https://cursor.com/agents/bc-99",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        run: {
          id: "run-99",
          agentId: "bc-99",
          status: "CREATING",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "cloud_agent_create",
      arguments: {
        prompt: { text: "Add setup docs" },
        repos: [
          {
            url: "https://github.com/acme/app",
            startingRef: "main",
          },
        ],
      },
    });

    expect(result.isError).not.toBe(true);
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      prompt: { text: "Add setup docs" },
    });

    await client.close();
    await server.close();
  });

  it("returns isError when the API fails", async () => {
    const { server, client, clientTransport, serverTransport, fetchMock } =
      createTestPair();

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Not found" }, 404),
    );

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "cloud_agent_get",
      arguments: { agentId: "bc-missing" },
    });

    expect(result.isError).toBe(true);
    const text = result.content[0];
    if (text?.type === "text") {
      const parsed = JSON.parse(text.text);
      expect(parsed.status).toBe(404);
    }

    await client.close();
    await server.close();
  });
});
