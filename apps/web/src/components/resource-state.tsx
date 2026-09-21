import type { ReactNode } from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import type { ApiError } from "@/lib/api";

export function ResourceState({ loading, error, isEmpty, emptyTitle, emptyCopy, onRetry, children }: {
  loading: boolean;
  error: ApiError | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyCopy?: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (loading) return <section className="surface grid min-h-64 place-items-center rounded-2xl p-6 text-sm text-muted-foreground"><span className="animate-pulse">Loading workspace data…</span></section>;
  if (error) return <section className="surface rounded-2xl p-6"><div className="flex max-w-xl gap-3"><IconAlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" /><div><h2 className="font-semibold">{error.status === 401 ? "Sign in required" : error.status === 403 ? "You don’t have access" : "We couldn’t load this"}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{error.message}</p><button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white"><IconRefresh className="size-4" />Try again</button></div></div></section>;
  if (isEmpty) return <section className="surface rounded-2xl p-8 text-center"><h2 className="font-semibold">{emptyTitle ?? "Nothing here yet"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyCopy ?? "Create the first item to give your team a shared starting point."}</p></section>;
  return <>{children}</>;
}
