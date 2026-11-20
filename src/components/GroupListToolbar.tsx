"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import {
  type GroupListParams,
  groupListHref,
  hasActiveFilters,
  ROLE_LABELS,
  ROLES,
  SORT_LABELS,
  SORTS,
  STATUS_LABELS,
  STATUSES,
  WHEN_LABELS,
  WHENS,
} from "@/lib/group-list";
import { Select, type SelectOption } from "./Select";

/** Búsqueda, orden y filtros de "Mis grupos". El estado vive en la URL. */
export function GroupListToolbar({ params }: { params: GroupListParams }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  // Cualquier cambio de búsqueda o filtro vuelve a la primera página.
  function go(changes: Partial<GroupListParams>) {
    startTransition(() => {
      router.push(groupListHref({ ...params, page: 1, ...changes }), {
        scroll: false,
      });
    });
  }

  const selects: {
    id: string;
    label: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
  }[] = [
    {
      id: "sort",
      label: "Ordenar por",
      value: params.sort,
      options: SORTS.map((value) => ({ value, label: SORT_LABELS[value] })),
      onChange: (value: string) => go({ sort: value as GroupListParams["sort"] }),
    },
    {
      id: "role",
      label: "Rol",
      value: params.role,
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      onChange: (value: string) => go({ role: value as GroupListParams["role"] }),
    },
    {
      id: "status",
      label: "Sorteo",
      value: params.status,
      options: STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
      onChange: (value: string) => go({ status: value as GroupListParams["status"] }),
    },
    {
      id: "when",
      label: "Fecha",
      value: params.when,
      options: WHENS.map((value) => ({ value, label: WHEN_LABELS[value] })),
      onChange: (value: string) => go({ when: value as GroupListParams["when"] }),
    },
  ];

  return (
    <div className="card mt-6 space-y-3" aria-busy={isPending}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go({ q: (searchRef.current?.value ?? "").trim() });
        }}
        className="flex gap-2"
      >
        {/* `key`: si la búsqueda cambia desde fuera (Limpiar, botón Atrás),
            el campo se vuelve a montar con el valor de la URL. */}
        <input
          key={params.q}
          ref={searchRef}
          type="search"
          className="input"
          placeholder="Buscar por nombre del grupo…"
          aria-label="Buscar grupos por nombre"
          maxLength={60}
          autoComplete="off"
          defaultValue={params.q}
          onChange={(event) => {
            // Al vaciar el campo (p. ej. con la ✕) se quita la búsqueda sola.
            if (event.target.value === "" && params.q !== "") go({ q: "" });
          }}
        />
        <button type="submit" className="btn btn-primary shrink-0">
          Buscar
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {selects.map(({ id, label, value, options, onChange }) => (
          <div key={id}>
            <label htmlFor={`list-${id}`} className="label">
              {label}
            </label>
            <Select
              id={`list-${id}`}
              label={label}
              value={value}
              onChange={onChange}
              options={options}
            />
          </div>
        ))}
      </div>

      {hasActiveFilters(params) && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={() =>
            go({ q: "", role: "todos", status: "todos", when: "todas" })
          }
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
