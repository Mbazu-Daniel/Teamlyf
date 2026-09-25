import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Renders a feature component under a fresh QueryClient, the way the app mounts it. */
export function renderComponent(node: ReactNode) {
  const queryClient = new QueryClient();
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>),
  };
}
