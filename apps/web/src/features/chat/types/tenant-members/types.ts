export interface TenantMemberAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
}

export interface EmergencyContact {
  name: string | null;
  relationship: string | null;
  phone: string | null;
  // extension?: string | null;
  // mobilePhone?: string | null;
  // email?: string | null;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "guest" | string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  preferredName: string;
  dob?: string | null;
  gender?: string | null;
  /** Account status on the workspace — not chat presence. */
  status: "active" | "inactive" | "suspended" | string;
  /** Chat/presence column; prefer `isOnline` from API when available for live presence. */
  presenceStatus: "online" | "offline" | "away" | "busy" | string;
  /** Live socket presence from Redis when provided by the members list API. */
  isOnline?: boolean;
  customStatus: string | null;
  /** Resolved media URL from avatarKey (not a raw storage key). */
  avatar?: string | null;
  email?: string | null;
  employeeCode: string;
  employeeNumber: string | null;
  jobTitle: string | null;
  address: TenantMemberAddress;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  emergencyContact: EmergencyContact;
  department?: {
    id: string;
    name: string;
  };
  reportsTo?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    jobTitle: string | null;
  } | null;
  hireDate: string | null;
  phoneNumber: string | null;
  employmentStatus: string | null;
  createdAt?: string;
  updatedAt: string;
}