import { cn } from "@/lib/utils";

export function EmptyStateArt({
  variant = "chat",
  className,
}: {
  variant?: "chat" | "people" | "documents" | "projects";
  className?: string;
}) {
  const label = {
    chat: "A conversation between two teammates",
    people: "A team of people",
    documents: "A stack of documents",
    projects: "A board of project cards",
  }[variant];

  return (
    <svg
      viewBox="0 0 240 160"
      role="img"
      aria-label={label}
      className={cn("h-auto w-full max-w-[240px] text-muted-foreground/70", className)}
    >
      <defs>
        <linearGradient id={`esa-accent-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Soft plate so the art sits on something rather than floating */}
      <rect
        x="14"
        y="16"
        width="212"
        height="128"
        rx="20"
        fill={`url(#esa-accent-${variant})`}
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />

      {variant === "chat" ? (
        <>
          {/* Incoming bubble, left */}
          <rect
            x="34"
            y="44"
            width="92"
            height="44"
            rx="14"
            fill="var(--background)"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
          <path
            d="M46 88v10a4 4 0 0 0 4-4V88"
            fill="var(--background)"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect
            x="48"
            y="58"
            width="62"
            height="5"
            rx="2.5"
            fill="currentColor"
            fillOpacity="0.34"
          />
          <rect
            x="48"
            y="70"
            width="40"
            height="5"
            rx="2.5"
            fill="currentColor"
            fillOpacity="0.2"
          />

          {/* Outgoing bubble, right, tinted with the brand accent */}
          <rect
            x="112"
            y="82"
            width="94"
            height="42"
            rx="14"
            fill="var(--primary)"
            fillOpacity="0.14"
            stroke="var(--primary)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <path
            d="M194 124v10a4 4 0 0 1-4-4v-6"
            fill="var(--primary)"
            fillOpacity="0.14"
            stroke="var(--primary)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect
            x="126"
            y="96"
            width="56"
            height="5"
            rx="2.5"
            fill="var(--primary)"
            fillOpacity="0.5"
          />
          <rect
            x="126"
            y="107"
            width="34"
            height="5"
            rx="2.5"
            fill="var(--primary)"
            fillOpacity="0.32"
          />
        </>
      ) : variant === "people" ? (
        <>
          <circle
            cx="88"
            cy="62"
            r="17"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <path
            d="M60 116c0-15.5 12.5-28 28-28s28 12.5 28 28"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="152"
            cy="70"
            r="13"
            fill="var(--primary)"
            fillOpacity="0.16"
            stroke="var(--primary)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <path
            d="M130 116c0-12.1 9.8-22 22-22s22 9.9 22 22"
            fill="none"
            stroke="var(--primary)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : variant === "documents" ? (
        <>
          <rect
            x="52"
            y="38"
            width="96"
            height="84"
            rx="10"
            fill="var(--background)"
            stroke="currentColor"
            strokeOpacity="0.22"
            strokeWidth="1.5"
            transform="rotate(-6 100 80)"
          />
          <rect
            x="78"
            y="46"
            width="96"
            height="84"
            rx="10"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <rect
            x="94"
            y="66"
            width="52"
            height="5"
            rx="2.5"
            fill="var(--primary)"
            fillOpacity="0.45"
          />
          <rect
            x="94"
            y="80"
            width="64"
            height="5"
            rx="2.5"
            fill="currentColor"
            fillOpacity="0.24"
          />
          <rect
            x="94"
            y="94"
            width="38"
            height="5"
            rx="2.5"
            fill="currentColor"
            fillOpacity="0.24"
          />
        </>
      ) : (
        <>
          <rect
            x="40"
            y="40"
            width="76"
            height="80"
            rx="12"
            fill="var(--background)"
            stroke="currentColor"
            strokeOpacity="0.24"
            strokeWidth="1.5"
          />
          <rect
            x="124"
            y="40"
            width="76"
            height="80"
            rx="12"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeOpacity="0.42"
            strokeWidth="1.5"
          />
          <rect x="54" y="56" width="26" height="26" rx="8" fill="currentColor" fillOpacity="0.2" />
          <rect
            x="138"
            y="56"
            width="26"
            height="26"
            rx="8"
            fill="var(--primary)"
            fillOpacity="0.22"
          />
          <rect
            x="54"
            y="92"
            width="48"
            height="5"
            rx="2.5"
            fill="currentColor"
            fillOpacity="0.24"
          />
          <rect
            x="138"
            y="92"
            width="48"
            height="5"
            rx="2.5"
            fill="var(--primary)"
            fillOpacity="0.4"
          />
        </>
      )}
    </svg>
  );
}
