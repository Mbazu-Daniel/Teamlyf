import { Link } from "@tanstack/react-router";

/** Ft2 · Inline-rule single line — wordmark, links, copyright. Hairline above, no columns. */
export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <Link to="/" className="font-bold text-text-200 transition-colors duration-150 hover:text-foreground">
          Teamlyf
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="#features" className="transition-colors duration-150 hover:text-foreground">
            Features
          </a>
          <a href="#showcase" className="transition-colors duration-150 hover:text-foreground">
            Showcase
          </a>
          <a href="#pricing" className="transition-colors duration-150 hover:text-foreground">
            Pricing
          </a>
        </nav>
        <p>© 2026 Teamlyf</p>
      </div>
    </footer>
  );
}
