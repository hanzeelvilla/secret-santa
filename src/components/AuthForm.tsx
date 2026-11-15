"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/actions/auth";
import { SubmitButton } from "./buttons";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const isRegister = mode === "register";
  const [state, action] = useActionState(
    isRegister ? register : login,
    undefined,
  );
  const errors = state?.fieldErrors;
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {isRegister && (
        <div>
          <label htmlFor="name" className="label">
            Tu nombre
          </label>
          <input
            id="name"
            name="name"
            className="input"
            placeholder="Como te conocen tus amigos"
            autoComplete="name"
            required
            maxLength={60}
          />
          {errors?.name && <p className="field-error">{errors.name[0]}</p>}
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />
        {errors?.email && <p className="field-error">{errors.email[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder={isRegister ? "Mínimo 8 caracteres" : "Tu contraseña"}
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 8 : undefined}
        />
        {errors?.password && (
          <p className="field-error">{errors.password[0]}</p>
        )}
      </div>

      {state?.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton className="btn btn-primary w-full">
        {isRegister ? "Crear mi cuenta" : "Entrar"}
      </SubmitButton>

      <p className="text-center text-sm text-ink/70">
        {isRegister ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <Link
          href={`${isRegister ? "/login" : "/register"}${nextQuery}`}
          className="font-bold text-berry underline underline-offset-2"
        >
          {isRegister ? "Inicia sesión" : "Regístrate"}
        </Link>
      </p>
    </form>
  );
}
