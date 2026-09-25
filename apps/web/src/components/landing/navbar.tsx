import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Features", href: "#features" },
  { label: "Showcase", href: "#showcase" },
  { label: "Pricing", href: "#pricing" },
] as const;

/**
 * Full-width frosted top bar — the `.app-topbar` chrome the signed-in app header
 * also wears, so the marketing page and the product read as one surface. The bar
 * is fixed, which keeps the hero's existing top spacing untouched; only the
 * section anchors need `scroll-mt` to clear it.
 */
export function Navbar() {
  return (
    <header className="app-topbar fixed inset-x-0 top-0 z-20 border-b border-border">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Brand />

        <div className="ml-2 hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button render={<Link to="/sign-in" />} variant="ghost" size="sm">
            Log in
          </Button>
          <Button render={<Link to="/sign-up" />} variant="ink" size="sm">
            Get started
          </Button>
        </div>
      </nav>
    </header>
  );
}
