import type { ReactNode } from "react";
import {
  IconBriefcase,
  IconCalendar,
  IconChartBar,
  IconCheck,
  IconCreditCard,
  IconReceipt,
  IconRobot,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const palette = [
    "bg-[#14506D]",
    "bg-[#397A9D]",
    "bg-[#3B8F7A]",
    "bg-[#B87931]",
    "bg-[#A45A6A]",
  ];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <span
      aria-label={name}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-[0.625rem] font-semibold tracking-[0.02em] text-white",
        color,
        className,
      )}
    >
      {name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

export function StatusPill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "violet" | "green" | "amber" | "rose" | "sky";
}) {
  const tones = {
    slate: "bg-[#F0F3F8] text-[#5D687C]",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-[#EAF7F2] text-[#28755F]",
    amber: "bg-[#FFF5E7] text-[#9A641F]",
    rose: "bg-[#FDEEF0] text-[#A04457]",
    sky: "bg-[#EAF8FF] text-[#145E85]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-[0.625rem] font-semibold tracking-[0.01em]",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
  trend,
  children,
}: {
  label: string;
  value: string;
  trend?: string;
  children?: ReactNode;
}) {
  const MetricIcon =
    {
      Projects: IconBriefcase,
      Tasks: IconCheck,
      Completed: IconCheck,
      People: IconUsers,
      "Pending time away": IconCalendar,
      Active: IconUsers,
      Members: IconUsers,
      "Agent capacity": IconRobot,
      "Billing status": IconCreditCard,
      Invoices: IconReceipt,
    }[label] ?? IconChartBar;
  const iconTone = {
    Projects: "bg-violet-100 text-violet-700",
    Tasks: "bg-sky-100 text-sky-700",
    Completed: "bg-emerald-100 text-emerald-700",
    People: "bg-amber-100 text-amber-700",
    "Pending time away": "bg-rose-100 text-rose-700",
    Active: "bg-teal-100 text-teal-700",
    Members: "bg-indigo-100 text-indigo-700",
    "Agent capacity": "bg-fuchsia-100 text-fuchsia-700",
    "Billing status": "bg-cyan-100 text-cyan-700",
    Invoices: "bg-orange-100 text-orange-700",
  }[label] ?? "bg-slate-100 text-slate-700";

  return (
    <section className="surface flex min-h-[9.5rem] flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1 text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", iconTone)}>
          <MetricIcon className="size-[1.05rem]" />
        </span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-foreground">
          {value}
        </p>
        {trend && (
          <span className="rounded-full bg-[#EAF7F2] px-2 py-1 text-[0.625rem] font-semibold text-[#28755F]">
            {trend}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
