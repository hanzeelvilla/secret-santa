"use client";

import Link from "next/link";
import { useState } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/**
 * Pantalla de "olvidé mi contraseña": primero la tarjeta con el formulario y,
 * al enviar, otra tarjeta con la confirmación (el mensaje es el mismo exista o
 * no la cuenta).
 */
export function ForgotPasswordCard() {
  const [sent, setSent] = useState<{ message: string; email: string }>();

  if (sent) {
    return (
      <div className="card mx-auto mt-6 max-w-md text-center">
        <p className="text-5xl" aria-hidden="true">
          📬
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-berry">
          Revisa tu correo
        </h1>
        <p className="mt-1 text-sm text-ink/70" role="status">
          {sent.message}
        </p>
        <p className="mt-3 text-sm text-ink/70">
          Lo enviamos a{" "}
          <strong className="break-all text-ink">{sent.email}</strong>. El enlace
          vale por 1 hora.
        </p>
        <Link href="/login" className="btn btn-primary mt-5 w-full">
          Volver a iniciar sesión
        </Link>
        <p className="mt-4 text-sm text-ink/70">
          ¿No llegó?{" "}
          <button
            type="button"
            onClick={() => setSent(undefined)}
            className="cursor-pointer font-bold text-berry underline underline-offset-2"
          >
            Intentar con otro correo
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="card mx-auto mt-6 max-w-md">
      <h1 className="font-display text-4xl font-bold text-berry">
        ¿Olvidaste tu contraseña? 🔑
      </h1>
      <p className="mt-1 mb-5 text-sm text-ink/70">
        Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una
        nueva. El enlace vale por 1 hora.
      </p>
      <ForgotPasswordForm
        onSent={(message, email) => setSent({ message, email })}
      />
      <p className="mt-4 text-center text-sm text-ink/70">
        <Link
          href="/login"
          className="font-bold text-berry underline underline-offset-2"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
