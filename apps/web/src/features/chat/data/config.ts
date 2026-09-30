import { API_ORIGIN, API_VERSION_PATH, LIVEKIT_ORIGIN, WS_ORIGIN } from "@/lib/api/origin";

export const CONFIG = {
  API_URL: API_ORIGIN,
  API_BASE_PATH: API_VERSION_PATH,
  WS_URL: WS_ORIGIN,
  LIVEKIT_URL: LIVEKIT_ORIGIN,

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
      ATTACHMENTS: (organizationId: string) =>
        `/organization/${organizationId}/attachments/initiate`,
    },
    CALLS: {
      JOIN: (organizationId: string, callId: string) =>
        `/organization/${organizationId}/calls/${callId}/join`,
    },
  },

  WS: {
    PATH: (organizationId: string, endpoint: string) =>
      `/organization/${organizationId}/${endpoint}`,
  },
};
