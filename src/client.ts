import {
  buildApiRequest,
  parseJsonResponse,
  type QueryParamValue,
} from "./request-utils.js";

export const DEFAULT_API_BASE_URL = "https://api.cursor.com";

const TERMINAL_RUN_STATUSES = new Set([
  "FINISHED",
  "ERROR",
  "CANCELLED",
  "EXPIRED",
]);

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
    return this.request<MeResponse>("GET", "/v1/me");
  }

  listModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>("GET", "/v1/models");
  }

  createAgent(body: CreateAgentRequest): Promise<CreateAgentResponse> {
    return this.request<CreateAgentResponse>("POST", "/v1/agents", { body });
  }

  listAgents(query?: {
    limit?: number;
    cursor?: string;
    prUrl?: string;
    includeArchived?: boolean;
  }): Promise<PaginatedAgents> {
    return this.request<PaginatedAgents>("GET", "/v1/agents", { query });
  }

  getAgent(agentId: string): Promise<AgentSummary> {
    return this.request<AgentSummary>("GET", "/v1/agents/{agentId}", {
      pathParams: { agentId },
    });
  }

  createRun(agentId: string, body: CreateRunRequest): Promise<CreateRunResponse> {
    return this.request<CreateRunResponse>("POST", "/v1/agents/{agentId}/runs", {
      pathParams: { agentId },
      body,
    });
  }

  listRuns(
    agentId: string,
    query?: { limit?: number; cursor?: string },
  ): Promise<PaginatedRuns> {
    return this.request<PaginatedRuns>("GET", "/v1/agents/{agentId}/runs", {
      pathParams: { agentId },
      query,
    });
  }

  getRun(agentId: string, runId: string): Promise<RunSummary> {
    return this.request<RunSummary>("GET", "/v1/agents/{agentId}/runs/{runId}", {
      pathParams: { agentId, runId },
    });
  }

  cancelRun(agentId: string, runId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      "POST",
      "/v1/agents/{agentId}/runs/{runId}/cancel",
      { pathParams: { agentId, runId } },
    );
  }

  listArtifacts(agentId: string): Promise<{ items: ArtifactItem[] }> {
    return this.request<{ items: ArtifactItem[] }>(
      "GET",
      "/v1/agents/{agentId}/artifacts",
      { pathParams: { agentId } },
    );
  }

  downloadArtifact(
    agentId: string,
    path: string,
  ): Promise<{ url: string; expiresAt: string }> {
    return this.request<{ url: string; expiresAt: string }>(
      "GET",
      "/v1/agents/{agentId}/artifacts/download",
      { pathParams: { agentId }, query: { path } },
    );
  }

  archiveAgent(agentId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>("POST", "/v1/agents/{agentId}/archive", {
      pathParams: { agentId },
    });
  }

  unarchiveAgent(agentId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>("POST", "/v1/agents/{agentId}/unarchive", {
      pathParams: { agentId },
    });
  }

  deleteAgent(agentId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>("DELETE", "/v1/agents/{agentId}", {
      pathParams: { agentId },
    });
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
    const deadline = Date.now() + timeoutMs;

    while (true) {
      const run = await this.getRun(agentId, runId);
      if (TERMINAL_RUN_STATUSES.has(run.status)) {
        return run;
      }
      if (Date.now() >= deadline) {
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
    options?: {
      pathParams?: Record<string, string | number>;
      query?: Record<string, QueryParamValue>;
      body?: unknown;
    },
  ): Promise<T> {
    const { url, init } = buildApiRequest({
      baseUrl: this.baseUrl,
      method,
      path,
      pathParams: options?.pathParams,
      query: options?.query,
      body: options?.body,
      headers: {
        Authorization: this.authHeader(),
      },
    });

    const response = await this.fetchImpl(url, init);
    const parsed = await parseJsonResponse(response);

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
