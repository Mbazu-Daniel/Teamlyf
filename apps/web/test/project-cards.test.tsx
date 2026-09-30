import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyStateArt } from "@/components/ui/empty-state-art";
import { ProjectCard } from "@/features/projects/project-card";
import { ProjectListPage } from "@/features/projects/project-list";
import { projectSlug, slugify } from "@/lib/slug";
import { project } from "./support/query-hooks";
import { renderWithRouter } from "./support/render-component";

describe("EmptyStateArt", () => {
  it.each(["chat", "people", "documents", "projects"] as const)(
    "renders %s artwork as an inline, themeable SVG",
    (variant) => {
      const { container } = render(<EmptyStateArt variant={variant} />);

      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
      expect(container.innerHTML).toContain("var(--primary)");
    },
  );

  it("keeps its viewBox so the art is never squashed into a wrong aspect ratio", () => {
    const { container } = render(<EmptyStateArt />);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 240 160");
  });

  it("defaults to the chat variant", () => {
    render(<EmptyStateArt />);
    expect(screen.getByRole("img")).toHaveAccessibleName("A conversation between two teammates");
  });
});

describe("slugify", () => {
  it("lowercases before filtering, so a leading capital is not eaten", () => {
    expect(slugify("Website")).toBe("website");
    expect(slugify("ABC")).toBe("abc");
  });

  it("turns spaces and punctuation into single dashes", () => {
    expect(slugify("Mobile App v2")).toBe("mobile-app-v2");
    expect(slugify("  Website Redesign  ")).toBe("website-redesign");
    expect(slugify("Q1/Q2 — planning")).toBe("q1-q2-planning");
  });

  it("builds the project link segment from the name", () => {
    expect(projectSlug({ name: "Website Redesign" })).toBe("website-redesign");
  });
});

describe("project cards", () => {
  it.each([
    ["planned", "violet"],
    ["backlog", "slate"],
    ["in_progress", "blue"],
    ["paused", "amber"],
    ["completed", "emerald"],
    ["cancelled", "rose"],
  ])("colors %s cards consistently in light and dark mode", (status, color) => {
    renderWithRouter(<ProjectCard organizationSlug="acme" project={{ ...project, status }} />);
    expect(screen.getByRole("article")).toHaveClass(
      `bg-${color}-50/70`,
      `dark:bg-${color}-500/10`,
      `border-${color}-200/80`,
    );
    expect(screen.getByText(status.replaceAll("_", " "))).toHaveClass(
      `text-${color}-700`,
      `dark:text-${color}-300`,
    );
  });

  it("uses the planned palette when a status is missing or unknown", () => {
    renderWithRouter(
      <ProjectCard organizationSlug="acme" project={{ ...project, status: "unknown" }} />,
    );
    expect(screen.getByRole("article")).toHaveClass("bg-violet-50/70");
  });

  it("fits three to four cards per row on desktop and shows all of them at once", () => {
    const projects = Array.from({ length: 8 }, (_, i) => ({
      ...project,
      id: `p${i}`,
      name: `Project ${i}`,
      identifier: `P${i}`,
    }));
    renderWithRouter(
      <ProjectListPage
        organizationSlug="acme"
        organizationName="Acme"
        state={{
          organizationId: undefined,
          leadIds: [],
          setLeadIds: vi.fn(),
          projects,
          createdProject: null,
          name: "",
          identifier: "",
          description: "",
          loading: false,
          projectsLoading: false,
          error: null,
          setName: vi.fn(),
          setIdentifier: vi.fn(),
          setDescription: vi.fn(),
          createProject: vi.fn(),
        }}
      />,
    );
    expect(screen.getByLabelText("Project cards")).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "2xl:grid-cols-4",
    );

    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.queryByText("Workspace", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Workspace collection")).not.toBeInTheDocument();
  });

  it("preserves navigation and real project details", () => {
    renderWithRouter(
      <ProjectCard
        organizationSlug="acme"
        project={{
          ...project,
          description: "Launch the new site",
          status: "in_progress",
          members: [{ id: "m1", firstName: "Ada", lastName: "Lovelace" }],
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "Open Website" })).toHaveAttribute(
      "href",

      "/acme/projects/website",
    );
    expect(screen.getByRole("link", { name: "Open Website" })).toHaveClass("min-h-[148px]");
    expect(screen.getByText("Launch the new site")).toBeInTheDocument();
    expect(screen.getByText("in progress")).toBeInTheDocument();

    expect(screen.getByLabelText("Project members")).toBeInTheDocument();
    expect(screen.getByTitle("Ada Lovelace")).toHaveTextContent("AL");
  });

  it("shows the supplied cover and honest empty metadata", () => {
    renderWithRouter(
      <ProjectCard organizationSlug="acme" project={{ ...project, coverImageURL: "/cover.jpg" }} />,
    );
    expect(screen.getByRole("img", { name: "Website project cover" })).toHaveAttribute(
      "src",
      "/cover.jpg",
    );
    expect(screen.getByText("0")).toBeInTheDocument();

    expect(screen.queryByText("No description yet.")).not.toBeInTheDocument();
  });
});
