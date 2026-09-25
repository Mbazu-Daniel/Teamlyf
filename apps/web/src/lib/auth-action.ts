import { useState } from "react";
import { getErrorMessage } from "./error-message";

/**
 * One submit button's worth of state: a pending flag, the error to show, and a
 * runner that clears the error before it starts. The auth forms all need the
 * same three things and none of them justifies a form library.
 *
 * `action` takes the form's values as arguments rather than closing over them,
 * because an uncontrolled form only knows its values at submit time.
 *
 * `run` resolves to `undefined` when the call failed, so the caller can branch
 * on success without waiting for the error state it cannot read yet.
 */
export function useAuthAction<A extends unknown[], T>(
  action: (...args: A) => Promise<T>,
  fallbackError: string,
) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(...args: A): Promise<T | undefined> {
    setError(null);
    setPending(true);
    try {
      return await action(...args);
    } catch (reason) {
      setError(getErrorMessage(reason, fallbackError));
      return undefined;
    } finally {
      setPending(false);
    }
  }

  return { error, pending, run };
}
