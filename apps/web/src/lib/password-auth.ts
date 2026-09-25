import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getOrganizations, getSession } from "./api";
import { useResetSession } from "./session";

function credentials(form: FormData): { email: string; password: string } {
  return {
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
}

/**
 * Shared email+password submit flow for the sign-in and sign-up routes.
 * Explicit destinations are used for onboarding. Normal sign-in restores the
 * user's last workspace and only opens the picker when none is remembered.
 */
export function usePasswordAuth(
  authenticate: (credentials: { email: string; password: string }) => Promise<unknown>,
  fallbackError: string,
  destination: "/workspaces" | null = null,
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
      resetSession();

      if (destination) {
        await navigate({ to: destination });
        return;
      }

      const session = await getSession();
      const userId = session?.user?.id;

      if (!userId) {
        await navigate({ to: "/workspaces" });
        return;
      }

      const organizations = await getOrganizations();
      const savedId = localStorage.getItem("teamlyf:last-organization-id:" + userId);
      const savedOrganization = organizations.find((organization) => organization.id === savedId);

      if (savedOrganization) {
        await navigate({
          to: "/$organizationSlug/projects",
          params: { organizationSlug: savedOrganization.slug || savedOrganization.id },
        });
      } else {
        await navigate({ to: "/workspaces" });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : fallbackError);
    } finally {
      setPending(false);
    }
  }

  return { error, pending, submit };
}
