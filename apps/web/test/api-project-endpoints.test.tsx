import { afterEach, describe, expect, it, vi } from "vitest";
import {
  commentsApi,
  labelsApi,
  milestonesApi,
  statusesApi,
  taskActivityApi,
  projectsApi,
} from "@/lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

type Call = { method: string; url: string; body: string | null };

/** Stub fetch and capture the single call a client method must have made. */
async function captureCall(run: () => Promise<unknown>): Promise<Call> {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  await run();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0]!;
  return {
    method: init?.method ?? "GET",
    url: String(input),
    body: typeof init?.body === "string" ? init.body : null,
  };
}

const ORG = "org-1";
const PROJECT = "p1";
const TASK = "t1";

describe("statusesApi", () => {
  it("getStatuses_hitsTheStatusCollectionPath_withGet", async () => {
    const call = await captureCall(() => statusesApi.getStatuses(ORG, PROJECT));
    expect(call.method).toBe("GET");
    expect(call.url).toMatch(/\/organization\/org-1\/projects\/p1\/statuses$/);
  });

  it("updateStatus_patchesTheSingleStatusPath", async () => {
    const call = await captureCall(() =>
      statusesApi.updateStatus(ORG, PROJECT, "s1", { name: "In review" }),
    );
    expect(call.method).toBe("PATCH");
    expect(call.url).toMatch(/\/statuses\/s1$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ name: "In review" });
  });

  it("reorderStatuses_patchesTheReorderRoute_withRankedIds", async () => {
    const call = await captureCall(() => statusesApi.reorderStatuses(ORG, PROJECT, ["s2", "s1"]));
    expect(call.method).toBe("PATCH");
    expect(call.url).toMatch(/\/statuses\/reorder$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ ids: ["s2", "s1"] });
  });

  it("deleteStatus_sendsDeleteToTheSingleStatusPath", async () => {
    const call = await captureCall(() => statusesApi.deleteStatus(ORG, PROJECT, "s1"));
    expect(call.method).toBe("DELETE");
    expect(call.url).toMatch(/\/statuses\/s1$/);
  });
});

describe("labelsApi", () => {
  it("createLabel_postsToTheLabelCollectionPath", async () => {
    const call = await captureCall(() => labelsApi.createLabel(ORG, PROJECT, { name: "bug" }));
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/projects\/p1\/labels$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ name: "bug" });
  });

  it("deleteLabel_sendsDeleteToTheSingleLabelPath", async () => {
    const call = await captureCall(() => labelsApi.deleteLabel(ORG, PROJECT, "l1"));
    expect(call.method).toBe("DELETE");
    expect(call.url).toMatch(/\/labels\/l1$/);
  });
});

describe("milestonesApi", () => {
  it("getMilestones_hitsTheMilestoneCollectionPath_withGet", async () => {
    const call = await captureCall(() => milestonesApi.getMilestones(ORG, PROJECT));
    expect(call.method).toBe("GET");
    expect(call.url).toMatch(/\/projects\/p1\/milestones$/);
  });

  it("createMilestoneTask_postsUnderTheMilestoneTaskPath", async () => {
    const call = await captureCall(() =>
      milestonesApi.createMilestoneTask(ORG, PROJECT, "m1", "t1"),
    );
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/milestones\/m1\/tasks\/t1$/);
  });

  it("deleteMilestoneTask_sendsDeleteUnderTheMilestoneTaskPath", async () => {
    const call = await captureCall(() =>
      milestonesApi.deleteMilestoneTask(ORG, PROJECT, "m1", "t1"),
    );
    expect(call.method).toBe("DELETE");
    expect(call.url).toMatch(/\/milestones\/m1\/tasks\/t1$/);
  });
});

describe("commentsApi", () => {
  it("createComment_postsUnderTheTaskCommentsPath", async () => {
    const call = await captureCall(() =>
      commentsApi.createComment(ORG, PROJECT, TASK, { body: "Looks good" }),
    );
    expect(call.method).toBe("POST");
    expect(call.url).toMatch(/\/tasks\/t1\/comments$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ body: "Looks good" });
  });

  it("updateComment_patchesTheSingleCommentPath", async () => {
    const call = await captureCall(() =>
      commentsApi.updateComment(ORG, PROJECT, TASK, "c1", { body: "Edited" }),
    );
    expect(call.method).toBe("PATCH");
    expect(call.url).toMatch(/\/comments\/c1$/);
  });

  it("deleteComment_sendsDeleteToTheSingleCommentPath", async () => {
    const call = await captureCall(() => commentsApi.deleteComment(ORG, PROJECT, TASK, "c1"));
    expect(call.method).toBe("DELETE");
    expect(call.url).toMatch(/\/comments\/c1$/);
  });
});

describe("taskActivityApi", () => {
  it("getActivity_hitsTheTaskActivityPath_withGet", async () => {
    const call = await captureCall(() => taskActivityApi.getActivity(ORG, PROJECT, TASK));
    expect(call.method).toBe("GET");
    expect(call.url).toMatch(/\/tasks\/t1\/activity$/);
  });
});

describe("projectsApi single-task methods", () => {
  it("getTask_hitsTheSingleTaskPath_withGet", async () => {
    const call = await captureCall(() => projectsApi.getTask(ORG, PROJECT, TASK));
    expect(call.method).toBe("GET");
    expect(call.url).toMatch(/\/tasks\/t1$/);
  });

  it("updateTask_patchesTheSingleTaskPath_withTheProvidedFields", async () => {
    const call = await captureCall(() =>
      projectsApi.updateTask(ORG, PROJECT, TASK, { priority: "urgent", statusId: "s2" }),
    );
    expect(call.method).toBe("PATCH");
    expect(call.url).toMatch(/\/tasks\/t1$/);
    expect(JSON.parse(call.body ?? "")).toEqual({ priority: "urgent", statusId: "s2" });
  });

  it("deleteTask_sendsDeleteToTheSingleTaskPath", async () => {
    const call = await captureCall(() => projectsApi.deleteTask(ORG, PROJECT, TASK));
    expect(call.method).toBe("DELETE");
    expect(call.url).toMatch(/\/tasks\/t1$/);
  });
});
