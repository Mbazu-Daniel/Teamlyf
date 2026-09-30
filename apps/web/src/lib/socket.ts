import { io, type Socket } from "socket.io-client";
import { WS_ORIGIN } from "./api/origin";

type SocketOptions = {
  transports: ["websocket"];
  withCredentials: boolean;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
};

const AUTH_ERRORS = new Set(["Unauthorized", "Forbidden"]);

let socket: Socket | null = null;
let socketOrganizationId: string | null = null;

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  socketOrganizationId = null;
}

function connect(organizationId: string): Socket {
  const options: SocketOptions = {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Number.POSITIVE_INFINITY,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  };

  const url = `${WS_ORIGIN}/organization/${organizationId}/chat`;
  const next = io(url, options);

  next.on("connect_error", (error: Error) => {
    if (!AUTH_ERRORS.has(error.message)) return;
    if (socket === next) disconnectSocket();
    else next.disconnect();
  });

  return next;
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

if (import.meta.hot) {
  import.meta.hot.dispose(() => disconnectSocket());
}
