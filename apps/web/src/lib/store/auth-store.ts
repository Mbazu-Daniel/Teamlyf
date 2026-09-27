import { useMemo } from "react";
import { useSession } from "@/lib/session";

/**
 * Chat feature view over the better-auth session.
 *
 * The source repo kept a persisted auth store with a bearer token; sessions
 * here travel as http-only cookies, so `accessToken` stays null and the socket
 * layer authenticates from the handshake cookies instead.
 */
interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  sessionBootstrapped: boolean;
}

export function useAuthStore(): AuthState;
export function useAuthStore<T>(selector: (state: AuthState) => T): T;
export function useAuthStore<T>(selector?: (state: AuthState) => T): AuthState | T {
  const { data, isPending } = useSession();

  const state = useMemo<AuthState>(() => {
    const user = data?.user;
    return {
      user: user ? { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined } : null,
      accessToken: null,
      isAuthenticated: !!user,
      sessionBootstrapped: !isPending,
    };
  }, [data, isPending]);

  return selector ? selector(state) : state;
}
