import { Link } from "@tanstack/react-router";
import { BrandMark } from "../ui/brand";

export function Footer() {
  return (
    <footer className="px-4 pb-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-[var(--landing-line)] pt-6 text-sm text-[var(--landing-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-base font-bold tracking-[-0.02em] text-[var(--landing-ink)]">
          <BrandMark />
          Teamlyf
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <a href="/#features" className="transition-colors hover:text-[var(--landing-ink)]">
            Features
          </a>
          <a href="/#product" className="transition-colors hover:text-[var(--landing-ink)]">
            Product
          </a>
          <a href="/#pricing" className="transition-colors hover:text-[var(--landing-ink)]">
            Pricing
          </a>
          <Link to="/sign-in" className="transition-colors hover:text-[var(--landing-ink)]">
            Log in
          </Link>
        </nav>
        <p>© 2026 Teamlyf</p>
      </div>
    </footer>
  );
}
