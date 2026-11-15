"use client";

import { useActionState, useEffect, useState } from "react";
import { resendVerification } from "@/actions/auth";
import { RESEND_COOLDOWN_MS } from "@/lib/tokens";
import type { FormState } from "@/lib/validation";
import { Spinner } from "./buttons";

/** Reenvía el correo de confirmación; muestra la cuenta atrás de la espera. */
export function ResendButton({
  next,
  initialWait,
}: {
  next: string;
  initialWait: number;
}) {
  const [wait, setWait] = useState(initialWait);
  const [state, action, pending] = useActionState(
    async (): Promise<FormState> => {
      const result = await resendVerification(next);
      if (result?.success) setWait(RESEND_COOLDOWN_MS / 1000);
      return result;
    },
    undefined,
  );

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  return (
    <form action={action} className="space-y-3">
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={pending || wait > 0}
        aria-busy={pending}
      >
        {pending && <Spinner />}
        {pending
          ? "Enviando…"
          : wait > 0
            ? `Reenviar correo (${wait} s)`
            : "Reenviar correo"}
      </button>
      {state?.error && (
        <p className="field-error text-center" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-center text-sm font-semibold text-pine" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
