import type { ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

export function AppDialog({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
    <section className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between gap-5"><div><h2 className="text-xl font-semibold">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}</div><button aria-label="Close dialog" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><IconX className="size-4" /></button></div><div className="mt-6">{children}</div></section>
  </div>;
}

export function Field({ label, placeholder, type = "text", required = false }: { label: string; placeholder: string; type?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold">{label}<input required={required} type={type} placeholder={placeholder} className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition placeholder:font-normal placeholder:text-muted-foreground focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>;
}
