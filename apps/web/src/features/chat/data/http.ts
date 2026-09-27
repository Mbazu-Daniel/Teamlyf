import { client } from "@/lib/api/client";

/**
 * Axios-shaped facade for the chat feature.
 *
 * The ported call sites expect `api.get(url, { params })` / `api.post(url, body)`
 * resolving to `{ data }`; the app's fetch client speaks a slightly different
 * dialect, so the translation lives here instead of in forty call sites.
 */
type QueryParams = Record<string, string | number | undefined>;

type RequestConfig = {
  params?: QueryParams;
  headers?: Record<string, string>;
};

// Call sites are ported verbatim and destructure `res.data` without generics, so
// an untyped response keeps them honest instead of guessing a shape twice.
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
  get: <T = Untyped>(path: string, config?: RequestConfig) => call<T>("GET", path, undefined, config),
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
