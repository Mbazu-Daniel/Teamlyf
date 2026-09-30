import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthLayout } from "@/components/auth/auth-layout";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("AuthLayout", () => {
  it.each(["Sign in", "Create your account", "Forgot password", "Reset password"])(
    "centers the %s heading without an account kicker",
    (title) => {
      render(
        <AuthLayout title={title} description="Account instructions">
          <form aria-label="Auth form" />
        </AuthLayout>,
      );
      expect(screen.getByRole("heading", { name: title, level: 1 }).parentElement).toHaveClass(
        "text-center",
      );
      expect(screen.queryByText("TEAMLYF ACCOUNT")).not.toBeInTheDocument();
    },
  );

  it("keeps the logo above the form card and aligned right", () => {
    const { container } = render(
      <AuthLayout title="Sign in" description="Welcome back">
        <form aria-label="Sign in form" />
      </AuthLayout>,
    );
    const logo = screen.getByRole("link", { name: "Teamlyf" });
    const card = container.querySelector(".auth-form-card");
    expect(logo).toHaveAttribute("href", "/");
    expect(logo.parentElement).toHaveClass("justify-end");
    expect(card).not.toContainElement(logo);
    expect(card).toHaveClass("bg-card", "rounded-xl", "p-6", "sm:p-8");
    expect(card).toContainElement(screen.getByRole("form", { name: "Sign in form" }));
  });

  it("uses the same card layout for password recovery", () => {
    render(
      <AuthLayout title="Reset password" description="Choose a new password">
        <input aria-label="New password" type="password" />
      </AuthLayout>,
    );
    expect(screen.getByRole("heading", { name: "Reset password", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveAttribute("type", "password");
  });

  it("shows the wordmark with the real Teamlyf mark_notAColoredLetter", () => {
    render(
      <AuthLayout title="Sign in">
        <form aria-label="Sign in form" />
      </AuthLayout>,
    );

    const wordmark = screen.getByRole("link", { name: "Teamlyf" });

    const logo = wordmark.querySelector("img");
    expect(logo).toHaveAttribute("src", "https://cdn.getteamlyf.com/teamlyf/logo-icon.svg");
  });
});
