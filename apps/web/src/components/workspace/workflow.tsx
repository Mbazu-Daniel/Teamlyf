import type { InputHTMLAttributes, ReactNode } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { pageInput, pagePrimaryAction } from "./page-layout";
import { ApiError } from "@/lib/api/errors";

export function WorkflowSheet({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description ?? "Manage workspace information. Changes are saved when you submit."}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function WorkflowField({
  label,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input {...input} className={pageInput} />
    </label>
  );
}

export function WorkflowError({ error }: { error: unknown }) {
  if (!error) return null;
  const denied = error instanceof ApiError && error.status === 403;
  return (
    <p
      role="alert"
      className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
    >
      {denied
        ? "Access denied. Your workspace role does not allow this action."
        : error instanceof Error
          ? error.message
          : "Unable to complete this request. Please try again."}
    </p>
  );
}

export function WorkflowSubmit({
  pending,
  label = "Save changes",
}: {
  pending: boolean;
  label?: string;
}) {
  return (
    <button type="submit" disabled={pending} className={pagePrimaryAction + " cursor-pointer"}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function useWorkflowMutation(keys: QueryKey[], onSuccess?: () => void | Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (operation: () => Promise<unknown>) => operation(),
    onSuccess: async () => {
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      await onSuccess?.();
    },
  });
}
