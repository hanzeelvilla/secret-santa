"use client";

import { useActionState } from "react";
import { runDraw } from "@/actions/groups";
import { SubmitButton } from "./buttons";

export function DrawButton({
  groupId,
  redo = false,
}: {
  groupId: string;
  redo?: boolean;
}) {
  const [state, action] = useActionState(
    runDraw.bind(null, groupId),
    undefined,
  );

  return (
    <form action={action}>
      {redo ? (
        <SubmitButton
          className="btn btn-danger"
          pendingText="Sorteando…"
          confirmMessage="¿Rehacer el sorteo? Todos recibirán una persona nueva y la asignación anterior se perderá."
        >
          Rehacer sorteo
        </SubmitButton>
      ) : (
        <SubmitButton
          className="btn btn-primary px-7 py-3 text-base"
          pendingText="Sorteando…"
          confirmMessage="¿Hacer el sorteo ahora? Después ya no podrá unirse nadie más."
        >
          🎲 Hacer el sorteo
        </SubmitButton>
      )}
      {state?.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
