import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "./helpers.js";
import {
  CursorApiError,
  CursorCloudAgentClient,
  createClientFromEnv,
  DEFAULT_API_BASE_URL,
} from "../src/client.js";


describe("CursorCloudAgentClient", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends Basic auth by default", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ apiKeyName: "Test", createdAt: "2026-01-01T00:00:00.000Z" }),
    );

    const client = new CursorCloudAgentClient({
      apiKey: "key_abc",
      fetchImpl: fetchMock,
    });

    await client.getMe();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(`${DEFAULT_API_BASE_URL}/v1/me`);
    expect(init?.headers).toMatchObject({
      Authorization: `Basic ${Buffer.from("key_abc:").toString("base64")}`,
    });
  });

  it("sends Bearer auth when configured", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ apiKeyName: "Test", createdAt: "2026-01-01T00:00:00.000Z" }),
    );

    const client = new CursorCloudAgentClient({
      apiKey: "key_abc",
      authMode: "bearer",
      fetchImpl: fetchMock,
    });

    await client.getMe();

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer key_abc",
    });
  });

  it("creates an agent with prompt and repos", async () => {
    const responseBody = {
      agent: {
        id: "bc-1",
        name: "Task",
        status: "ACTIVE",
        url: "https://cursor.com/agents/bc-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        latestRunId: "run-1",
      },
      run: {
        id: "run-1",
        agentId: "bc-1",
        status: "CREATING",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(responseBody));

    const client = new CursorCloudAgentClient({
      apiKey: "key",
      fetchImpl: fetchMock,
    });

    const result = await client.createAgent({
      prompt: { text: "Add a README" },
      repos: [{ url: "https://github.com/org/repo", startingRef: "main" }],
      autoCreatePR: true,
    });

    expect(result).toEqual(responseBody);
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      prompt: { text: "Add a README" },
      repos: [{ url: "https://github.com/org/repo", startingRef: "main" }],
      autoCreatePR: true,
    });
  });

  it("lists agents with query parameters", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        items: [],
        nextCursor: "bc-next",
      }),
    );

    const client = new CursorCloudAgentClient({
      apiKey: "key",
      fetchImpl: fetchMock,
    });

    await client.listAgents({ limit: 10, includeArchived: false });

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("includeArchived")).toBe("false");
  });

  it("gets a run by agent and run id", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: "run-1",
        agentId: "bc-1",
        status: "FINISHED",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:01:00.000Z",
        result: "Done",
      }),
    );

    const client = new CursorCloudAgentClient({
      apiKey: "key",
      fetchImpl: fetchMock,
    });

    const run = await client.getRun("bc-1", "run-1");
    expect(run.status).toBe("FINISHED");
    expect(run.result).toBe("Done");

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/v1/agents/bc-1/runs/run-1");
  });

  it("throws CursorApiError on non-2xx responses", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "agent_busy", code: "agent_busy" }, 409),
    );

    const client = new CursorCloudAgentClient({
      apiKey: "key",
      fetchImpl: fetchMock,
    });

    await expect(
      client.createRun("bc-1", { prompt: { text: "follow up" } }),
    ).rejects.toMatchObject({
      name: "CursorApiError",
      status: 409,
      message: "agent_busy",
    } satisfies Partial<CursorApiError>);
  });

  it("waits until run reaches a terminal state", async () => {
    vi.useFakeTimers();

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          id: "run-1",
          agentId: "bc-1",
          status: "RUNNING",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "run-1",
          agentId: "bc-1",
          status: "FINISHED",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:01:00.000Z",
          result: "Complete",
        }),
      );

    const client = new CursorCloudAgentClient({
      apiKey: "key",
      fetchImpl: fetchMock,
    });

    const waitPromise = client.waitForRun("bc-1", "run-1", {
      pollIntervalMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);
    const run = await waitPromise;

    expect(run.status).toBe("FINISHED");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("downloads artifact with path query", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        url: "https://example.com/file",
        expiresAt: "2026-01-01T01:00:00.000Z",
      }),
    );

    const client = new CursorCloudAgentClient({
      apiKey: "key",
      fetchImpl: fetchMock,
    });

    const download = await client.downloadArtifact(
      "bc-1",
      "artifacts/screenshot.png",
    );

    expect(download.url).toContain("https://");
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get("path")).toBe("artifacts/screenshot.png");
  });

  it("throws when the API returns empty JSON on success", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new CursorCloudAgentClient({
      apiKey: "key",
      fetchImpl: fetchMock,
    });

    await expect(client.getMe()).rejects.toMatchObject({
      name: "CursorApiError",
      message: /empty or invalid JSON/i,
    });
  });
});

describe("createClientFromEnv", () => {
  it("requires CURSOR_API_KEY", () => {
    expect(() => createClientFromEnv({})).toThrow(/CURSOR_API_KEY/);
  });

  it("uses bearer auth when CURSOR_API_AUTH=bearer", () => {
    const client = createClientFromEnv({
      CURSOR_API_KEY: "test-key",
      CURSOR_API_AUTH: "bearer",
    });
    expect(client).toBeInstanceOf(CursorCloudAgentClient);
  });
});
