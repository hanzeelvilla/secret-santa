"use client";

import { useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/actions/auth";
import { changePasswordSchema } from "@/lib/validation";
import { Spinner } from "./buttons";
import { PasswordInput } from "./PasswordInput";

type Values = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMPTY: Values = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(
      changePasswordSchema,
    ) as unknown as Resolver<Values>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: EMPTY,
  });

  const onValid = (values: Values) => {
    setSuccess(undefined);
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.set(key, value);
      }

      const result = await changePassword(formData);
      for (const [name, messages] of Object.entries(result?.fieldErrors ?? {})) {
        if (messages?.[0]) setError(name as keyof Values, { message: messages[0] });
      }
      if (result?.error) setError("root", { message: result.error });
      if (result?.success) {
        reset(EMPTY);
        setSuccess(result.success);
      }
    });
  };

  const clearSuccess = { onChange: () => setSuccess(undefined) };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="label">
          Contraseña actual
        </label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          placeholder="Tu contraseña actual"
          aria-invalid={!!errors.currentPassword}
          aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
          {...register("currentPassword", clearSuccess)}
        />
        {errors.currentPassword && (
          <p id="currentPassword-error" className="field-error">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="label">
          Contraseña nueva
        </label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={!!errors.newPassword}
          aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
          {...register("newPassword", clearSuccess)}
        />
        {errors.newPassword && (
          <p id="newPassword-error" className="field-error">
            {errors.newPassword.message}
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
          {...register("confirmPassword", clearSuccess)}
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
        {isPending ? "Guardando…" : "Cambiar contraseña"}
      </button>

      {success && (
        <p className="text-center text-sm font-semibold text-pine" role="status">
          {success}
        </p>
      )}
    </form>
  );
}
