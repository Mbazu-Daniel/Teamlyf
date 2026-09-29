import { useState, type InputHTMLAttributes } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block text-xs font-medium text-foreground">
      {label}
      <span className="relative mt-2 block">
        <Input
          decor={isPassword ? "auth-password" : "auth"}
          name={name}
          type={isPassword && passwordVisible ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        {isPassword && (
          <button
            type="button"
            className="auth-password-toggle"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
          </button>
        )}
      </span>
    </label>
  );
}
