import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/** Full CRUD, shared by every resource. Roles below only narrow what they expose. */
const crud = ["create", "read", "update", "delete"] as const;

const fullCrud = {
  pm: crud,
  chat: crud,
  docs: crud,
  notes: crud,
  hr: crud,
  billing: crud,
  agents: crud,
};

/**
 * Role-level permissions (user subjects only).
 * Instance overrides + agent grants live in `permission_grant`, not here.
 */
const statement = { ...defaultStatements, ...fullCrud } as const;

/** Resources → allowed actions, for the roles permission-catalog endpoint. */
export const permissionCatalog = statement;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({ ...ownerAc.statements, ...fullCrud });

export const admin = ac.newRole({
  ...adminAc.statements,
  ...fullCrud,
  billing: ["create", "read", "update"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  ...fullCrud,
  docs: ["create", "read", "update"],
  notes: ["create", "read", "update"],
  hr: ["read"],
  billing: [],
  agents: ["read"],
});

export type PermissionResource = keyof typeof statement;
export type PermissionAction<R extends PermissionResource = PermissionResource> =
  (typeof statement)[R][number];
