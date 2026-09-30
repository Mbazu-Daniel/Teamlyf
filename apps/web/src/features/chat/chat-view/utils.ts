const SENDER_COLORS = [
  "#7C3AED",
  "#2563EB",
  "#059669",
  "#E11D48",
  "#D97706",
  "#0891B2",
  "#DB2777",
  "#4F46E5",
  "#0D9488",
  "#DC2626",
  "#16A34A",
  "#EA580C",
  "#9333EA",
  "#0284C7",
  "#BE185D",
];

export function senderColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return SENDER_COLORS[Math.abs(h) % SENDER_COLORS.length];
}

export function fmt(str: string = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
