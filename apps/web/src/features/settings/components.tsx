import { ImageUpload } from "@/components/workspace/image-upload";
import type { FormEventHandler } from "react";
import type { OrganizationForm } from "./hooks";

type OrganizationSettingsState = ReturnType<typeof import("./hooks").useOrganizationSettings>;

export function OrganizationSettingsPage({ state }: { state: OrganizationSettingsState }) {
  return (
    <div className="space-y-6">
      <OrganizationProfile
        form={state.form}
        saving={state.saving}
        onChange={state.setForm}
        onSubmit={state.saveOrganization}
      />
      {state.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}

function OrganizationProfile({
  form,
  saving,
  onChange,
  onSubmit,
}: {
  form: OrganizationForm;
  saving: boolean;
  onChange: (form: OrganizationForm) => void;
  onSubmit: FormEventHandler;
}) {
  return (
    <section className="rounded-[16px] border border-border/70 bg-card p-5 sm:p-6">
      <h2 className="text-sm font-semibold">Organization</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Update the organization profile used across Teamlyf.
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field
          label="Name"
          value={form.name}
          onChange={(value) => onChange({ ...form, name: value })}
        />
        <ImageUpload
          label="Workspace logo"
          value={form.logo}
          onChange={(value) => onChange({ ...form, logo: value })}
        />
        <button
          disabled={saving}
          className="h-control rounded-[12px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block h-control w-full rounded-[12px] border border-border/80 bg-muted/30 px-4 text-sm font-normal outline-none transition-colors focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10"
      />
    </label>
  );
}
