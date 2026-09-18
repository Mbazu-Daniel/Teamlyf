const ERROR_MAP: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  NOT_AUTHORIZED: "You are not authorized to perform this action.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  SIGNUP_DISABLED: "Sign up is currently disabled.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  RATE_LIMITED: "Too many attempts. Please try again later.",
  USER_NOT_FOUND: "No account found with this email.",
  ACCOUNT_LINKED: "This account is already linked to another user.",
  MISSING_FIELDS: "Please fill in all required fields.",
  INVITATION_NOT_FOUND: "This invitation is invalid or has expired.",
  INVITATION_EXPIRED: "This invitation has expired.",
  ORGANIZATION_NOT_FOUND: "Organization not found.",
  MEMBER_NOT_FOUND: "Member not found.",
  NOT_A_MEMBER: "You are not a member of this organization.",
  ONLY_OWNER: "The owner cannot be removed from the organization.",
};

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export interface BetterAuthErrorBody {
  message?: string;
  code?: string;
}

export function sanitizeBetterAuthError(body: unknown): { message: string } {
  if (!body || typeof body !== "object") return { message: FALLBACK_MESSAGE };

  const { code, message } = body as BetterAuthErrorBody;

  if (!code) return body as { message: string };

  return { message: ERROR_MAP[code] ?? message ?? FALLBACK_MESSAGE };
}

export function isBetterAuthError(body: unknown): body is BetterAuthErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof (body as BetterAuthErrorBody).code === "string"
  );
}
