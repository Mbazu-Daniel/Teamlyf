import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "./api";
import { queryKeys } from "./queryKeys";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: getSession,
    staleTime: 60_000,
    retry: false,
  });
}

export function useResetSession() {
  const queryClient = useQueryClient();
  return () => queryClient.removeQueries({ queryKey: queryKeys.session });
}

export function BootScreen() {
  return (
    <div className="grid min-h-svh place-items-center bg-background text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

export function SessionGate({ children }: Readonly<{ children: ReactNode }>) {
  const { data, isPending } = useSession();

  if (isPending) return <BootScreen />;
  if (!data) return <Navigate to="/sign-in" />;
  return <>{children}</>;
}
