import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconFile, IconFolder, IconLayoutGrid, IconList } from "@tabler/icons-react";
import { documentsApi } from "@/lib/api/documents";
import { useOrganization } from "@/lib/organization";
import {
  PageHeader,
  PageEmptyState,
  ToolbarSearch,
  ViewToggle,
  WorkspacePage,
  pageInput,
  pagePrimaryAction,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";
import {
  WorkflowField,
  WorkflowSheet,
  WorkflowSubmit,
  WorkflowError,
  useWorkflowMutation,
} from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileDetail, folderType } from "./file-detail";

export function DocumentsPage() {
  const { organization } = useOrganization();
  return organization ? <Library org={organization.id} /> : null;
}

function Library({ org }: { org: string }) {
  const files = useQuery({
    queryKey: ["documents", org],
    queryFn: () => documentsApi.list(org),
    retry: false,
  });
  const [folder, setFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [uploadResults, setUploadResults] = useState<string[]>([]);
  const mutation = useWorkflowMutation([["documents", org]]);
  const filtered = (files.data ?? []).filter((file) => {
    if (!!file.deletedAt !== (filter === "trash")) return false;
    if (filter === "folders" && file.mimeType !== folderType) return false;
    if (filter === "files" && file.mimeType === folderType) return false;

    const parentVisible =
      file.parentId && files.data?.some((parent) => parent.id === file.parentId);
    if (!search && filter !== "trash" && (parentVisible ? file.parentId : null) !== folder)
      return false;
    return file.title.toLowerCase().includes(search.toLowerCase());
  });
  async function upload(selectedFiles: File[]) {
    setUploadResults([]);
    const results: string[] = [];
    for (const file of selectedFiles) {
      try {
        await documentsApi.upload(org, file, folder ?? undefined);
        results.push(`${file.name}: uploaded`);
      } catch (error) {
        results.push(`${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`);
      }
      setUploadResults([...results]);
    }
  }
  return (
    <WorkspacePage>
      <PageHeader
        actions={
          <>
            <ViewToggle
              value={view}
              onChange={setView}
              ariaLabel="Library view"
              options={[
                { value: "grid", label: "Grid", icon: IconLayoutGrid },
                { value: "list", label: "List", icon: IconList },
              ]}
            />
            <ToolbarSearch
              value={search}
              onChange={setSearch}
              placeholder="Search files…"
              label="Search files"
            />
            <select
              className={`${pageInput} !w-auto cursor-pointer`}
              aria-label="File filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All files</option>
              <option value="folders">Folders</option>
              <option value="files">Documents</option>
              <option value="trash">Trash</option>
            </select>
            {folder && (
              <button
                className={pageSecondaryAction}
                onClick={() =>
                  setFolder(files.data?.find((file) => file.id === folder)?.parentId ?? null)
                }
              >
                Up one level
              </button>
            )}
            <button className={pageSecondaryAction} onClick={() => setCreating(true)}>
              New Folder
            </button>
            <label
              className={`${pagePrimaryAction} ${mutation.isPending ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
            >
              {mutation.isPending ? "Uploading…" : "Upload files"}
              <input
                className="sr-only"
                type="file"
                multiple
                disabled={mutation.isPending}
                onChange={(event) => {
                  const selectedFiles = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  mutation.mutate(() => upload(selectedFiles));
                }}
              />
            </label>
          </>
        }
      />
      <WorkflowError error={files.error ?? mutation.error} />
      <div aria-live="polite" className="space-y-1 text-xs text-muted-foreground">
        {uploadResults.map((result, index) => (
          <p key={index}>{result}</p>
        ))}
      </div>
      {/* Plain surface like Projects: the grid/list sits on the page background,
          not inside a card. */}
      <div>
        {/* <div className="mb-5 flex flex-wrap justify-between gap-3 border-b pb-4">
          <h2 className="text-sm font-medium">
            {filter === "trash"
              ? "Trash"
              : (files.data?.find((file) => file.id === folder)?.title ?? "All files")}
          </h2>
        </div> */}
        {files.isPending ? (
          <p className="text-sm">Loading library…</p>
        ) : filtered.length ? (
          <div
            className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "divide-y"}
          >
            {filtered.map((file) => (
              <article
                key={file.id}
                className={
                  view === "grid"
                    ? "rounded-xl border p-4"
                    : "flex flex-wrap items-center gap-4 py-4"
                }
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() =>
                    file.mimeType === folderType && !file.deletedAt
                      ? setFolder(file.id)
                      : setSelected(file.id)
                  }
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    {file.mimeType === folderType ? (
                      <IconFolder className="size-5" />
                    ) : (
                      <IconFile className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{file.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {file.mimeType === folderType
                        ? "Folder"
                        : file.objectKey
                          ? `${(file.fileSize / 1024).toFixed(1)} KB`
                          : "Text document"}
                    </span>
                  </span>
                </button>
                <div className={`flex flex-wrap gap-2 ${view === "grid" ? "mt-4" : ""}`}>
                  {file.deletedAt ? (
                    <>
                      <button
                        className={pageSecondaryAction}
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate(() => documentsApi.restore(org, file.id))}
                      >
                        Restore
                      </button>
                      <ConfirmDialog
                        title="Permanently delete?"
                        description="This file and its history cannot be recovered. Its stored bytes will be removed."
                        confirmLabel="Delete permanently"
                        destructive
                        onConfirm={() => mutation.mutate(() => documentsApi.purge(org, file.id))}
                        trigger={
                          <button disabled={mutation.isPending} className={pageSecondaryAction}>
                            Delete
                          </button>
                        }
                      />
                    </>
                  ) : (
                    <button className={pageSecondaryAction} onClick={() => setSelected(file.id)}>
                      Details & sharing
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          !files.error && (
            <PageEmptyState
              icon={IconFolder}
              title={filter === "trash" ? "Trash is empty" : "No matching files"}
            />
          )
        )}
      </div>
      {creating && <CreateDocument org={org} parent={folder} onClose={() => setCreating(false)} />}
      {selected && (
        <FileDetail
          org={org}
          id={selected}
          files={files.data ?? []}
          onClose={() => setSelected(undefined)}
        />
      )}
    </WorkspacePage>
  );
}

function CreateDocument({
  org,
  parent,
  onClose,
}: {
  org: string;
  parent: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("document");
  const mutation = useWorkflowMutation([["documents", org]], onClose);
  return (
    <WorkflowSheet title="Create in library" onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(() =>
            documentsApi.create(org, {
              title: name.trim(),
              mimeType: kind === "folder" ? folderType : "text/plain",
              parentId: parent ?? undefined,
            }),
          );
        }}
      >
        <WorkflowField
          label="Name"
          required
          maxLength={200}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label className="block space-y-2 text-sm">
          <span>Type</span>
          <select
            className={pageInput}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="document">Text document</option>
            <option value="folder">Folder</option>
          </select>
        </label>
        <WorkflowError error={mutation.error} />
        <WorkflowSubmit pending={mutation.isPending} label="Create" />
      </form>
    </WorkflowSheet>
  );
}
