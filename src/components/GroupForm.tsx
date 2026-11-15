"use client";

import { useActionState } from "react";
import { createGroup } from "@/actions/groups";
import { CURRENCIES } from "@/lib/validation";
import { SubmitButton } from "./buttons";

export function GroupForm() {
  const [state, action] = useActionState(createGroup, undefined);
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">
          Nombre del grupo
        </label>
        <input
          id="name"
          name="name"
          className="input"
          placeholder="Familia Villa, Oficina, Los de la prepa…"
          required
          maxLength={60}
        />
        {errors?.name && <p className="field-error">{errors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Descripción <span className="font-normal text-ink/50">(opcional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          className="input"
          rows={3}
          maxLength={300}
          placeholder="Dónde será, reglas, ideas…"
        />
        {errors?.description && (
          <p className="field-error">{errors.description[0]}</p>
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
              name="budget"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="input"
              placeholder="500"
            />
            <select
              name="currency"
              aria-label="Moneda"
              className="input w-24 shrink-0"
              defaultValue="MXN"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </div>
          {errors?.budget && <p className="field-error">{errors.budget[0]}</p>}
        </div>

        <div>
          <label htmlFor="exchangeDate" className="label">
            Fecha del intercambio{" "}
            <span className="font-normal text-ink/50">(opcional)</span>
          </label>
          <input
            id="exchangeDate"
            name="exchangeDate"
            type="date"
            className="input"
          />
          {errors?.exchangeDate && (
            <p className="field-error">{errors.exchangeDate[0]}</p>
          )}
        </div>
      </div>

      {state?.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton className="btn btn-primary w-full">
        Crear grupo 🎄
      </SubmitButton>
    </form>
  );
}
