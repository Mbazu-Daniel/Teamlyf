import { describe, expect, it, vi } from "vitest";
import { PermissionsGuard } from "./permissions.guard";

describe("PermissionsGuard agent grants", () => {
  it("allows an agent only when it has the matching tenant-scoped grant", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "grant" }]);
    const guard = new PermissionsGuard({} as never, {} as never, { query: { permissionGrant: { findMany } } } as never);
    await expect(guard.checkAgentPermission("org-a", "agent-a", "docs", "create")).resolves.toBe(true);
    expect(findMany).toHaveBeenCalledOnce();
  });
  it("rejects an agent without a matching grant", async () => {
    const guard = new PermissionsGuard({} as never, {} as never, { query: { permissionGrant: { findMany: vi.fn().mockResolvedValue([]) } } } as never);
    await expect(guard.checkAgentPermission("org-a", "agent-a", "docs", "create")).resolves.toBe(false);
  });
});
