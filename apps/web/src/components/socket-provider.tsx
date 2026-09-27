import { useEffect } from "react";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTenantStore } from "@/lib/store/tenant-store";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { tenantId } = useTenantStore();

  useEffect(() => {
    if (!isAuthenticated || !tenantId) {
      disconnectSocket();
      return;
    }
    const socket = getSocket(null, tenantId);
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, tenantId]);

  return <>{children}</>;
}
