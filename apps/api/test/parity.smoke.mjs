// Run ONLY against an isolated API/database. Creates disposable test accounts and data.
import assert from "node:assert/strict";
const origin = process.env.PARITY_API_URL;
if (origin !== "http://localhost:3199")
  throw new Error(
    "Set PARITY_API_URL=http://localhost:3199 and start the API against the isolated parity database.",
  );
const base = origin + "/api/v1";
const stamp = Date.now();
let checks = 0;
function browser() {
  const cookies = new Map();
  return async (path, method = "GET", body, expected) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3100",
        Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const first = cookie.split(";")[0];
      const i = first.indexOf("=");
      cookies.set(first.slice(0, i), first.slice(i + 1));
    }
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (expected) assert.equal(response.status, expected, `${method} ${path}: ${text}`);
    else assert.ok(response.ok, `${method} ${path}: ${response.status} ${text}`);
    checks++;
    return data;
  };
}
const owner = browser(),
  teammate = browser(),
  outsider = browser();
const email = `parity-owner-${stamp}@example.test`,
  peerEmail = `parity-peer-${stamp}@example.test`;
await owner("/auth/sign-up/email", "POST", {
  name: "Parity Owner",
  email,
  password: "Parity-check-only-2026!",
});
await teammate("/auth/sign-up/email", "POST", {
  name: "Parity Teammate",
  email: peerEmail,
  password: "Parity-check-only-2026!",
});
await outsider("/auth/sign-up/email", "POST", {
  name: "Parity Outsider",
  email: `parity-outside-${stamp}@example.test`,
  password: "Parity-check-only-2026!",
});
await owner("/organization", "POST", { name: "Parity workspace", slug: `parity-${stamp}` });
const organizations = await owner("/organization");
const org = (Array.isArray(organizations) ? organizations : organizations.organizations)[0].id;
const root = `/organization/${org}`;
const invitation = await owner(root + "/invitations", "POST", { email: peerEmail, role: "member" });
await teammate(root + "/invitations/accept", "POST", { invitationId: invitation.id });
const members = (await owner(root + "/members")).members;
const peer = members.find((member) => member.user?.email === peerEmail);
const me = members.find((member) => member.user?.email === email);
assert.ok(peer?.id && me?.id);
console.log("PASS account creation, workspace creation and invitation acceptance");
const project = await owner(root + "/projects", "POST", {
  name: "Parity project",
  identifier: "PAR",
  status: "in_progress",
  leadIds: [me.id],
});
const pp = root + `/projects/${project.id}`;
assert.equal(
  (await owner(pp, "PATCH", { status: "paused", identifier: "CHECK", leadIds: [me.id, peer.id] }))
    .status,
  "paused",
);
const sprint = await owner(pp + "/sprints", "POST", {
  name: "Sprint one",
  startDate: "2026-10-01",
  endDate: "2026-10-15",
});
const updatedSprint = await owner(pp + `/sprints/${sprint.id}`, "PATCH", { status: "active" });
assert.ok(updatedSprint.startDate);
const statuses = await owner(pp + "/statuses");
const label = await owner(pp + "/labels", "POST", { name: "Test", color: "#7c3aed" });
const task = await owner(pp + "/tasks", "POST", {
  name: "Assigned task",
  statusId: statuses[0].id,
  priority: "high",
  assignees: [{ kind: "member", id: me.id }],
  labelIds: [label.id],
});
await teammate(pp + `/tasks/${task.id}`, "PATCH", { name: "Updated by teammate" });
const inbox = await owner(root + "/notifications");
assert.ok(inbox.items.length > 0);
await owner(root + "/notifications/read", "POST", { ids: inbox.items.map((item) => item.id) });
assert.ok((await owner(root + "/notifications")).items.every((item) => item.readAt));
await outsider(root + "/notifications", "GET", undefined, 403);
console.log(
  "PASS projects, leads, sprint partial updates, labels, tasks and notification read persistence",
);
const event = await owner(root + "/events", "POST", {
  title: "Planning",
  startsAt: "2026-10-01T09:00:00Z",
  endsAt: "2026-10-01T10:00:00Z",
});
assert.equal(
  (await owner(root + "/events?from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z")).length,
  1,
);
await owner(root + `/events/${event.id}`, "PATCH", { endsAt: "2026-10-01T08:00:00Z" }, 400);
await owner(root + `/events/${event.id}`, "PATCH", { title: "Updated planning" });
await outsider(
  root + "/events?from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z",
  "GET",
  undefined,
  403,
);
await owner(root + `/events/${event.id}`, "DELETE");
console.log("PASS persisted calendar, validation and workspace isolation");
const note = await owner(root + "/notes", "POST", {
  title: "Private knowledge",
  content: "Original",
  private: true,
});
await teammate(root + `/notes/${note.id}`, "GET", undefined, 404);
assert.ok(!(await teammate(root + "/notes?all=true")).some((item) => item.id === note.id));
const edited = await owner(root + `/notes/${note.id}`, "PATCH", {
  title: "Edited",
  content: "Updated",
  revision: note.revision,
});
await owner(
  root + `/notes/${note.id}`,
  "PATCH",
  { content: "Stale", revision: note.revision },
  409,
);
const snapshots = await owner(root + `/notes/${note.id}/snapshots`);
assert.equal(snapshots[0].content, "Original");
await owner(root + `/notes/${note.id}/snapshots/${snapshots[0].id}/restore`, "POST", {
  revision: edited.revision,
});
await owner(root + `/notes/${note.id}/favorite`, "POST", { enabled: true });
assert.ok((await owner(root + "/notes?all=true")).find((item) => item.id === note.id).favorite);
const child = await owner(root + "/notes", "POST", { title: "Child", parentId: note.id });
assert.equal(child.private, true);
await owner(root + `/notes/${note.id}`, "PATCH", { parentId: child.id }, 400);
await owner(root + `/notes/${note.id}/presence`, "POST");
assert.equal((await owner(root + `/notes/${note.id}`)).content, "Original");
console.log(
  "PASS note privacy, revisions, stale-edit protection, restore, favorites, nesting and presence",
);
const folder = await owner(root + "/documents", "POST", {
  title: "Folder",
  mimeType: "application/x-directory",
});
const doc = await owner(root + "/documents", "POST", {
  title: "Text document",
  parentId: folder.id,
  content: "Original text",
});
await teammate(root + `/documents/${doc.id}`, "GET", undefined, 403);
await owner(root + `/documents/${doc.id}/permissions`, "POST", {
  subjectId: peer.id,
  subjectKind: "member",
  access: "read",
});
await teammate(root + `/documents/${doc.id}`);
await teammate(root + `/documents/${doc.id}`, "PATCH", { title: "Forbidden" }, 403);
await owner(root + `/documents/${doc.id}/permissions`, "POST", {
  subjectId: peer.id,
  subjectKind: "member",
  access: "write",
});
await teammate(root + `/documents/${doc.id}`, "PATCH", { content: "Edited by writer" });
await teammate(
  root + `/documents/${doc.id}/permissions`,
  "POST",
  { subjectId: peer.id, subjectKind: "member", access: "admin" },
  403,
);
const versions = await owner(root + `/documents/${doc.id}/versions`);
await owner(root + `/documents/${doc.id}/versions/${versions[0].id}/restore`, "POST");
await owner(root + `/documents/${folder.id}`, "PATCH", { parentId: folder.id }, 400);
await owner(root + `/documents/${folder.id}/trash`, "POST", undefined, 400);
const bytes = "test upload bytes";
const upload = await owner(root + "/documents/upload", "POST", {
  title: "test.txt",
  mimeType: "text/plain",
  fileSize: Buffer.byteLength(bytes),
});
assert.ok(
  (
    await fetch(base + upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: bytes,
    })
  ).ok,
);
await owner(root + `/documents/${upload.id}/confirm-upload`, "POST");
const download = await owner(root + `/documents/${upload.id}/download`);
assert.equal(await (await fetch(base + download.url)).text(), bytes);
const replacementBytes = "replacement file contents";
const replacementUpload = await owner(root + "/documents/upload", "POST", {
  title: "replacement.txt",
  mimeType: "text/plain",
  fileSize: Buffer.byteLength(replacementBytes),
});
assert.ok(
  (
    await fetch(base + replacementUpload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: replacementBytes,
    })
  ).ok,
);
await owner(root + `/documents/${replacementUpload.id}/confirm-upload`, "POST");
await teammate(
  root + `/documents/${upload.id}/replace-file`,
  "POST",
  { uploadedDocumentId: replacementUpload.id },
  403,
);
await owner(
  root + `/documents/${upload.id}/replace-file`,
  "POST",
  { uploadedDocumentId: upload.id },
  400,
);
await owner(root + `/documents/${upload.id}/replace-file`, "POST", {
  uploadedDocumentId: replacementUpload.id,
});
await owner(root + `/documents/${replacementUpload.id}`, "GET", undefined, 404);
const replacedDownload = await owner(root + `/documents/${upload.id}/download`);
assert.equal(await (await fetch(base + replacedDownload.url)).text(), replacementBytes);
const fileVersions = await owner(root + `/documents/${upload.id}/versions`);
assert.equal(fileVersions.length, 1);
await owner(root + `/documents/${upload.id}/versions/${fileVersions[0].id}/restore`, "POST");
const restoredDownload = await owner(root + `/documents/${upload.id}/download`);
assert.equal(await (await fetch(base + restoredDownload.url)).text(), bytes);
assert.equal((await owner(root + `/documents/${upload.id}/versions`)).length, 2);
await owner(root + `/documents/${upload.id}/trash`, "POST");
await owner(root + `/documents/${upload.id}/restore`, "POST");
await owner(root + `/documents/${upload.id}/trash`, "POST");
await owner(root + `/documents/${upload.id}`, "DELETE");
await owner(root + `/documents/${upload.id}`, "GET", undefined, 404);
console.log(
  "PASS document permissions, version restore, folder checks, upload/download, trash and permanent deletion",
);
await owner(root + `/profiles/${peer.id}`, "PATCH", { jobTitle: "Engineer" });
assert.equal((await owner(root + `/profiles/${peer.id}`)).jobTitle, "Engineer");
await teammate(root + `/profiles/${me.id}`, "PATCH", { jobTitle: "Denied" }, 403);
const catalog = await owner(root + "/roles/permissions");
assert.ok(catalog.pm.includes("read"));
await owner(root + "/roles", "POST", { role: "parity-reader", permission: { pm: ["read"] } });
assert.ok((await owner(root + "/roles")).some((role) => role.role === "parity-reader"));
await owner(root + "/roles/parity-reader", "PATCH", {
  permission: { pm: ["read"], notes: ["read"] },
});
await owner(root + "/roles/parity-reader", "DELETE");
console.log("PASS employee profile permissions and custom role lifecycle");

