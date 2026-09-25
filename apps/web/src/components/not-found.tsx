import { Link, useLocation } from "@tanstack/react-router";
import { IconArrowLeft, IconHome, IconMapPinOff } from "@tabler/icons-react";
import { Button } from "./ui/button";

/** Router not-found fallback — styled from the shared design tokens in styles.css. */
export function NotFound() {
  const { pathname } = useLocation();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.35_0.15_293/0.35),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 size-72 rounded-full bg-accent-400/10 blur-3xl"
      />

      <section className="relative w-full max-w-lg rounded-2xl border border-border bg-card/80 p-8 text-center shadow-2xl shadow-primary-950/40 backdrop-blur sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-border bg-background-800 text-primary-400">
          <IconMapPinOff className="size-6" aria-hidden="true" />
        </span>

        <p
          aria-hidden="true"
          className="mt-6 bg-linear-to-r from-primary-400 to-accent-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl"
        >
          404
        </p>

        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">This page wandered off</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t find{" "}
          <code className="rounded bg-background-800 px-1.5 py-0.5 text-sm text-text-200 break-all">
            {pathname}
          </code>
          . It may have been moved, renamed, or never existed.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button render={<Link to="/" />}>
            <IconHome aria-hidden="true" />
            Back to home
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <IconArrowLeft aria-hidden="true" />
            Go back
          </Button>
        </div>
      </section>
    </main>
  );
}
