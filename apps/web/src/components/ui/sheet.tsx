"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  modalOverlayClassName,
  sidePanelCloseClassName,
  sidePanelContentClassName,
} from "@/components/ui/side-panel"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(modalOverlayClassName, className)}
      {...props}
    />
  )
}

const sheetContentVariants = cva("", {
  variants: {
    variant: {
      default: "",
      flush: "p-0",
      flushRoundedLeft: "p-0 rounded-l-2xl",
      sidebar: "bg-sidebar text-sidebar-foreground p-0",
    },
  },
  defaultVariants: { variant: "default" },
})

function SheetContent({
  className,
  children,
  side = "right",
  variant = "default",
  ...props
}: Omit<SheetPrimitive.Popup.Props, "className"> & {
  className?: string
  side?: "top" | "right" | "bottom" | "left"
} & VariantProps<typeof sheetContentVariants>) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-closed:duration-300 data-open:duration-500",
          side === "right" && sidePanelContentClassName(className),
          side === "left" &&
            "data-closed:slide-out-to-left data-open:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-closed:slide-out-to-top data-open:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-closed:slide-out-to-bottom data-open:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          side !== "right" && className,
          sheetContentVariants({ variant }),
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className={cn(
            side === "right"
              ? sidePanelCloseClassName
              : "absolute top-2 right-1 rounded-md p-1 transition-all text-muted hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <IconX className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

const sheetHeaderVariants = cva("", {
  variants: {
    variant: {
      default: "",
      padded: "px-4 py-4",
    },
  },
  defaultVariants: { variant: "default" },
})

function SheetHeader({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof sheetHeaderVariants>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-1.5 p-4",
        sheetHeaderVariants({ variant }),
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
}
