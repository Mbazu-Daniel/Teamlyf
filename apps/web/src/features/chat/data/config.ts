function readPublicEnv(key: string): string | undefined {
  const meta = import.meta.env as unknown as Record<string, string | undefined>;
  return meta[key]?.trim() || undefined;
}

function normalizePublicUrl(raw: string | undefined): string {
  const value = (raw || "").trim().replace(/\/+$/, "");
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  return `https://${value}`;
}

/** Chat-only slice of the source repo's CONFIG: sockets, LiveKit and the two endpoints the feature calls directly. */
export const CONFIG = {
  API_URL: normalizePublicUrl(readPublicEnv("VITE_API_URL")),
  API_BASE_PATH: "/api/v1",
  WS_URL: normalizePublicUrl(readPublicEnv("VITE_WS_URL")),
  LIVEKIT_URL: normalizePublicUrl(readPublicEnv("VITE_LIVEKIT_URL")),

  STORAGE_KEYS: {
    AUTH_PERSIST: "auth",
    TENANT_PERSIST: "tenant",
  },

  TIMEOUTS: {
    API_STAGGER: 50,
    UI_FEEDBACK: 3500,
    DEBOUNCE: 500,
    RECONNECT_DELAY: 1000,
    RECONNECT_MAX_DELAY: 5000,
  },

  LIMITS: {
    RECONNECT_ATTEMPTS: 10,
  },

  ROUTES: {
    LOGIN: "/sign-in",
  },

  API_ENDPOINTS: {
    FILES: {
      ATTACHMENTS: (organizationId: string) => `/organization/${organizationId}/attachments/initiate`,
    },
    CALLS: {
      JOIN: (organizationId: string, callId: string) =>
        `/organization/${organizationId}/calls/${callId}/join`,
    },
  },

  WS: {
    PATH: (organizationId: string, endpoint: string) => `/organization/${organizationId}/${endpoint}`,
  },
};
