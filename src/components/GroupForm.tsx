"use client";

import { useTransition } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroup } from "@/actions/groups";
import { CURRENCIES, groupSchema } from "@/lib/validation";
import { Spinner } from "./buttons";
import { DatePicker } from "./DatePicker";

type GroupValues = {
  name: string;
  description: string;
  budget: string;
  currency: string;
  exchangeDate: string;
};

export function GroupForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<GroupValues>({
    resolver: zodResolver(groupSchema) as unknown as Resolver<GroupValues>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      budget: "",
      currency: "MXN",
      exchangeDate: "",
    },
  });

  const onValid = (values: GroupValues) => {
    clearErrors("root");
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.set(key, value);
      }

      // Si todo sale bien, la acción redirige y esta línea no devuelve nada.
      const result = await createGroup(undefined, formData);
      if (!result) return;

      for (const [name, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        if (messages?.[0]) {
          setError(name as keyof GroupValues, { message: messages[0] });
        }
      }
      if (result.error) setError("root", { message: result.error });
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className="label">
          Nombre del grupo
        </label>
        <input
          id="name"
          className="input"
          placeholder="Familia Villa, Oficina, Los de la prepa…"
          maxLength={60}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="field-error">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Descripción <span className="font-normal text-ink/50">(opcional)</span>
        </label>
        <textarea
          id="description"
          className="input"
          rows={3}
          maxLength={300}
          placeholder="Dónde será, reglas, ideas…"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
          {...register("description")}
        />
        {errors.description && (
          <p id="description-error" className="field-error">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budget" className="label">
            Presupuesto sugerido{" "}
            <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="budget"
              type="number"
              inputMode="numeric"
              className="input"
              placeholder="500"
              aria-invalid={!!errors.budget}
              aria-describedby={errors.budget ? "budget-error" : undefined}
              {...register("budget")}
            />
            <select
              aria-label="Moneda"
              className="input select w-28 shrink-0"
              {...register("currency")}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </div>
          {errors.budget && (
            <p id="budget-error" className="field-error">
              {errors.budget.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="exchangeDate" className="label">
            Fecha del intercambio{" "}
            <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <Controller
            control={control}
            name="exchangeDate"
            render={({ field }) => (
              <DatePicker
                id="exchangeDate"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.exchangeDate}
                describedBy={errors.exchangeDate ? "exchangeDate-error" : undefined}
              />
            )}
          />
          {errors.exchangeDate && (
            <p id="exchangeDate-error" className="field-error">
              {errors.exchangeDate.message}
            </p>
          )}
        </div>
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
        {isPending ? "Creando grupo…" : "Crear grupo 🎄"}
      </button>
    </form>
  );
}
