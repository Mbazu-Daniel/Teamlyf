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

      const invitationReturn = sessionStorage.getItem("teamlyf:invitation-return");
      sessionStorage.removeItem("teamlyf:invitation-return");
      if (invitationReturn?.startsWith("/accept-invite?")) {
        const url = new URL(invitationReturn, window.location.origin);
        if (url.origin === window.location.origin && url.pathname === "/accept-invite") {
          window.location.assign(url.pathname + url.search);
          return;
        }
      }

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
