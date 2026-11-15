"use client";

import { useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/actions/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { Spinner } from "./buttons";
import { PasswordInput } from "./PasswordInput";

type Values = { password: string; confirmPassword: string };

export function ResetPasswordForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(
      resetPasswordSchema,
    ) as unknown as Resolver<Values>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onValid = (values: Values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("password", values.password);
      formData.set("confirmPassword", values.confirmPassword);

      // Si todo sale bien, la acción redirige a /login y no devuelve nada.
      const result = await resetPassword(token, formData);
      if (!result) return;
      for (const [name, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(name as keyof Values, { message: messages[0] });
      }
      if (result.error) setError("root", { message: result.error });
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
      <div>
        <label htmlFor="password" className="label">
          Contraseña nueva
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="field-error">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirma la contraseña nueva
        </label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Repite la contraseña nueva"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="field-error">
            {errors.confirmPassword.message}
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
        {isPending ? "Guardando…" : "Guardar contraseña nueva"}
      </button>
    </form>
  );
}
