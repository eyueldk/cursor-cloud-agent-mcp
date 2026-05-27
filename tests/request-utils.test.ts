import { describe, expect, it } from "vitest";

import {
  appendQueryParams,
  buildApiRequest,
  buildPath,
  encodePathParam,
} from "../src/request-utils.js";

describe("encodePathParam", () => {
  it("encodes special characters", () => {
    expect(encodePathParam("bc/special id")).toBe(
      "bc%2Fspecial%20id",
    );
  });
});

describe("buildPath", () => {
  it("substitutes and encodes path parameters", () => {
    expect(
      buildPath("/v1/agents/{agentId}/runs/{runId}", {
        agentId: "bc-1",
        runId: "run/special",
      }),
    ).toBe("/v1/agents/bc-1/runs/run%2Fspecial");
  });

  it("returns the template when no params are provided", () => {
    expect(buildPath("/v1/me")).toBe("/v1/me");
  });

  it("throws when a placeholder is missing a value", () => {
    expect(() =>
      buildPath("/v1/agents/{agentId}", {}),
    ).toThrow(/Missing path parameter: agentId/);
  });
});

describe("appendQueryParams", () => {
  it("sets encoded query values and skips nullish entries", () => {
    const url = new URL("https://api.cursor.com/v1/agents");
    appendQueryParams(url, {
      limit: 10,
      includeArchived: false,
      cursor: undefined,
      prUrl: null,
      prUrlFilter: "https://github.com/org/repo/pull/1",
    });

    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("includeArchived")).toBe("false");
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.has("prUrl")).toBe(false);
    expect(url.searchParams.get("prUrlFilter")).toBe(
      "https://github.com/org/repo/pull/1",
    );
  });
});

describe("buildApiRequest", () => {
  it("builds a GET request with path and query params", () => {
    const { url, init } = buildApiRequest({
      baseUrl: "https://api.cursor.com",
      method: "GET",
      path: "/v1/agents/{agentId}/artifacts/download",
      pathParams: { agentId: "bc-1" },
      query: { path: "artifacts/screenshot.png" },
      headers: { Authorization: "Bearer token" },
    });

    expect(url.toString()).toBe(
      "https://api.cursor.com/v1/agents/bc-1/artifacts/download?path=artifacts%2Fscreenshot.png",
    );
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer token",
    });
  });

  it("builds a POST request with JSON body", () => {
    const { url, init } = buildApiRequest({
      baseUrl: "https://api.cursor.com/",
      method: "POST",
      path: "/v1/agents",
      body: { prompt: { text: "hello" } },
    });

    expect(url.pathname).toBe("/v1/agents");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: { text: "hello" },
    });
  });
});
