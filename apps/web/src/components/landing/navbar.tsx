import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/ui/brand";

const links = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
] as const;

export function Navbar() {
  return (
    <header className="landing-nav fixed inset-x-0 top-0 z-30">
      <nav aria-label="Primary" className="mx-auto flex h-[72px] max-w-6xl items-center px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Teamlyf home">
          <Brand />
        </Link>

        <div className="ml-8 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--landing-muted)] transition-colors hover:bg-white/70 hover:text-[var(--landing-ink)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/sign-in"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[var(--landing-ink)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/sign-up"
            className="landing-dark-button inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
