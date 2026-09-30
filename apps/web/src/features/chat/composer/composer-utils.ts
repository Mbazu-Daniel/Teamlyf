import type { TenantMember } from "@/features/chat/types/tenant-members/types";

export function audioBlobToFile(blob: Blob) {
  return new File([blob], `voice-message-${Date.now()}.webm`, {
    type: blob.type || "audio/webm",
  });
}

export function formatRecordingTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function structureMentionContent(
  value: string,
  mentionedMemberIds: string[],
  members: TenantMember[],
) {
  let finalContent = value;
  if (mentionedMemberIds.length === 0) return finalContent;

  mentionedMemberIds.forEach((id) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;

    const fullName = `${member.firstName} ${member.lastName}`.trim();
    const placeholder = `@${fullName}`;
    const structured = `@[${fullName}](${id})`;
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedPlaceholder}(?=\\s|$)`, "g");
    finalContent = finalContent.replace(regex, structured);
  });

  return finalContent;
}
