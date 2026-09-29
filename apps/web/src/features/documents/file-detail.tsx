import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { documentsApi, type DocumentFile, type FilePermission } from "@/lib/api/documents";
import { settingsApi } from "@/lib/api/settings";
import { resolveApiPath } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import {
  WorkflowSheet,
  WorkflowError,
  WorkflowField,
  WorkflowSubmit,
  useWorkflowMutation,
} from "@/components/workspace/workflow";
import { pageInput, pageSecondaryAction } from "@/components/workspace/page-layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const folderType = "application/x-directory";
export function FileDetail({
  org,
  id,
  files,
  onClose,
}: {
  org: string;
  id: string;
  files: DocumentFile[];
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["document", org, id],
    queryFn: () => documentsApi.get(org, id),
    retry: false,
  });
  return (
    <WorkflowSheet title="File details" onClose={onClose}>
      <WorkflowError error={query.error} />
      {query.isPending ? (
        <p className="text-sm">Loading file…</p>
      ) : (
        query.data && (
          <FileForm
            key={query.data.updatedAt}
            org={org}
            file={query.data}
            files={files}
            onClose={onClose}
          />
        )
      )}
    </WorkflowSheet>
  );
}

function FileForm({
  org,
  file,
  files,
  onClose,
}: {
  org: string;
  file: DocumentFile;
  files: DocumentFile[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(file.title);
  const [content, setContent] = useState(file.content ?? "");
  const [parentId, setParent] = useState(file.parentId ?? "");
  const [tab, setTab] = useState("details");
  const mutation = useWorkflowMutation([
    ["documents", org],
    ["document", org, file.id],
    ["document-versions", org, file.id],
  ]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {["details", "sharing", "history", ...(file.objectKey ? ["preview"] : [])].map((value) => (
          <button
            key={value}
            className={pageSecondaryAction}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <WorkflowError error={mutation.error} />
      {tab === "details" && (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(() =>
              documentsApi.update(org, file.id, {
                title: title.trim(),
                parentId: parentId || null,
                ...(!file.objectKey && file.mimeType !== folderType ? { content } : {}),
              }),
            );
          }}
        >
          <WorkflowField
            label="Name"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <label className="block space-y-2 text-sm">
            <span>Folder</span>
            <select
              className={pageInput}
              value={parentId}
              onChange={(event) => setParent(event.target.value)}
            >
              <option value="">Root folder</option>
              {files
                .filter(
                  (item) => item.mimeType === folderType && item.id !== file.id && !item.deletedAt,
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>
          </label>
          {!file.objectKey && file.mimeType !== folderType && (
            <label className="block space-y-2 text-sm">
              <span>Document text</span>
              <textarea
                className={`${pageInput} h-auto py-3`}
                rows={12}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </label>
          )}
          <p className="text-xs text-muted-foreground">
            {file.objectKey ? `${(file.fileSize / 1024).toFixed(1)} KB · ` : ""}
            {file.mimeType} · updated {new Date(file.updatedAt).toLocaleString()}
          </p>
          <div className="flex flex-wrap gap-3">
            <WorkflowSubmit pending={mutation.isPending} />
            {file.mimeType !== folderType && (
              <button
                type="button"
                className={pageSecondaryAction}
                onClick={() => mutation.mutate(() => downloadFile(org, file))}
              >
                Download
              </button>
            )}
            <ConfirmDialog
              title="Move to trash?"
              description="You can restore this file from Trash. Folders must be empty."
              confirmLabel="Move to trash"
              onConfirm={() =>
                mutation.mutate(async () => {
                  await documentsApi.trash(org, file.id);
                  onClose();
                })
              }
              trigger={
                <button type="button" className={pageSecondaryAction}>
                  Trash
                </button>
              }
            />
          </div>
        </form>
      )}
      {tab === "sharing" && <FileSharing org={org} file={file} />}
      {tab === "details" && file.objectKey && !file.deletedAt && (
        <ReplaceFile org={org} file={file} />
      )}
      {tab === "history" && <FileHistory org={org} file={file} />}
      {tab === "preview" && <FilePreview org={org} file={file} />}
    </div>
  );
}

function ReplaceFile({ org, file }: { org: string; file: DocumentFile }) {
  const [selected, setSelected] = useState<File>();
  const mutation = useWorkflowMutation([
    ["documents", org],
    ["document", org, file.id],
    ["document-versions", org, file.id],
  ]);
  return (
    <form
      className="space-y-3 border-t pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected) mutation.mutate(() => documentsApi.replaceFile(org, file.id, selected));
      }}
    >
      <label className="block space-y-2 text-sm">
        <span>Upload a new version</span>
        <input
          type="file"
          required
          disabled={mutation.isPending}
          className="block w-full text-sm"
          onChange={(event) => setSelected(event.target.files?.[0])}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Keeps this file's name and sharing. Previous versions remain available in history. Maximum
        100 MB.
      </p>
      <WorkflowError error={mutation.error} />
      <WorkflowSubmit pending={mutation.isPending} label="Replace file" />
    </form>
  );
}

async function downloadFile(org: string, file: DocumentFile) {
  const href = file.objectKey
    ? resolveApiPath((await documentsApi.download(org, file.id)).url)
    : URL.createObjectURL(new Blob([file.content ?? ""], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = file.title;
  anchor.click();
  if (!file.objectKey) setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function FileSharing({ org, file }: { org: string; file: DocumentFile }) {
  const query = useQuery({
    queryKey: ["file-permissions", org, file.id],
    queryFn: () => documentsApi.permissions(org, file.id),
  });
  const members = useQuery({
    queryKey: queryKeys.members(org),
    queryFn: () => settingsApi.members(org),
  });
  const [memberId, setMember] = useState("");
  const [access, setAccess] = useState<FilePermission["access"]>("read");
  const mutation = useWorkflowMutation([["file-permissions", org, file.id]]);
  return (
    <div className="space-y-5">
      <p className="text-xs leading-5 text-muted-foreground">
        Permissions apply to this file only. Sharing a folder does not automatically share its
        contents. Only the owner or a file administrator can change access.
      </p>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(() => documentsApi.share(org, file.id, memberId, access));
        }}
      >
        <select
          aria-label="Share with member"
          required
          className={pageInput}
          value={memberId}
          onChange={(event) => setMember(event.target.value)}
        >
          <option value="">Choose member…</option>
          {members.data?.members
            .filter((member) => member.id !== file.ownerId)
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.user?.name || member.user?.email}
              </option>
            ))}
        </select>
        <select
          aria-label="File permission"
          className={pageInput}
          value={access}
          onChange={(event) => setAccess(event.target.value as FilePermission["access"])}
        >
          <option value="read">Can read</option>
          <option value="write">Can edit</option>
          <option value="admin">Can manage sharing</option>
        </select>
        <WorkflowSubmit pending={mutation.isPending} label="Save permission" />
      </form>
      <WorkflowError error={query.error ?? members.error ?? mutation.error} />
      <div className="divide-y">
        {query.data?.map((permission) => (
          <div
            key={`${permission.subjectKind}:${permission.subjectId}`}
            className="flex items-center gap-3 py-3 text-sm"
          >
            <div className="flex-1">
              {members.data?.members.find((member) => member.id === permission.subjectId)?.user
                ?.name ?? "Member"}
              <p className="text-xs text-muted-foreground">{permission.access}</p>
            </div>
            <ConfirmDialog
              title="Revoke access?"
              description="This member will lose their direct permission to this file."
              confirmLabel="Revoke"
              onConfirm={() =>
                mutation.mutate(() => documentsApi.unshare(org, file.id, permission.subjectId))
              }
              trigger={<button className={pageSecondaryAction}>Revoke</button>}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FileHistory({ org, file }: { org: string; file: DocumentFile }) {
  const versions = useQuery({
    queryKey: ["document-versions", org, file.id],
    queryFn: () => documentsApi.versions(org, file.id),
  });
  const mutation = useWorkflowMutation([
    ["documents", org],
    ["document", org, file.id],
    ["document-versions", org, file.id],
  ]);
  return (
    <div className="space-y-3">
      <WorkflowError error={versions.error ?? mutation.error} />
      {versions.isPending && <p className="text-sm">Loading history…</p>}
      {versions.data?.map((version) => (
        <div key={version.id} className="space-y-2 border-b py-4">
          <p className="text-sm">
            Version {version.version}: {version.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(version.createdAt).toLocaleString()}
          </p>
          <ConfirmDialog
            title="Restore version?"
            description="The current version will remain available in history."
            confirmLabel="Restore"
            onConfirm={() =>
              mutation.mutate(() => documentsApi.restoreVersion(org, file.id, version.id))
            }
            trigger={
              <button disabled={mutation.isPending} className={pageSecondaryAction}>
                Restore
              </button>
            }
          />
        </div>
      ))}
      {versions.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">No earlier versions yet.</p>
      )}
    </div>
  );
}

function FilePreview({ org, file }: { org: string; file: DocumentFile }) {
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<unknown>();
  const supported = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/pdf",
  ].includes(file.mimeType);
  useEffect(() => {
    if (!supported) return;
    let active = true;
    let objectUrl: string | undefined;
    void (async () => {
      try {
        const target = await documentsApi.download(org, file.id);
        const response = await fetch(resolveApiPath(target.url));
        if (!response.ok) throw new Error("Unable to preview this file.");
        const bytes = await response.arrayBuffer();
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: file.mimeType }));
        if (active) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      } catch (reason) {
        if (active) setError(reason);
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [org, file.id, file.mimeType, supported]);
  if (!supported)
    return (
      <p className="text-sm text-muted-foreground">
        This format cannot be previewed safely. Use Download to open it locally.
      </p>
    );
  return (
    <div>
      <WorkflowError error={error} />
      {url ? (
        file.mimeType === "application/pdf" ? (
          <iframe
            sandbox=""
            title={file.title}
            src={url}
            className="h-[65vh] w-full rounded-xl border"
          />
        ) : (
          <img src={url} alt={file.title} className="max-h-[65vh] w-full object-contain" />
        )
      ) : (
        !error && <p className="text-sm">Loading preview…</p>
      )}
    </div>
  );
}
