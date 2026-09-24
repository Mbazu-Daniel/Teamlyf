import { Link } from "@tanstack/react-router";
import { IconRocket } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

/** N5 · Floating pill — content-sized, detached, blur backdrop (modern-minimal default). */
export function Navbar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 top-4 z-20 mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-background/80 p-1.5 pl-4 shadow-lg shadow-background-950/50 backdrop-blur-md saturate-150"
    >
      <Link to="/" className="flex shrink-0 items-center gap-2 pr-3 font-bold tracking-tight whitespace-nowrap">
        <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
          <IconRocket className="size-4" />
        </span>
        Teamlyf
      </Link>

      <div className="hidden items-center gap-1 sm:flex">
        <a
          href="#features"
          className="rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          Features
        </a>
        <a
          href="#pricing"
          className="rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        >
          Pricing
        </a>
      </div>

      <Button render={<Link to="/projects" />} size="sm" className="ml-1">
        Get started
      </Button>
    </nav>
  );
}
