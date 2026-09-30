import { cn } from "@/lib/utils";

export const modalOverlayClassName =
  "fixed inset-0 z-50 bg-slate-950/36 backdrop-blur-[2px] data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0";

export function sidePanelContentClassName(className?: string) {
  return cn(
    "fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-[min(44rem,100vw)] flex-col overflow-hidden border-l border-border/60 bg-background shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none supports-[backdrop-filter]:bg-background/95 supports-[backdrop-filter]:backdrop-blur-xl data-open:animate-in data-closed:animate-out data-closed:slide-out-to-right data-open:slide-in-from-right data-closed:duration-200 data-open:duration-300 sm:max-w-[42rem]",
    className,
  );
}

export const sidePanelCloseClassName =
  "absolute top-5 right-5 z-20 inline-flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-[0_12px_32px_rgba(15,23,42,0.14)] transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
