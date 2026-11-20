"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroup, updateGroup } from "@/actions/groups";
import { CURRENCIES, groupSchema } from "@/lib/validation";
import { Spinner } from "./buttons";
import { DatePicker } from "./DatePicker";
import { NotifyCheckbox } from "./NotifyCheckbox";

type GroupValues = {
  name: string;
  description: string;
  budget: string;
  currency: string;
  exchangeDate: string;
};

/** Datos de un grupo existente; si se pasan, el formulario edita en vez de crear. */
export type EditableGroup = {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  currency: string;
  exchangeDate: string | null;
};

export function GroupForm({ group }: { group?: EditableGroup }) {
  const isEdit = !!group;
  // Valores iniciales: se pasan a react-hook-form y también a los inputs, para
  // que el HTML del servidor ya venga con la info llenada (sin esperar a hidratar).
  const initial: GroupValues = {
    name: group?.name ?? "",
    description: group?.description ?? "",
    budget: group?.budget != null ? String(group.budget) : "",
    currency: group?.currency ?? "MXN",
    exchangeDate: group?.exchangeDate ?? "",
  };
  const [isPending, startTransition] = useTransition();
  // Siempre empieza marcada; solo aplica al editar.
  const [notify, setNotify] = useState(true);
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
    defaultValues: initial,
  });

  const onValid = (values: GroupValues) => {
    clearErrors("root");
    startTransition(async () => {
      const formData = new FormData();
      // `values` es la salida de zod: los opcionales vacíos llegan como
      // `undefined`, y `FormData.set` los convertiría en el texto "undefined".
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== null) {
          formData.set(key, String(value));
        }
      }

      // Si todo sale bien, la acción redirige y esta línea no devuelve nada.
      if (notify) formData.set("notify", "on");

      const result = group
        ? await updateGroup(group.id, undefined, formData)
        : await createGroup(undefined, formData);
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
    <form
      onSubmit={handleSubmit(onValid)}
      noValidate
      autoComplete="off"
      className="space-y-4"
    >
      <div>
        <label htmlFor="name" className="label">
          Nombre del grupo
        </label>
        <input
          id="name"
          className="input"
          placeholder="Familia Villa, Oficina, Los de la prepa…"
          maxLength={60}
          autoComplete="off"
          defaultValue={initial.name}
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
          autoComplete="off"
          defaultValue={initial.description}
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
              autoComplete="off"
              defaultValue={initial.budget}
              aria-invalid={!!errors.budget}
              aria-describedby={errors.budget ? "budget-error" : undefined}
              {...register("budget")}
            />
            <select
              aria-label="Moneda"
              className="input select w-28 shrink-0"
              autoComplete="off"
              defaultValue={initial.currency}
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

      {isEdit && (
        <NotifyCheckbox
          label="Avisar a los participantes por correo si hay cambios"
          checked={notify}
          onChange={setNotify}
          disabled={isPending}
        />
      )}

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
          ? isEdit
            ? "Guardando…"
            : "Creando grupo…"
          : isEdit
            ? "Guardar cambios"
            : "Crear grupo 🎄"}
      </button>

      {isEdit && (
        <Link
          href={`/groups/${group.id}`}
          className="btn btn-outline w-full"
        >
          Cancelar
        </Link>
      )}
    </form>
  );
}
