import type { Database } from "@teamlyf/db";
import { department, departmentMember, member, memberProfile, user } from "@teamlyf/db";
import { and, asc, eq, inArray } from "drizzle-orm";

type MemberRow = typeof member.$inferSelect;
type UserRow = typeof user.$inferSelect;
type MemberProfileRow = typeof memberProfile.$inferSelect;
type DepartmentRow = typeof department.$inferSelect;

export type ChatTenantMember = {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  preferredName: string;
  dob?: string | null;
  gender?: string | null;
  status: string;
  presenceStatus: string;
  isOnline: boolean;
  customStatus: string | null;
  avatar: string | null;
  email: string | null;
  employeeCode: string;
  employeeNumber: string | null;
  jobTitle: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  };
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  emergencyContact: { name: string | null; relationship: string | null; phone: string | null };
  department: { id: string; name: string } | null;
  reportsTo?: unknown;
  hireDate: string | null;
  phoneNumber: string | null;
  employmentStatus: string | null;
  createdAt?: string;
  updatedAt: string;
};

export type ChatParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  avatarKey?: string | null;
  avatar: string | null;
};

export type ChatMemberSource = {
  member: MemberRow;
  user: UserRow | null;
  profile: MemberProfileRow | null;
  department: Pick<DepartmentRow, "id" | "name"> | null;
};

function splitDisplayName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) ?? "" };
}

function nameOf(source: ChatMemberSource): { firstName: string; lastName: string } {
  if (source.member.firstName || source.member.lastName) {
    return { firstName: source.member.firstName ?? "", lastName: source.member.lastName ?? "" };
  }
  return splitDisplayName(source.user?.name ?? "");
}

export function toChatParticipant(source: ChatMemberSource): ChatParticipant {
  const { firstName, lastName } = nameOf(source);
  return {
    id: source.member.id,
    firstName,
    lastName,
    preferredName: firstName,
    avatar: source.member.avatar ?? null,
  };
}

export function toChatTenantMember(source: ChatMemberSource, isOnline: boolean): ChatTenantMember {
  const { firstName, lastName } = nameOf(source);
  const profile = source.profile;

  return {
    id: source.member.id,
    tenantId: source.member.organizationId,
    userId: source.member.userId,
    role: source.member.role,
    firstName,
    lastName,
    middleName: null,
    preferredName: firstName,
    dob: null,
    gender: null,
    status: profile?.status ?? "active",
    presenceStatus: isOnline ? "online" : "offline",
    isOnline,
    customStatus: null,
    avatar: source.member.avatar ?? null,
    email: source.user?.email ?? null,
    employeeCode: profile?.employeeNumber ?? "",
    employeeNumber: profile?.employeeNumber ?? null,
    jobTitle: profile?.jobTitle ?? null,
    address: {
      street: profile?.address ?? null,
      city: null,
      state: null,
      zip: null,
      country: null,
    },
    street: profile?.address ?? null,
    emergencyContact: {
      name: profile?.emergencyContactName ?? null,
      relationship: null,
      phone: profile?.emergencyContactPhone ?? null,
    },
    department: source.department,
    reportsTo: null,
    hireDate: profile?.startDate ? profile.startDate.toISOString() : null,
    phoneNumber: profile?.phone ?? null,
    employmentStatus: profile?.employmentType ?? null,
    createdAt: source.member.createdAt.toISOString(),
    updatedAt: source.member.updatedAt.toISOString(),
  };
}

export type LoadChatMembersOptions = { memberIds?: string[] };

export async function loadChatMemberSourceMap(
  db: Database,
  organizationId: string,
  memberIds: string[],
): Promise<Map<string, ChatMemberSource>> {
  const sources = await loadChatMemberSources(db, organizationId, { memberIds });
  return new Map(sources.map((source) => [source.member.id, source]));
}

export async function loadChatMemberSources(
  db: Database,
  organizationId: string,
  options: LoadChatMembersOptions = {},
): Promise<ChatMemberSource[]> {
  const { memberIds } = options;
  if (memberIds && memberIds.length === 0) return [];

  const memberRows = await db.query.member.findMany({
    where: and(
      eq(member.organizationId, organizationId),
      memberIds ? inArray(member.id, memberIds) : undefined,
    ),
    orderBy: [asc(member.firstName), asc(member.lastName)],
  });
  if (memberRows.length === 0) return [];

  const userIds = [...new Set(memberRows.map((row) => row.userId))];
  const ids = memberRows.map((row) => row.id);

  const [userRows, profileRows, departmentRows] = await Promise.all([
    db.query.user.findMany({ where: inArray(user.id, userIds) }),
    db.query.memberProfile.findMany({ where: inArray(memberProfile.memberId, ids) }),
    db
      .select({
        memberId: departmentMember.memberId,
        departmentId: department.id,
        departmentName: department.name,
      })
      .from(departmentMember)
      .innerJoin(department, eq(department.id, departmentMember.departmentId))
      .where(eq(department.organizationId, organizationId)),
  ]);

  const usersById = new Map(userRows.map((row) => [row.id, row]));
  const profilesById = new Map(profileRows.map((row) => [row.memberId, row]));
  const departmentsByMember = new Map(
    departmentRows.map((row) => [row.memberId, { id: row.departmentId, name: row.departmentName }]),
  );

  return memberRows.map((memberRow) => ({
    member: memberRow,
    user: usersById.get(memberRow.userId) ?? null,
    profile: profilesById.get(memberRow.id) ?? null,
    department: departmentsByMember.get(memberRow.id) ?? null,
  }));
}
