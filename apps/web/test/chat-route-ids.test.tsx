import { describe, expect, it } from "vitest";
import { parseEntityId } from "@/lib/utils/parse-entity-id";

describe("chat route identifiers", () => {
  it("opens persisted UUIDv7 channels and member conversations", () => {
    const id = "01a0ec97-f4dc-7883-8179-a677e7258326";
    expect(parseEntityId(id)).toBe(id);
    expect(parseEntityId([id.toUpperCase()])).toBe(id);
  });
  it("preserves supported legacy identifiers", () => {
    expect(parseEntityId("ch_123456789abcd")).toBe("ch_123456789abcd");
    expect(parseEntityId("temp-message")).toBe("temp-message");
    expect(parseEntityId(12)).toBe("12");
  });
  it("rejects missing identifiers and path-like input", () => {
    expect(() => parseEntityId(undefined)).toThrow("Missing entity id");
    expect(() => parseEntityId("../../settings")).toThrow("Invalid entity id");
    expect(() => parseEntityId(Number.NaN)).toThrow("Invalid entity id");
  });
});
