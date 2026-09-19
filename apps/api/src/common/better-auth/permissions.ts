import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Role-level permissions (user subjects only).
 * Instance overrides + agent grants live in `permission_grant`, not here.
 */
export const statement = {
  ...defaultStatements,
  pm: ["create", "read", "update", "delete"],
  chat: ["create", "read", "update", "delete"],
  docs: ["create", "read", "update", "delete"],
  notes: ["create", "read", "update", "delete"],
  hr: ["create", "read", "update", "delete"],
  billing: ["create", "read", "update", "delete"],
  agents: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
  pm: ["create", "read", "update", "delete"],
  chat: ["create", "read", "update", "delete"],
  docs: ["create", "read", "update", "delete"],
  notes: ["create", "read", "update", "delete"],
  hr: ["create", "read", "update", "delete"],
  billing: ["create", "read", "update", "delete"],
  agents: ["create", "read", "update", "delete"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  pm: ["create", "read", "update", "delete"],
  chat: ["create", "read", "update", "delete"],
  docs: ["create", "read", "update", "delete"],
  notes: ["create", "read", "update", "delete"],
  hr: ["create", "read", "update", "delete"],
  billing: ["create", "read", "update"],
  agents: ["create", "read", "update", "delete"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  pm: ["create", "read", "update", "delete"],
  chat: ["create", "read", "update", "delete"],
  docs: ["create", "read", "update"],
  notes: ["create", "read", "update"],
  hr: ["read"],
  billing: [],
  agents: ["read"],
});

export type PermissionResource = keyof typeof statement;
export type PermissionAction<R extends PermissionResource = PermissionResource> =
  (typeof statement)[R][number];
