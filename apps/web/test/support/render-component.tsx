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

export function renderComponent(node: ReactNode) {
  const queryClient = new QueryClient();
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>),
  };
}

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
