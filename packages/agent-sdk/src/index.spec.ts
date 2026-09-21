import { describe, expect, it } from "vitest";
import { InMemoryCapabilityRegistry } from "./index";
describe("InMemoryCapabilityRegistry", () => {
  it("prevents duplicate capability registration", () => {
    const registry = new InMemoryCapabilityRegistry();
    const capability = { type: "docs", tools: [] };
    registry.register(capability);
    expect(registry.get("docs")).toBe(capability);
    expect(() => registry.register(capability)).toThrow("already registered");
  });
});
