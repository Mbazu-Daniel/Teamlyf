import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

type NavigateOpts = { scroll?: boolean };

/**
 * Next-like router shim on top of TanStack `useNavigate`.
 * Accepts plain path strings used throughout the app (`/${slug}/dashboard`, etc.).
 */
export function useAppRouter() {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      push: (to: string, _opts?: NavigateOpts) => {
        void navigate({ to: to as never });
      },
      replace: (to: string, _opts?: NavigateOpts) => {
        void navigate({ to: to as never, replace: true });
      },
      back: () => {
        window.history.back();
      },
    }),
    [navigate],
  );
}
