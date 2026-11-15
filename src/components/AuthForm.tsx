"use client";

import Link from "next/link";
import { useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, register } from "@/actions/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { Spinner } from "./buttons";
import { PasswordInput } from "./PasswordInput";

type AuthValues = { name: string; email: string; password: string };

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const isRegister = mode === "register";
  const [isPending, startTransition] = useTransition();
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
        <PasswordInput
          id="password"
          placeholder={isRegister ? "Mínimo 8 caracteres" : "Tu contraseña"}
          autoComplete={isRegister ? "new-password" : "current-password"}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...field("password")}
        />
        {errors.password && (
          <p id="password-error" className="field-error">
            {errors.password.message}
          </p>
        )}
        {!isRegister && (
          <p className="mt-2 text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-bold text-berry underline underline-offset-2"
            >
              ¿Olvidaste tu contraseña?
            </Link>
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
