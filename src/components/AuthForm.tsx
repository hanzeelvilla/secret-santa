"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register } from "@/actions/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { Spinner } from "./buttons";

type AuthValues = { name: string; email: string; password: string };

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

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const isRegister = mode === "register";
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register: field,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(
      isRegister ? registerSchema : loginSchema,
    ) as unknown as Resolver<AuthValues>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", password: "" },
  });
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  const onValid = (values: AuthValues) => {
    clearErrors("root");
    startTransition(async () => {
      const formData = new FormData();
      if (isRegister) formData.set("name", values.name);
      formData.set("email", values.email);
      formData.set("password", values.password);
      if (next) formData.set("next", next);

      // Si todo sale bien, la acción redirige y esta línea no devuelve nada.
      const result = await (isRegister ? register : login)(undefined, formData);
      if (!result) return;

      for (const [name, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        if (messages?.[0]) {
          setError(name as keyof AuthValues, { message: messages[0] });
        }
      }
      if (result.error) setError("root", { message: result.error });
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      noValidate
      className="space-y-4"
    >
      {isRegister && (
        <div>
          <label htmlFor="name" className="label">
            Tu nombre
          </label>
          <input
            id="name"
            className="input"
            placeholder="Como te conocen tus amigos"
            autoComplete="name"
            required
            maxLength={60}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...field("name")}
          />
          {errors.name && (
            <p id="name-error" className="field-error">
              {errors.name.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">
          Correo
        </label>
        <input
          id="email"
          type="email"
          className="input"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...field("email")}
        />
        {errors.email && (
          <p id="email-error" className="field-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="input pr-11"
            placeholder={isRegister ? "Mínimo 8 caracteres" : "Tu contraseña"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...field("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-pine/60 hover:text-pine focus-visible:outline-2 focus-visible:outline-gold"
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="field-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p className="field-error" role="alert">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending && <Spinner />}
        {isPending
          ? isRegister
            ? "Creando cuenta…"
            : "Entrando…"
          : isRegister
            ? "Crear mi cuenta"
            : "Entrar"}
      </button>

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
