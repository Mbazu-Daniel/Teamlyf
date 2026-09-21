import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  IconClock,
  IconDownload,
  IconDeviceFloppy as IconSave,
  IconFileText,
  IconFolder,
  IconHistory,
  IconPlus,
  IconShare3,
  IconUpload,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { AppDialog } from "@/components/app-dialog";
import { ResourceState } from "@/components/resource-state";
import { api, organizationPath, useApiResource } from "@/lib/api";

type Document = {
  id: string;
  title: string;
  content: string | null;
  mimeType: string;
  updatedAt: string;
  objectKey: string | null;
  parentId?: string | null;
};
type Version = {
  id: string;
  version: string;
  title: string;
  content: string | null;
  createdAt: string;
};

export const Route = createFileRoute("/$tenant/docs")({ component: Documents });
function Documents() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const documents = useApiResource<Document[]>(
    organizationPath(tenant, "/documents"),
  );
  const [documentId, setDocumentId] = useState("");
  const [draft, setDraft] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const detail = useApiResource<Document>(
    documentId ? organizationPath(tenant, `/documents/${documentId}`) : null,
  );
  const versions = useApiResource<Version[]>(
    historyOpen && documentId
      ? organizationPath(tenant, `/documents/${documentId}/versions`)
      : null,
  );
  useEffect(() => {
    if (!documentId && documents.data?.[0]) setDocumentId(documents.data[0].id);
  }, [documentId, documents.data]);
  useEffect(() => {
    if (detail.data) setDraft(detail.data.content ?? "");
  }, [detail.data]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      const created = await api<Document>(
        organizationPath(tenant, "/documents"),
        {
          method: "POST",
          body: JSON.stringify({
            title: String(form.get("title")),
            content: "",
            parentId: String(form.get("parentId") || undefined),
          }),
        },
      );
      setDocumentId(created.id);
      setNewOpen(false);
      await documents.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to create document",
      );
    } finally {
      setSaving(false);
    }
  }
  async function setPermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentId) return;
    const form = new FormData(event.currentTarget);
    try {
      await api(organizationPath(tenant, `/documents/${documentId}/permissions`), { method: "POST", body: JSON.stringify({ subjectKind: "member", subjectId: String(form.get("subjectId")), access: String(form.get("access")) }) });
      setMessage("Sharing rule saved. It overrides inherited folder access for this member.");
      setShareOpen(false);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to update sharing"); }
  }
  async function download() {
    if (!documentId) return;
    try {
      const result = await api<{ url?: string; content?: string; mimeType?: string }>(organizationPath(tenant, `/documents/${documentId}/download`));
      if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
      else { const url = URL.createObjectURL(new Blob([result.content ?? draft], { type: result.mimeType ?? "text/plain" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${detail.data?.title ?? "document"}.txt`; anchor.click(); URL.revokeObjectURL(url); }
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to download document"); }
  }
  async function save() {
    if (!documentId) return;
    setSaving(true);
    setMessage("");
    try {
      await api<Document>(
        organizationPath(tenant, `/documents/${documentId}`),
        { method: "PATCH", body: JSON.stringify({ content: draft }) },
      );
      await Promise.all([detail.reload(), documents.reload()]);
      setMessage("Saved — a previous version was kept in history.");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to save document",
      );
    } finally {
      setSaving(false);
    }
  }
  async function restore(version: Version) {
    if (!documentId) return;
    await api(
      organizationPath(
        tenant,
        `/documents/${documentId}/versions/${version.id}/restore`,
      ),
      { method: "POST" },
    );
    setHistoryOpen(false);
    await detail.reload();
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !documentId) return;
    setSaving(true);
    setMessage("");
    try {
      const target = await api<{ url: string }>(
        organizationPath(tenant, `/documents/${documentId}/upload`),
        { method: "POST" },
      );
      const response = await fetch(target.url, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!response.ok) throw new Error("Upload could not be completed");
      setMessage(`${file.name} uploaded.`);
      await detail.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to upload file",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }
  return (
    <>
      <PageHeader
        title="Documents"
        description="Draft, share, upload, and restore work without losing the reasoning behind it."
        action={
          <button
            onClick={() => setNewOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white"
          >
            <IconPlus className="size-4" />
            New document
          </button>
        }
      />
      <section className="surface grid min-h-[38rem] overflow-hidden rounded-2xl lg:grid-cols-[15rem_1fr]">
        <aside className="border-b bg-muted/25 p-4 lg:border-r lg:border-b-0">
          <p className="eyebrow mb-3">Library</p>
          <ResourceState
            loading={documents.loading}
            error={documents.error}
            onRetry={documents.reload}
            isEmpty={documents.data?.length === 0}
            emptyTitle="No documents yet"
          >
            {documents.data && (
              <nav className="space-y-1">
                {documents.data.map((document) => (
                  <button
                    key={document.id}
                    onClick={() => setDocumentId(document.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${document.id === documentId ? "bg-white font-semibold text-violet-700 shadow-sm" : "text-muted-foreground hover:bg-white"}`}
                  >
                    {document.parentId ? <IconFileText className="size-4" /> : <IconFolder className="size-4" />}
                    <span className="truncate">{document.title}</span>
                  </button>
                ))}
              </nav>
            )}
          </ResourceState>
        </aside>
        <div className="min-w-0 p-5 sm:p-7">
          <ResourceState
            loading={detail.loading}
            error={detail.error}
            onRetry={detail.reload}
            isEmpty={Boolean(documentId && !detail.data)}
            emptyTitle="Select a document"
          >
            {detail.data && (
              <>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="eyebrow">Editable document</p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {detail.data.title}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {new Date(detail.data.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-semibold">
                      <IconUpload className="size-4" />
                      Upload
                      <input onChange={upload} type="file" className="hidden" />
                    </label>
                    <button onClick={() => setPreviewOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-semibold"><IconFileText className="size-4" />Preview</button>
                    <button onClick={() => void download()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-semibold"><IconDownload className="size-4" />Download</button>
                    <button onClick={() => setShareOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-semibold"><IconShare3 className="size-4" />Share</button>
                    <button
                      onClick={() => setHistoryOpen(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-semibold"
                    >
                      <IconHistory className="size-4" />
                      History
                    </button>
                    <button
                      onClick={() => void save()}
                      disabled={saving}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <IconSave className="size-4" />
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  aria-label="Document content"
                  className="mt-7 min-h-[24rem] w-full resize-y rounded-2xl border bg-white p-5 text-sm leading-7 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  placeholder="Write the shared context your team needs…"
                />
                {message && (
                  <p className="mt-3 text-sm text-violet-700">{message}</p>
                )}
              </>
            )}
          </ResourceState>
        </div>
      </section>
      {newOpen && (
        <AppDialog
          title="New document"
          description="Start a shared document your workspace can return to."
          onClose={() => setNewOpen(false)}
        >
          <form onSubmit={create} className="space-y-4">
            <label className="block text-sm font-semibold">
              Title
              <input
                name="title"
                required
                placeholder="What should the team know?"
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">Folder / parent document<select name="parentId" className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"><option value="">Top level</option>{documents.data?.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select></label>
            <button
              disabled={saving}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white"
            >
              Create document
            </button>
          </form>
        </AppDialog>
      )}
      {historyOpen && (
        <AppDialog
          title="Version history"
          description="Restoring a version creates a new recoverable version of the current document."
          onClose={() => setHistoryOpen(false)}
        >
          <ResourceState
            loading={versions.loading}
            error={versions.error}
            onRetry={versions.reload}
            isEmpty={versions.data?.length === 0}
            emptyTitle="No earlier versions"
          >
            {versions.data && (
              <div className="space-y-2">
                {versions.data.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        Version {version.version}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => void restore(version)}
                      className="text-sm font-semibold text-violet-700"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ResourceState>
        </AppDialog>
      )}
      {shareOpen && <AppDialog title="Share document" description="Grant a member read or write access. A file-level rule takes precedence over folder inheritance." onClose={() => setShareOpen(false)}><form onSubmit={setPermission} className="space-y-4"><label className="block text-sm font-semibold">Member ID<input required name="subjectId" placeholder="Workspace member ID" className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><label className="block text-sm font-semibold">Access<select name="access" defaultValue="read" className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"><option value="read">Can view</option><option value="write">Can edit</option><option value="none">Remove access</option></select></label><button className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white">Save sharing rule</button></form></AppDialog>}
      {previewOpen && <AppDialog title={detail.data?.title ?? "Document preview"} description="Read-only preview of the current saved draft." onClose={() => setPreviewOpen(false)}><article className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm leading-7">{draft || "This document is empty."}</article></AppDialog>}
    </>
  );
}
