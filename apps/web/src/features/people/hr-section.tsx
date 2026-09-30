import type { ReactNode } from "react";
import {
  PageEmptyState,
  PageHeader,
  pageInput,
  type PageIcon,
} from "@/components/workspace/page-layout";
import { WorkflowError } from "@/components/workspace/workflow";

export function HrSection({
  // eyebrow,
  description,
  toolbar,
  error,
  loading,
  loadingLabel = "Loading…",
  empty,
  children,
}: {
  // eyebrow: string;

  description?: string;

  toolbar?: ReactNode;
  error?: unknown;
  loading?: boolean;
  loadingLabel?: string;

  empty?: { icon: PageIcon; title: string; description?: string; action?: ReactNode } | null;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        actions={
          <>
            {description && (
              <p className="w-full pb-1 text-sm text-muted-foreground">{description}</p>
            )}
            {toolbar}
          </>
        }
      />
      <WorkflowError error={error} />
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {loadingLabel}
        </p>
      ) : empty ? (
        <PageEmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      ) : (
        children
      )}
    </>
  );
}

export function HrFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={label}
      className={`${pageInput} !w-auto`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}