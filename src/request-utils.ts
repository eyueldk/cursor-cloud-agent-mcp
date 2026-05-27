export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type BuildApiRequestInput = {
  baseUrl: string;
  method: string;
  path: string;
  pathParams?: Record<string, string | number>;
  query?: Record<string, QueryParamValue>;
  body?: unknown;
  headers?: Record<string, string | undefined>;
};

export type BuiltApiRequest = {
  url: URL;
  init: RequestInit;
};

const PATH_PARAM_PATTERN = /\{([^}]+)\}/g;

export function encodePathParam(value: string | number): string {
  return encodeURIComponent(String(value));
}

export function buildPath(
  pathTemplate: string,
  pathParams?: Record<string, string | number>,
): string {
  const hasPlaceholders = PATH_PARAM_PATTERN.test(pathTemplate);
  PATH_PARAM_PATTERN.lastIndex = 0;

  if (!hasPlaceholders) {
    return pathTemplate;
  }

  return pathTemplate.replace(PATH_PARAM_PATTERN, (_match, key: string) => {
    const value = pathParams?.[key];
    if (value === undefined) {
      throw new Error(`Missing path parameter: ${key}`);
    }
    return encodePathParam(value);
  });
}

export function appendQueryParams(
  url: URL,
  query?: Record<string, QueryParamValue>,
): void {
  if (!query) {
    return;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
}

export function buildApiRequest(input: BuildApiRequestInput): BuiltApiRequest {
  const base = input.baseUrl.replace(/\/$/, "");
  const pathname = buildPath(input.path, input.pathParams);
  const url = new URL(`${base}${pathname}`);
  appendQueryParams(url, input.query);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  for (const [key, value] of Object.entries(input.headers ?? {})) {
    if (value !== undefined) {
      headers[key] = value;
    }
  }

  let body: string | undefined;
  if (input.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(input.body);
  }

  return {
    url,
    init: {
      method: input.method,
      headers,
      body,
    },
  };
}

export async function parseJsonResponse(
  response: Response,
): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
