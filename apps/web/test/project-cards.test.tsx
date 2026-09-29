import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard } from "@/features/projects/project-card";
import { ProjectListPage } from "@/features/projects/project-list";
import { project } from "./support/query-hooks";
import { renderWithRouter } from "./support/render-component";

describe("project cards", () => {
  it.each([
    ["planned", "violet"], ["backlog", "slate"], ["in_progress", "blue"],
    ["paused", "amber"], ["completed", "emerald"], ["cancelled", "rose"],
  ])("colors %s cards consistently in light and dark mode", (status, color) => {
    renderWithRouter(<ProjectCard organizationSlug="acme" project={{ ...project, status }} />);
    expect(screen.getByRole("article")).toHaveClass(`bg-${color}-50/70`, `dark:bg-${color}-500/10`, `border-${color}-200/80`);
    expect(screen.getByText(status.replaceAll("_", " "))).toHaveClass(`text-${color}-700`, `dark:text-${color}-300`);
  });

  it("uses the planned palette when a status is missing or unknown", () => {
    renderWithRouter(<ProjectCard organizationSlug="acme" project={{ ...project, status: "unknown" }} />);
    expect(screen.getByRole("article")).toHaveClass("bg-violet-50/70");
  });

  it("uses three desktop columns without hiding additional projects or showing collection labels", () => {
    const projects = Array.from({ length: 4 }, (_, i) => ({ ...project, id: `p${i}`, name: `Project ${i}`, identifier: `P${i}` }));
    renderWithRouter(<ProjectListPage organizationSlug="acme" organizationName="Acme" state={{
      organizationId: undefined, leadIds: [], setLeadIds: vi.fn(),
      projects, createdProject: null, name: "", identifier: "", description: "",
      loading: false, projectsLoading: false, error: null,
      setName: vi.fn(), setIdentifier: vi.fn(), setDescription: vi.fn(), createProject: vi.fn(),
    }} />);
    expect(screen.getByLabelText("Project cards")).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.queryByText("Workspace", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Workspace collection")).not.toBeInTheDocument();
  });

  it("preserves navigation and real project details", () => {
    renderWithRouter(<ProjectCard organizationSlug="acme" project={{ ...project, description: "Launch the new site", status: "in_progress", members: [{ id: "m1", firstName: "Ada", lastName: "Lovelace" }] }} />);
    expect(screen.getByRole("link", { name: "Open Website" })).toHaveAttribute("href", "/acme/projects/WEB");
    expect(screen.getByRole("link", { name: "Open Website" })).toHaveClass("min-h-[192px]");
    expect(screen.getByText("Launch the new site")).toBeInTheDocument();
    expect(screen.getByText("in progress")).toBeInTheDocument();
    expect(screen.getByText("1 member")).toBeInTheDocument();
    expect(screen.getByTitle("Ada Lovelace")).toHaveTextContent("AL");
  });

  it("shows the supplied cover and honest empty metadata", () => {
    renderWithRouter(<ProjectCard organizationSlug="acme" project={{ ...project, coverImageURL: "/cover.jpg" }} />);
    expect(screen.getByRole("img", { name: "Website project cover" })).toHaveAttribute("src", "/cover.jpg");
    expect(screen.getByText("0 members")).toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
  });
});
