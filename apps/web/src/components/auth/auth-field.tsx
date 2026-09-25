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

/** Label + pill input. The label wraps the field so the hit target includes the text. */
export function AuthField({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  minLength,
}: AuthFieldProps) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <Input
        className="mt-1.5"
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
