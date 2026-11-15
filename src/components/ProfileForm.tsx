"use client";

import { useEffect, useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile } from "@/actions/auth";
import { profileSchema } from "@/lib/validation";
import { Spinner } from "./buttons";

type ProfileValues = { name: string };

export function ProfileForm({ name }: { name: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileValues>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name },
  });

  // Si el nombre guardado cambia (p. ej. tras revalidar), el formulario lo
  // adopta como valor inicial sin montarse de nuevo, para no perder el aviso.
  useEffect(() => {
    reset({ name });
  }, [name, reset]);

  const onValid = (values: ProfileValues) => {
    setSuccess(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", values.name);

      const result = await updateProfile(undefined, formData);
      if (result?.fieldErrors?.name?.[0]) {
        setError("name", { message: result.fieldErrors.name[0] });
      } else if (result?.error) {
        setError("root", { message: result.error });
      } else if (result?.success) {
        // `values` ya viene recortado por zod: queda como "sin cambios".
        reset({ name: values.name });
        setSuccess(result.success);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className="label">
          Tu nombre
        </label>
        <input
          id="name"
          className="input"
          placeholder="Como te conocen tus amigos"
          autoComplete="name"
          maxLength={60}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name", { onChange: () => setSuccess(undefined) })}
        />
        {errors.name && (
          <p id="name-error" className="field-error">
            {errors.name.message}
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
        disabled={isPending || !isDirty}
        aria-busy={isPending}
      >
        {isPending && <Spinner />}
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>

      {success && (
        <p className="text-center text-sm font-semibold text-pine" role="status">
          {success}
        </p>
      )}
    </form>
  );
}
