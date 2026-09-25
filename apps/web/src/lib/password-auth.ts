import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useResetSession } from "./session";
import { getOrganizations, getSession } from "./api";

function credentials(form: FormData): { email: string; password: string } {
  return {
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
}

/**
 * Shared email+password submit flow for the sign-in and sign-up routes.
 * `authenticate` performs the API call; `fallbackError` is shown when it rejects
 * with something that carries no message of its own; `destination` is where the
 * account lands — sign-up drops straight into the workspace step that starts
 * onboarding, while sign-in opens the app and lets the guard forward accounts
 * that have no workspace yet to the same picker.
 */
export function usePasswordAuth(
  authenticate: (credentials: { email: string; password: string }) => Promise<unknown>,
  fallbackError: string,
  destination: "/projects" | "/workspaces" | null = null,
) {
  const navigate = useNavigate();
  const resetSession = useResetSession();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      await authenticate(credentials(form));
      // The guard caches the previous answer; drop it or it bounces us back here.
      resetSession();
      await navigate({ to: destination });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : fallbackError);
    } finally {
      setPending(false);
    }
  }

  return { error, pending, submit };
}
