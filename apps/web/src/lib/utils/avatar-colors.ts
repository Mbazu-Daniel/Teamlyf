const AVATAR_COLORS = [
  "#4DA374",
  "#EEB41E",
  "#3498DB",
  "#E85757",
  "#9B59B6",
  "#F39C12",
  "#1ABC9C",
  "#E67E22",
  "#2ECC71",
  "#34495E",
  "#D35400",
  "#C0392B",
  "#2980B9",
  "#8E44AD",
  "#16A085",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(id: string | null | undefined): string {
  if (id == null || id === "") return AVATAR_COLORS[0];
  return AVATAR_COLORS[hashString(String(id)) % AVATAR_COLORS.length];
}
