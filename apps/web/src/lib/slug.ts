export function slugify(value: string) {
  return (
    value
      // NFKD decomposes an accented letter into a base letter plus a combining
      // mark, so the single non-alphanumeric pass below strips the accent too.
      // One pass, and no separate accent regex to keep in sync.
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

type ProjectRef = Readonly<{ name: string }>;

export function projectSlug(project: ProjectRef): string {
  return slugify(project.name);
}
