"use client";

import { useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/actions/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { Spinner } from "./buttons";

type Values = { email: string };

export function ForgotPasswordForm({
  onSent,
}: {
  /** Se llama con el mensaje del servidor y el correo escrito al enviar. */
  onSent: (message: string, email: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(
      forgotPasswordSchema,
    ) as unknown as Resolver<Values>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });

  const onValid = (values: Values) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", values.email);

      const result = await requestPasswordReset(formData);
      if (result?.fieldErrors?.email?.[0]) {
        setError("email", { message: result.fieldErrors.email[0] });
      } else if (result?.error) {
        setError("root", { message: result.error });
      } else if (result?.success) {
        onSent(result.success, values.email);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
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
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="field-error">
            {errors.email.message}
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
        {isPending ? "Enviando…" : "Enviarme el enlace"}
      </button>
    </form>
  );
}
