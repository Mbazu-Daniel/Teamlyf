import { useState } from "react";
import { getErrorMessage } from "./error-message";

/** Success carries the value; failure carries nothing but the message already on screen. */
type AuthResult<T> = { ok: true; value: T } | { ok: false };

/**
 * One submit button's worth of state: a pending flag, the error to show, and a
 * runner that clears the error before it starts. The auth forms all need the
 * same three things and none of them justifies a form library.
 *
 * `action` takes the form's values as arguments rather than closing over them,
 * because an uncontrolled form only knows its values at submit time.
 *
 * `run` reports success as `ok`, never by the truthiness of the resolved value:
 * better-auth answers several of these calls with an empty 200, which would
 * parse to null and read as failure, stranding the user on a form that worked.
 */
export function useAuthAction<A extends unknown[], T>(
  action: (...args: A) => Promise<T>,
  fallbackError: string,
) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(...args: A): Promise<AuthResult<T>> {
    setError(null);
    setPending(true);
    try {
      return { ok: true, value: await action(...args) };
    } catch (reason) {
      setError(getErrorMessage(reason, fallbackError));
      return { ok: false };
    } finally {
      setPending(false);
    }
  }

  return { error, pending, run };
}
