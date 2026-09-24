import { client, type Organization } from "./client";

export type OrganizationMember = {
  id: string;
  userId: string;
  role: string;
  user?: { name?: string | null; email?: string | null } | null;
};
type OrganizationMembersResponse = { members: OrganizationMember[]; total: number };
type ActiveMemberRole = { role?: string | string[] };
export type BillingSummary = {
  plan: "starter" | "growth" | "scale";
  status: string;
  seatLimit: number;
  agentLimit: number;
  currentPeriodEnd: string | null;
  members: number;
  provider: string;
  hasSubscription: boolean;
};
export type CheckoutResponse = { url?: string; checkoutUrl?: string };

const organizationPath = (organizationId: string, suffix = "") => "/organization/" + organizationId + suffix;

export const settingsApi = {
  async members(organizationId: string) {
    const limit = 100;
    const members: OrganizationMember[] = [];
    let offset = 0;
    let total = 0;
    do {
      const page = await client.request<OrganizationMembersResponse>(
        organizationPath(organizationId, "/members"),
        { query: { limit, offset } },
      );
      members.push(...page.members);
      total = page.total;
      offset += page.members.length;
      if (!page.members.length) break;
    } while (offset < total);
    return { members, total } satisfies OrganizationMembersResponse;
  },
  updateOrganization(organizationId: string, input: { name: string; logo?: string }) {
    return client.request<Organization>(
      organizationPath(organizationId),
      { method: "PATCH", body: JSON.stringify(input) },
    );
  },
  inviteMember(organizationId: string, input: { email: string; role: string }) {
    return client.request(
      organizationPath(organizationId, "/invitations"),
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  updateMemberRole(organizationId: string, memberId: string, role: string) {
    return client.request(
      organizationPath(organizationId, "/members/update-role"),
      { method: "POST", body: JSON.stringify({ memberId, role: [role] }) },
    );
  },
  removeMember(organizationId: string, memberId: string) {
    return client.request(
      organizationPath(organizationId, "/members/remove"),
      { method: "POST", body: JSON.stringify({ memberIdOrEmail: memberId }) },
    );
  },
  activeMemberRole(organizationId: string) {
    return client.request<ActiveMemberRole>(organizationPath(organizationId, "/members/active-role"));
  },
  billing(organizationId: string) {
    return client.request<BillingSummary>(organizationPath(organizationId, "/billing"));
  },
  checkout(organizationId: string, plan: BillingSummary["plan"], successUrl: string, cancelUrl: string) {
    return client.request<CheckoutResponse>(
      organizationPath(organizationId, "/billing/checkout"),
      { method: "POST", body: JSON.stringify({ plan, successUrl, cancelUrl }) },
    );
  },
};
