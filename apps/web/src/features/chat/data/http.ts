import { client } from "@/lib/api/client";

type QueryParams = Record<string, string | number | undefined>;

type RequestConfig = {
  params?: QueryParams;
  headers?: Record<string, string>;
};

// oxlint-disable-next-line typescript/no-explicit-any
type Untyped = any;

async function call<T = Untyped>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<{ data: T }> {
  const init: RequestInit = { method };
  if (method !== "GET" && data !== undefined) init.body = JSON.stringify(data);
  if (config?.headers) init.headers = config.headers;

  const body = await client.request<T>(
    path,
    config?.params ? { ...init, query: config.params } : init,
  );
  return { data: body };
}

const api = {
  get: <T = Untyped>(path: string, config?: RequestConfig) =>
    call<T>("GET", path, undefined, config),
  post: <T = Untyped>(path: string, data?: unknown, config?: RequestConfig) =>
    call<T>("POST", path, data, config),
  put: <T = Untyped>(path: string, data?: unknown, config?: RequestConfig) =>
    call<T>("PUT", path, data, config),
  patch: <T = Untyped>(path: string, data?: unknown, config?: RequestConfig) =>
    call<T>("PATCH", path, data, config),
  delete: <T = Untyped>(path: string, data?: unknown, config?: RequestConfig) =>
    call<T>("DELETE", path, data, config),
};

export default api;
