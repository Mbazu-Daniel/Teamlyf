import { Link } from "@tanstack/react-router";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { BrandMark } from "@/components/ui/brand";

const links = [
  { label: "Features", href: "/#features" },
  { label: "Product", href: "/#product" },

  { label: "Pricing", href: "/#pricing" },
] as const;

export function Navbar() {
  return (
    <header className="landing-nav fixed inset-x-0 top-0 z-30">
      <nav
        aria-label="Primary"
        className="relative mx-auto grid h-[72px] max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6"
      >
        <Link to="/" className="flex items-center gap-2.5" aria-label="Teamlyf home">
          <BrandMark />
          <span className="text-base font-bold tracking-[-0.02em] text-[var(--landing-ink)]">
            Teamlyf
          </span>
        </Link>

        {/* Dead centre, not tucked against the logo: three equal columns keep the
            links optically centred as the right-hand buttons change width. */}
        <div className="hidden items-center gap-1 justify-self-center md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--landing-muted)] transition-colors hover:bg-[var(--landing-soft)] hover:text-[var(--landing-ink)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <ThemeSwitcher variant="landing" compact />
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
