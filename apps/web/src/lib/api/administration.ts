import { client } from "./client";

export type WorkspaceRole = { id: string; role: string; permission: Record<string, string[]> };
type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organizationId: string;
  organizationName?: string;
};
const base = (org: string) => `/organization/${encodeURIComponent(org)}`;
export const administrationApi = {
  roles: (org: string) => client.request<WorkspaceRole[]>(`${base(org)}/roles`),
  catalog: (org: string) =>
    client.request<Record<string, string[]>>(`${base(org)}/roles/permissions`),
  saveRole: (org: string, role: string, permission: Record<string, string[]>, original?: string) =>
    client.request(`${base(org)}/roles${original ? `/${encodeURIComponent(original)}` : ""}`, {
      method: original ? "PATCH" : "POST",
      body: JSON.stringify(original ? { roleName: role, permission } : { role, permission }),
    }),
  deleteRole: (org: string, role: string) =>
    client.request(`${base(org)}/roles/${encodeURIComponent(role)}`, { method: "DELETE" }),
  invitations: (org: string) => client.request<Invitation[]>(`${base(org)}/invitations`),
  received: () => client.request<Invitation[]>(`${base("current")}/invitations/user`),
  invitation: (org: string, id: string) =>
    client.request<Invitation>(`${base(org)}/invitations/${encodeURIComponent(id)}`),
  invitationAction: (org: string, id: string, action: "accept" | "reject" | "cancel" | "resend") =>
    client.request(
      `${base(org)}/invitations/${action === "resend" ? `${encodeURIComponent(id)}/resend` : action}`,
      { method: "POST", body: JSON.stringify({ invitationId: id }) },
    ),
};
