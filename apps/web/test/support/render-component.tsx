import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/** Renders a feature component under a fresh QueryClient, the way the app mounts it. */
export function renderComponent(node: ReactNode) {
  const queryClient = new QueryClient();
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>),
  };
}

/**
 * Renders `node` inside a router context so its <Link>s resolve.
 *
 * RouterProvider renders matched routes rather than children, which is wrong
 * for a test that already holds the component; the context provider is the
 * seam the library exposes for exactly this. The stub route exists only so the
 * router has something to match.
 */
export function renderWithRouter(node: ReactNode) {
  const rootRoute = createRootRoute();
  const stubRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([stubRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return {
    router,
    ...render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterContextProvider router={router}>{node}</RouterContextProvider>
      </QueryClientProvider>,
    ),
  };
}
