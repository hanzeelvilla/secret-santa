"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botón de envío que se deshabilita mientras el formulario está en curso. */
export function SubmitButton({
  children,
  pendingText = "Un momento…",
  className = "btn btn-primary",
  confirmMessage,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  /** Si se indica, pide confirmación antes de enviar. */
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
