import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProjects } from "@/features/projects";
import type { Project } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import {
  PROJECTS_URL,
  countCalls,
  jsonResponse,
  renderWithQueryClient,
  stubFetch,
  submitEvent,
} from "./support/query-hooks";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useProjects", () => {
  it("createProject_whenSubmitted_postsProject_clearsForm_andRefetchesList", async () => {
    const existing: Project = {
      id: "p0",
      name: "Existing",
      identifier: "OLD",
      description: null,
      emoji: null,
    };
    const created: Project = {
      id: "p1",
      name: "Roadmap",
      identifier: "RDM",
      description: "Q4 plan",
      emoji: null,
    };
    let projects = [existing];
    const fetchMock = stubFetch((url, init) => {
      const method = init?.method ?? "GET";
      if (method === "POST" && url.endsWith(PROJECTS_URL)) {
        projects = [created, ...projects];
        return jsonResponse(created);
      }
      if (method === "GET" && url.endsWith(PROJECTS_URL)) return jsonResponse(projects);
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    const { queryClient, result } = renderWithQueryClient(() => useProjects("org-1"));
    await waitFor(() => expect(result.current.projects).toHaveLength(1));

    act(() => {
      result.current.setName("  Roadmap  ");
      result.current.setIdentifier("  rdm  ");
      result.current.setDescription("Q4 plan");
    });
    act(() => {
      result.current.createProject(submitEvent());
    });

    // Trims only; the identifier casing the user typed is what gets sent.
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(PROJECTS_URL),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Roadmap", identifier: "rdm", description: "Q4 plan" }),
        }),
      ),
    );
    await waitFor(() => expect(result.current.name).toBe(""));
    expect(result.current.identifier).toBe("");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    // Invalidation re-reads the list from the server under the reserved key.
    await waitFor(() => expect(countCalls(fetchMock, "GET", PROJECTS_URL)).toBe(2));
    expect(queryClient.getQueryData(queryKeys.projects("org-1"))).toEqual([created, existing]);
    expect(result.current.projects.map((item) => item.id)).toEqual(["p1", "p0"]);
  });

  it("createProject_whenApiRejects_surfacesMessage_andKeepsFormValues", async () => {
    const fetchMock = stubFetch((url, init) => {
      const method = init?.method ?? "GET";
      if (method === "POST" && url.endsWith(PROJECTS_URL)) {
        return jsonResponse({ code: "CONFLICT", message: "Identifier already exists" }, 409);
      }
      if (method === "GET" && url.endsWith(PROJECTS_URL)) return jsonResponse([]);
      throw new Error(`Unexpected request: ${method} ${url}`);
    });

    const { result } = renderWithQueryClient(() => useProjects("org-1"));
    act(() => {
      result.current.setName("Roadmap");
      result.current.setIdentifier("RDM");
    });
    act(() => {
      result.current.createProject(submitEvent());
    });

    await waitFor(() => expect(result.current.error).toBe("Identifier already exists"));
    expect(result.current.loading).toBe(false);
    expect(result.current.name).toBe("Roadmap");
    expect(result.current.identifier).toBe("RDM");
    expect(countCalls(fetchMock, "POST", PROJECTS_URL)).toBe(1);
  });

  it("createProject_whenOrganizationMissing_neverCallsApi", async () => {
    const fetchMock = stubFetch(() => {
      throw new Error("The API must not be called without an organization");
    });

    const { result } = renderWithQueryClient(() => useProjects(undefined));

    await waitFor(() => expect(result.current.projectsLoading).toBe(false));
    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
