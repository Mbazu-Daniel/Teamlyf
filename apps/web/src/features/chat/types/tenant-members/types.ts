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

  isCurrentMember?: boolean;
  role: "owner" | "admin" | "member" | "guest" | string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  preferredName: string;
  dob?: string | null;
  gender?: string | null;

  status: "active" | "inactive" | "suspended" | string;

  presenceStatus: "online" | "offline" | "away" | "busy" | string;

  isOnline?: boolean;
  customStatus: string | null;

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
