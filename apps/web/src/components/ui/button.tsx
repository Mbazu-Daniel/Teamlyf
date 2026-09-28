import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent font-semibold whitespace-nowrap transition-[background-color,border-color,color] duration-150 ease-out outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary-500/25 hover:bg-primary-600",
        accent:
          "bg-accent text-accent-foreground font-bold shadow-lg shadow-accent-500/30 hover:bg-accent-300 focus-visible:ring-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary)_88%,var(--foreground))]",
        outline: "border-border bg-transparent text-foreground hover:bg-muted",
        "auth-outline": "rounded-xl border-border bg-card text-foreground hover:bg-muted",
        auth: "rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary-500/20 hover:bg-primary-600",
        ink: "bg-text-50 text-background-950 shadow-lg shadow-black/40 hover:bg-text-100",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        soft: "border border-[var(--button-soft-border)] bg-[var(--button-soft-bg)] text-[var(--button-soft-foreground)] shadow-[0_18px_30px_-20px_var(--button-soft-shadow)] hover:bg-[var(--button-soft-hover)] active:translate-y-px",
        "outline-destructive": "border-border hover:bg-muted text-destructive bg-input/40",
        "primary-button":
          "text-primary-foreground shadow-lg shadow-primary-500/25 bg-primary-button hover:bg-primary-button/90",
        "primary-button-white":
          "shadow-lg shadow-primary-500/25 bg-primary-button text-white hover:bg-primary-button/90",
        "outline-primary":
          "bg-transparent border-primary-button/30 text-primary-button hover:bg-primary-button/10 rounded-lg",
        "ghost-muted": "hover:text-foreground rounded-md text-muted-foreground hover:bg-muted",
        "soft-body":
          "border border-[var(--button-soft-border)] bg-[var(--button-soft-bg)] shadow-[0_18px_30px_-20px_var(--button-soft-shadow)] hover:bg-[var(--button-soft-hover)] active:translate-y-px font-body-md text-body-md",
        "ghost-primary":
          "rounded-md text-primary-button hover:bg-primary-button hover:text-white transition-colors",
        "danger-ghost": "text-muted-foreground hover:text-foreground hover:bg-red-50",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-8 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-7 text-base",
        auth: "h-12 px-6 text-[15px]",
        app: "h-10 px-6 py-2.5 text-sm font-bold",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
        xs: "h-8 px-4 [&_svg:not([class*='size-'])]:size-3.5 gap-2 text-xs",
        "sm-relaxed": "h-8 px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5 gap-2",
        "app-wide": "h-10 py-2.5 text-sm font-bold px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
