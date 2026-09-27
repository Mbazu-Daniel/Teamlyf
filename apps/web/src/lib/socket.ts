import { io, type Socket } from "socket.io-client";

type SocketOptions = {
  transports: ["websocket"];
  withCredentials: boolean;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
};

const wsBase = (import.meta.env.VITE_WS_URL as string | undefined)?.trim().replace(/\/+$/, "") ?? "";

/**
 * One chat socket per organization. The handshake carries the better-auth
 * session cookie, so the token argument from the old bearer-token client is
 * accepted for call-site compatibility and ignored.
 */
let socket: Socket | null = null;
let socketOrganizationId: string | null = null;

function connect(organizationId: string): Socket {
  const options: SocketOptions = {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  };

  const url = `${wsBase}/organization/${organizationId}/chat`;
  return io(url, options);
}

export function getSocket(_token: string | null, organizationId: string): Socket {
  if (socket && socketOrganizationId !== organizationId) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    socket = connect(organizationId);
    socketOrganizationId = organizationId;
  }
  return socket;
}
