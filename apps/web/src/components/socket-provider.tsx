import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTenantStore } from "@/lib/store/tenant-store";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  const { tenantId } = useTenantStore();
  useEffect(() => {
    const socket = getSocket(accessToken as string, tenantId!);
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [tenantId, accessToken]);

  return <>{children}</>;
}
