"use client";

/**
 * Casilla "Avisar por correo", siempre marcada por defecto (no recuerda la
 * última elección). Puede usarse sin estado (dentro de un `<form>` normal, se
 * envía como `notify=on`) o controlada.
 */
export function NotifyCheckbox({
  label,
  name = "notify",
  checked,
  onChange,
  disabled,
  className = "",
}: {
  label: string;
  name?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const controlled = checked !== undefined;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-sm text-ink/80 ${className}`}
    >
      <input
        type="checkbox"
        name={name}
        className="size-4 accent-pine"
        disabled={disabled}
        {...(controlled
          ? { checked, onChange: (e) => onChange?.(e.target.checked) }
          : { defaultChecked: true })}
      />
      {label}
    </label>
  );
}
