import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type AuthFieldProps = Readonly<{
  label: string;
  name: string;
  type: InputHTMLAttributes<HTMLInputElement>["type"];
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
}>;

/** Label + relaxed auth input. The label keeps its text and control one target. */
export function AuthField({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  minLength,
}: AuthFieldProps) {
  return (
    <label className="block text-sm font-semibold text-foreground">
      {label}
      <Input
        className="mt-2"
        decor="auth"
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
    </label>
  );
}
