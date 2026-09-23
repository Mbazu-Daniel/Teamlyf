import { client } from "../api";

export type CallTokenResponse = { token: string; roomName: string };

export const callsApi = {
  token(organizationId: string, roomName: string) {
    return client.request<CallTokenResponse>(
      "/organization/" + organizationId + "/calls/token",
      { method: "POST", body: JSON.stringify({ roomName }) },
    );
  },
};
