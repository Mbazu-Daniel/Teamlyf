import { useState } from "react";
import { IconBrandGoogle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { signInSocial } from "@/lib/api";

const NOT_CONFIGURED =
  "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, then restart the API.";

/** 404/405 means the social endpoint is off; anything else is the API's own message. */
function socialSignInError(reason: unknown): string {
  const detail = reason instanceof Error ? reason.message : "";
  if (/404|405/.test(detail)) return NOT_CONFIGURED;
  return detail || "Google sign-in is not available.";
}

/**
 * "or" divider + Continue with Google.
 * Posts to the better-auth social endpoint; returns a redirect URL when Google is configured.
 */
export function SocialSignIn() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function start() {
    setMessage("");
    setPending(true);
    try {
      const result = await signInSocial({
        provider: "google",
        callbackURL: `${window.location.origin}/projects`,
      });
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }
      setMessage("Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.");
    } catch (reason) {
      setMessage(socialSignInError(reason));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={start}
        disabled={pending}
      >
        <IconBrandGoogle className="size-4" />
        {pending ? "Opening Google..." : "Continue with Google"}
      </Button>

      {message && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
