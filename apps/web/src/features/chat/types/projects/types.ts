export interface ProjectMember {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  avatar?: string | null;

  role?: "admin" | "member";
}
