export const AVATAR_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-teal-500 to-emerald-600",
  "from-sky-500 to-cyan-600",
  "from-fuchsia-500 to-purple-600",
];

export type LayoutMode = "huddle" | "one-on-one" | "conference" | "presentation";

export type VoiceCallParticipantMeta = {
  isHandRaised?: boolean;
  image?: string;
};

export function parseMeta(raw?: string | null): VoiceCallParticipantMeta {
  if (!raw?.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const record = parsed as Record<string, unknown>;
    const meta: VoiceCallParticipantMeta = {};
    if (typeof record.isHandRaised === "boolean") meta.isHandRaised = record.isHandRaised;
    if (typeof record.image === "string") meta.image = record.image;
    return meta;
  } catch {
    return {};
  }
}
