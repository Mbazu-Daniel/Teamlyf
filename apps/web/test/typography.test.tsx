import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { designSystem } from "@/lib/design-system";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("shared typography", () => {
  it("uses Montserrat for the application font", () => {
    const declarations = [...styles.matchAll(/--font-sans:\s*([^;]+);/g)];
    expect(declarations.length).toBeGreaterThan(0);
    for (const [, value] of declarations) {
      expect(value).toMatch(/^"Montserrat"/);
    }
  });

  it.each(["body", "heading"])("keeps the %s font linked to the shared font in every theme definition", (role) => {
    const declarations = [...styles.matchAll(new RegExp(`--font-${role}:\\s*([^;]+);`, "g"))];
    expect(declarations.length).toBeGreaterThan(0);
    for (const [, value] of declarations) {
      expect(value).toBe("var(--font-sans)");
    }
  });

  it("applies typography at document level so portalled menus and dialogs inherit it", () => {
    expect(styles).toMatch(/html,\s*body\s*\{[^}]*font-family:\s*var\(--font-sans\)/);
    expect(designSystem.fontFamily).toEqual({ heading: "var(--font-heading)", body: "var(--font-body)" });
  });
});
