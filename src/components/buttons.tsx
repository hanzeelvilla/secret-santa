"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
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

/** "¿Salir del grupo? Se borrará tu lista." → título y detalle del modal. */
function splitConfirm(message: string): { title: string; body: string } {
  const match = message.match(/^(¿[^?]*\?)\s*([\s\S]*)$/);
  return match
    ? { title: match[1], body: match[2] }
    : { title: "¿Estás seguro?", body: message };
}

/**
 * Botón de envío que se deshabilita mientras el formulario está en curso.
 * Con `confirmMessage` abre un modal temático de confirmación antes de enviar.
 */
export function SubmitButton({
  children,
  pendingText = "Un momento…",
  className = "btn btn-primary",
  confirmMessage,
  confirmLabel = "Confirmar",
  confirmIcon = "🎄",
  spinner = false,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  /** Si se indica, pide confirmación (en un modal) antes de enviar. */
  confirmMessage?: string;
  /** Texto del botón que confirma en el modal. */
  confirmLabel?: string;
  /** Emoji que decora el modal. */
  confirmIcon?: string;
  /** Muestra un spinner junto al texto mientras se envía. */
  spinner?: boolean;
}) {
  const { pending } = useFormStatus();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Lo seguro primero: el foco empieza en "Cancelar".
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // El modal se queda abierto mientras se envía (con el spinner dentro) y se
  // cierra solo si la acción termina sin redirigir a otra página.
  const wasPending = useRef(false);
  useEffect(() => {
    if (pending) {
      wasPending.current = true;
    } else if (wasPending.current) {
      wasPending.current = false;
      setOpen(false);
    }
  }, [pending]);

  function confirm() {
    // requestSubmit no vuelve a disparar el clic del botón, así que no
    // se abre el modal otra vez.
    const button = buttonRef.current;
    button?.form?.requestSubmit(button);
  }

  const { title, body } = confirmMessage
    ? splitConfirm(confirmMessage)
    : { title: "", body: "" };

  return (
    <>
      <button
        ref={buttonRef}
        type="submit"
        className={className}
        disabled={pending}
        aria-busy={pending}
        onClick={(event) => {
          if (confirmMessage) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {pending && spinner && <Spinner />}
        {pending ? pendingText : children}
      </button>

      {confirmMessage && (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          onClose={() => setOpen(false)}
          // Con el envío en curso no se puede cerrar (Esc o clic en el fondo).
          onCancel={(event) => {
            if (pending) event.preventDefault();
          }}
          onClick={(event) => {
            // Un clic en el fondo oscuro cierra el modal.
            if (!pending && event.target === event.currentTarget) setOpen(false);
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-sm overflow-visible bg-transparent p-0 backdrop:bg-night/70 backdrop:backdrop-blur-sm"
        >
          <div className="reveal rounded-2xl bg-cream p-6 text-center text-ink shadow-2xl shadow-black/40">
            <p className="text-5xl" aria-hidden="true">
              {confirmIcon}
            </p>
            <h2
              id={titleId}
              className="mt-2 font-display text-3xl leading-tight font-bold text-berry"
            >
              {title}
            </h2>
            {body && <p className="mt-2 text-sm text-ink/70">{body}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                ref={cancelRef}
                type="button"
                className="btn btn-outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending}
                aria-busy={pending}
                onClick={confirm}
              >
                {pending ? (
                  <>
                    <Spinner />
                    {pendingText}
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
