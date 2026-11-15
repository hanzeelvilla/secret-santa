"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Botón de envío que se deshabilita mientras el formulario está en curso. */
export function SubmitButton({
  children,
  pendingText = "Un momento…",
  className = "btn btn-primary",
  confirmMessage,
  spinner = false,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  /** Si se indica, pide confirmación antes de enviar. */
  confirmMessage?: string;
  /** Muestra un spinner junto al texto mientras se envía. */
  spinner?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending && spinner && <Spinner />}
      {pending ? pendingText : children}
    </button>
  );
}
