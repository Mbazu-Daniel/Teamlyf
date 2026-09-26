import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "./api";
import { queryKeys } from "./queryKeys";

/** Single session read shared by every guard and by ownership checks (task comments), cached for a minute. */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: getSession,
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * Drop the cached session so the next gate reads the server. Call it after
 * sign in, sign up and sign out: the guard caches the answer for a minute,
 * and a stale value would send the user to the wrong route. Removing the
 * entry (rather than invalidating it) keeps the gate in its pending state
 * while it refetches, so it never flashes a stale decision.
 */
export function useResetSession() {
  const queryClient = useQueryClient();
  return () => queryClient.removeQueries({ queryKey: queryKeys.session });
}

/** Blank frame shown while the session or workspace resolves. */
export function BootScreen() {
  return (
    <div className="grid min-h-svh place-items-center bg-background text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

/**
 * Holds a private route until the session is known, then sends
 * signed-out visitors to /sign-in. Wraps the app shell and the
 * workspace picker; public pages never render this.
 */
export function SessionGate({ children }: Readonly<{ children: ReactNode }>) {
  const { data, isPending } = useSession();

  if (isPending) return <BootScreen />;
  if (!data) return <Navigate to="/sign-in" />;
  return <>{children}</>;
}
