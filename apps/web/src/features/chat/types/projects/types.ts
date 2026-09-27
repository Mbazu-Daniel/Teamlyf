export interface ProjectMember {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  avatar?: string | null;
  /** Project-scoped role — admin or member */
  role?: "admin" | "member";
}
