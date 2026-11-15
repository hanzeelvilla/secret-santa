"use client";

import { type ComponentProps, useState } from "react";

/** Ojo abierto (contraseña oculta) u ojo tachado (contraseña visible). */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

/**
 * Campo de contraseña con el ojito para mostrarla u ocultarla. Acepta las
 * mismas props que un `<input>` (incluido lo que devuelve `register` de
 * react-hook-form).
 */
export function PasswordInput({
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`input pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-pine/60 hover:text-pine focus-visible:outline-2 focus-visible:outline-gold"
      >
        <EyeIcon off={show} />
      </button>
    </div>
  );
}
