import { useState } from "react";
import { getErrorMessage } from "./error-message";

type AuthResult<T> = { ok: true; value: T } | { ok: false };

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
