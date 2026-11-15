"use client";

import { useActionState } from "react";
import { confirmEmail } from "@/actions/auth";
import { SubmitButton } from "./buttons";

/**
 * Botón para confirmar el correo con el token del enlace. Se pide un clic en
 * lugar de confirmar al abrir la página, porque los escáneres de correo abren
 * los enlaces por su cuenta y gastarían el token.
 */
export function ConfirmEmailForm({
  token,
  next,
}: {
  token: string;
  next: string;
}) {
  const [state, action] = useActionState(
    confirmEmail.bind(null, token, next),
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      {state?.error && (
        <p className="field-error text-center" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton
        className="btn btn-primary w-full py-3 text-base"
        pendingText="Confirmando…"
        spinner
      >
        Confirmar mi correo
      </SubmitButton>
    </form>
  );
}
