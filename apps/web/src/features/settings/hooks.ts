import { useEffect, useRef, useState, type FormEvent } from "react";
import { settingsApi, type Organization } from "@/lib/api";

export type OrganizationForm = { name: string; logo: string };

export function useOrganizationSettings(
  organization: Organization | null,
  selectOrganization: (organization: Organization) => void,
) {
  const [form, setForm] = useState<OrganizationForm>({ name: "", logo: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedOrganizationId = useRef<string | null>(organization?.id ?? null);

  useEffect(() => {
    selectedOrganizationId.current = organization?.id ?? null;
    setError(null);
    setForm(
      organization
        ? { name: organization.name, logo: organization.logo ?? "" }
        : { name: "", logo: "" },
    );
  }, [organization?.id]);

  async function saveOrganization(event: FormEvent) {
    event.preventDefault();
    if (!organization || !form.name.trim()) return;
    const organizationId = organization.id;
    await runAction(
      () =>
        settingsApi.updateOrganization(organizationId, {
          name: form.name.trim(),
          logo: form.logo.trim(),
        }),
      (updated) => {
        if (selectedOrganizationId.current === organizationId) selectOrganization(updated);
      },
      "Unable to update organization",
      setSaving,
      setError,
    );
  }

  return {
    form,
    saving,
    error,
    setForm,
    saveOrganization,
  };
}

async function runAction<T>(
  action: () => Promise<T>,
  onSuccess: (value: T) => void | Promise<void>,
  fallback: string,
  setBusy: (busy: boolean) => void,
  setError: (error: string | null) => void,
) {
  setBusy(true);
  setError(null);
  try {
    await onSuccess(await action());
  } catch (err) {
    setError(getErrorMessage(err, fallback));
  } finally {
    setBusy(false);
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
