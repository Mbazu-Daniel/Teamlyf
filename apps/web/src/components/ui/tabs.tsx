import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

const tabsListVariants = cva(
  "group/tabs-list inline-flex h-9 w-fit items-center justify-center rounded-full p-1 text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-4 rounded-none bg-transparent p-0",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Tabs({ className, orientation = "horizontal", onValueChange, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      className={cn("flex gap-4 data-[orientation=horizontal]:flex-col", className)}
      onValueChange={(value, eventDetails) => {
        if (value == null) return;
        onValueChange?.(value, eventDetails);
      }}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-transparent px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-active:bg-background data-active:text-foreground disabled:pointer-events-none disabled:opacity-50 group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-2px_0_var(--primary)] group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-0",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("outline-none", className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
