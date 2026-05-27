export const DEFAULT_API_BASE_URL = "https://api.cursor.com";

export type CursorApiAuthMode = "basic" | "bearer";

export type CursorCloudAgentClientOptions = {
  apiKey: string;
  baseUrl?: string;
  authMode?: CursorApiAuthMode;
  fetchImpl?: typeof fetch;
};

export type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
};

export class CursorApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | undefined;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "CursorApiError";
    this.status = status;
    this.body = body;
  }
}

export type PromptImage =
  | { data: string; mimeType: string }
  | { url: string };

export type AgentPrompt = {
  text: string;
  images?: PromptImage[];
};

export type ModelParam = { id: string; value: string };

export type ModelSelection = {
  id: string;
  params?: ModelParam[];
};

export type RepoConfig = {
  url: string;
  startingRef?: string;
  prUrl?: string;
};

export type EnvConfig = {
  type: "cloud" | "pool" | "machine";
  name?: string;
};

export type CreateAgentRequest = {
  prompt: AgentPrompt;
  model?: ModelSelection;
  name?: string;
  env?: EnvConfig;
  repos?: RepoConfig[];
  workOnCurrentBranch?: boolean;
  autoCreatePR?: boolean;
  skipReviewerRequest?: boolean;
  mode?: "agent" | "plan";
  agentId?: string;
};

export type CreateRunRequest = {
  prompt: AgentPrompt;
  mode?: "agent" | "plan";
};

export type AgentSummary = {
  id: string;
  name: string;
  status: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  latestRunId?: string;
  env?: EnvConfig;
  repos?: RepoConfig[];
  workOnCurrentBranch?: boolean;
  autoCreatePR?: boolean;
};

export type RunSummary = {
  id: string;
  agentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  durationMs?: number;
  result?: string;
  git?: {
    branches: Array<{
      repoUrl: string;
      branch?: string;
      prUrl?: string;
    }>;
  };
};

export type CreateAgentResponse = {
  agent: AgentSummary;
  run: RunSummary;
};

export type CreateRunResponse = {
  run: RunSummary;
};

export type PaginatedAgents = {
  items: AgentSummary[];
  nextCursor?: string;
};

export type PaginatedRuns = {
  items: RunSummary[];
  nextCursor?: string;
};

export type ArtifactItem = {
  path: string;
  sizeBytes: number;
  updatedAt: string;
};

export type MeResponse = {
  apiKeyName: string;
  createdAt: string;
  userId?: number;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
};

export type ModelInfo = {
  id: string;
  name?: string;
  params?: Array<{ id: string; name?: string }>;
};

export type ModelsResponse = {
  items: ModelInfo[];
};

export class CursorCloudAgentClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly authMode: CursorApiAuthMode;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CursorCloudAgentClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
    this.authMode = options.authMode ?? "basic";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  getMe(): Promise<MeResponse> {
    return this.request("GET", "/v1/me");
  }

  listModels(): Promise<ModelsResponse> {
    return this.request("GET", "/v1/models");
  }

  createAgent(body: CreateAgentRequest): Promise<CreateAgentResponse> {
    return this.request("POST", "/v1/agents", body);
  }

  listAgents(query?: {
    limit?: number;
    cursor?: string;
    prUrl?: string;
    includeArchived?: boolean;
  }): Promise<PaginatedAgents> {
    return this.request("GET", "/v1/agents", undefined, query);
  }

  getAgent(agentId: string): Promise<AgentSummary> {
    return this.request("GET", `/v1/agents/${encodeURIComponent(agentId)}`);
  }

  createRun(agentId: string, body: CreateRunRequest): Promise<CreateRunResponse> {
    return this.request(
      "POST",
      `/v1/agents/${encodeURIComponent(agentId)}/runs`,
      body,
    );
  }

  listRuns(
    agentId: string,
    query?: { limit?: number; cursor?: string },
  ): Promise<PaginatedRuns> {
    return this.request(
      "GET",
      `/v1/agents/${encodeURIComponent(agentId)}/runs`,
      undefined,
      query,
    );
  }

  getRun(agentId: string, runId: string): Promise<RunSummary> {
    return this.request(
      "GET",
      `/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`,
    );
  }

  cancelRun(agentId: string, runId: string): Promise<{ id: string }> {
    return this.request(
      "POST",
      `/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/cancel`,
    );
  }

  listArtifacts(agentId: string): Promise<{ items: ArtifactItem[] }> {
    return this.request(
      "GET",
      `/v1/agents/${encodeURIComponent(agentId)}/artifacts`,
    );
  }

  downloadArtifact(
    agentId: string,
    path: string,
  ): Promise<{ url: string; expiresAt: string }> {
    return this.request(
      "GET",
      `/v1/agents/${encodeURIComponent(agentId)}/artifacts/download`,
      undefined,
      { path },
    );
  }

  archiveAgent(agentId: string): Promise<{ id: string }> {
    return this.request(
      "POST",
      `/v1/agents/${encodeURIComponent(agentId)}/archive`,
    );
  }

  unarchiveAgent(agentId: string): Promise<{ id: string }> {
    return this.request(
      "POST",
      `/v1/agents/${encodeURIComponent(agentId)}/unarchive`,
    );
  }

  deleteAgent(agentId: string): Promise<{ id: string }> {
    return this.request(
      "DELETE",
      `/v1/agents/${encodeURIComponent(agentId)}`,
    );
  }

  async waitForRun(
    agentId: string,
    runId: string,
    options?: {
      pollIntervalMs?: number;
      timeoutMs?: number;
    },
  ): Promise<RunSummary> {
    const pollIntervalMs = options?.pollIntervalMs ?? 3000;
    const timeoutMs = options?.timeoutMs ?? 600_000;
    const terminal = new Set([
      "FINISHED",
      "ERROR",
      "CANCELLED",
      "EXPIRED",
    ]);
    const started = Date.now();

    while (true) {
      const run = await this.getRun(agentId, runId);
      if (terminal.has(run.status)) {
        return run;
      }
      if (Date.now() - started > timeoutMs) {
        throw new Error(
          `Run ${runId} did not reach a terminal state within ${timeoutMs}ms (last status: ${run.status})`,
        );
      }
      await sleep(pollIntervalMs);
    }
  }

  private authHeader(): string {
    if (this.authMode === "bearer") {
      return `Bearer ${this.apiKey}`;
    }
    const encoded = Buffer.from(`${this.apiKey}:`).toString("base64");
    return `Basic ${encoded}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await this.fetchImpl(url, {
      method,
      headers: {
        Authorization: this.authHeader(),
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let parsed: unknown;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
    }

    if (!response.ok) {
      const errorBody = isApiErrorBody(parsed) ? parsed : undefined;
      const message =
        errorBody?.message ??
        errorBody?.error ??
        `Cursor API ${method} ${path} failed with status ${response.status}`;
      throw new CursorApiError(response.status, message, errorBody);
    }

    return parsed as T;
  }
}

export function createClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CursorCloudAgentClient {
  const apiKey = env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CURSOR_API_KEY is required. Generate one from Cursor Dashboard → Integrations.",
    );
  }

  const authMode = env.CURSOR_API_AUTH === "bearer" ? "bearer" : "basic";

  return new CursorCloudAgentClient({
    apiKey,
    baseUrl: env.CURSOR_API_BASE_URL,
    authMode,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}