const secondProject = await owner(root + "/projects", "POST", {
  name: "Second project",
  identifier: "SECOND",
});
const otherSprint = await owner(root + `/projects/${secondProject.id}/sprints`, "POST", {
  name: "Other sprint",
});
await owner(pp + `/tasks/${task.id}`, "PATCH", { sprintId: otherSprint.id }, 400);
assert.equal(
  (await owner(pp + `/tasks/${task.id}`, "PATCH", { sprintId: sprint.id })).sprintId,
  sprint.id,
);
await owner(pp + `/tasks/${task.id}`, "PATCH", { parentId: task.id }, 400);
const beforeTasks = (await owner(pp + "/tasks")).length;
await owner(
  pp + "/tasks",
  "POST",
  {
    name: "Should roll back",
    statusId: statuses[0].id,
    assignees: [{ kind: "member", id: "00000000-0000-4000-8000-000000000000" }],
  },
  400,
);
assert.equal((await owner(pp + "/tasks")).length, beforeTasks);
const invalidLabel = await owner(root + `/projects/${secondProject.id}/labels`, "POST", {
  name: "Other label",
  color: "#111111",
});
await owner(
  pp + `/tasks/${task.id}`,
  "PATCH",
  { name: "Must not save", labelIds: [invalidLabel.id] },
  400,
);
assert.equal((await owner(pp + `/tasks/${task.id}`)).name, "Updated by teammate");
await owner(pp + `/sprints/${sprint.id}`, "DELETE");
assert.equal((await owner(pp + `/tasks/${task.id}`)).sprintId, null);
const stats = (await owner(root + "/projects")).find((p) => p.id === project.id);
assert.equal(stats.taskCount, 1);
const policy = await owner(root + "/policies", "POST", { name: "Annual leave", daysPerYear: 20 });
const leave = await teammate(root + "/leave", "POST", {
  policyId: policy.id,
  startDate: "2026-10-05",
  endDate: "2026-10-06",
  reason: "Time away",
});
await teammate(root + `/leave/${leave.id}`, "PATCH", { status: "approved" }, 403);
await owner(root + `/leave/${leave.id}`, "PATCH", { status: "rejected" }, 400);
await owner(root + `/leave/${leave.id}`, "PATCH", {
  status: "rejected",
  reviewReason: "Please choose different dates",
});
assert.equal(
  (await teammate(root + "/leave")).find((r) => r.id === leave.id).reviewReason,
  "Please choose different dates",
);
await owner(root + `/leave/${leave.id}`, "PATCH", { status: "approved" }, 400);
await teammate(root + `/leave/${leave.id}`, "DELETE", undefined, 400);
const department = await owner(root + "/departments", "POST", { name: "Engineering" });
await owner(root + `/departments/${department.id}/members/${peer.id}`, "POST");
assert.ok(
  (await owner(root + "/departments"))
    .find((d) => d.id === department.id)
    .members.some((m) => m.id === peer.id),
);
await owner(root + `/departments/${department.id}/members/${peer.id}`, "DELETE");
await owner(root + `/departments/${department.id}`, "DELETE");
await owner(root + "/roles", "POST", { role: "parity-custom", permission: { pm: ["read"] } });
await owner(root + "/members/update-role", "POST", { memberId: peer.id, role: ["parity-custom"] });
await teammate(root + "/projects");
await teammate(root + "/projects", "POST", { name: "Denied", identifier: "DENIED" }, 403);
await owner(root + "/members/update-role", "POST", { memberId: peer.id, role: ["member"] });
await owner(root + "/roles/parity-custom", "DELETE");
const avatar =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
await owner("/auth/update-user", "POST", { image: avatar });
await owner(root, "PATCH", { logo: avatar });
await owner("/auth/delete-user", "POST", { password: "Parity-check-only-2026!" }, 400);
await outsider("/auth/delete-user", "POST", { password: "incorrect" }, 400);
await outsider("/auth/delete-user", "POST", { password: "Parity-check-only-2026!" });
console.log(
  "PASS sprint association, transaction rollback, cross-project isolation, leave review, departments, role assignment, avatar/logo persistence and guarded account deletion",
);
console.log(`PASS ${checks} API assertions against isolated test database`);
