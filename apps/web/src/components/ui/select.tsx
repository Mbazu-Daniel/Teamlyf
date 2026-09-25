import { Select as SelectPrimitive } from "@base-ui/react/select";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type SelectProps = Omit<SelectPrimitive.Root.Props<string>, "onValueChange"> & {
  onValueChange?: (value: string) => void;
};

function Select({ onValueChange, ...props }: SelectProps) {
  return (
    <SelectPrimitive.Root
      data-slot="select"
      onValueChange={(value) => {
        if (value != null) onValueChange?.(value);
      }}
      {...props}
    />
  );
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

type SelectTriggerProps = Omit<SelectPrimitive.Trigger.Props, "className"> & {
  className?: string;
  size?: "sm" | "default";
};

function SelectTrigger({ className, size = "default", children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-full border border-input bg-transparent px-4 text-sm whitespace-nowrap transition-[background-color,border-color,color] outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground data-[size=default]:h-10 data-[size=sm]:h-8",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon render={<IconChevronDown />} />
    </SelectPrimitive.Trigger>
  );
}

type SelectContentProps = Omit<SelectPrimitive.Popup.Props, "className"> & {
  className?: string;
  align?: SelectPrimitive.Positioner.Props["align"];
  side?: SelectPrimitive.Positioner.Props["side"];
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"];
};

function SelectContent({
  className,
  children,
  align = "center",
  side = "bottom",
  sideOffset = 6,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
        className="z-50 isolate"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List className="flex flex-col gap-0.5">{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

type SelectItemProps = Omit<SelectPrimitive.Item.Props, "className"> & { className?: string };

function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-9 pl-3 text-sm outline-none select-none transition-colors focus:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span data-slot="select-item-indicator" className="absolute right-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <IconCheck className="size-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};
