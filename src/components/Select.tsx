"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Selector temático (mismo estilo que `DatePicker` y `TimePicker`): el botón
 * se ve como un `input select` y la lista de opciones es una tarjeta propia en
 * vez de la lista nativa del navegador.
 */
export function Select({
  value,
  onChange,
  options,
  id,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  id?: string;
  /** Nombre accesible de la lista (la etiqueta visible va fuera, con `htmlFor={id}`). */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(next: string) {
    onChange(next);
    close(true);
  }

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Al abrir, el foco va a la opción elegida.
  useEffect(() => {
    if (!open) return;
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>("[data-value]");
    const target =
      Array.from(items ?? []).find((item) => item.dataset.value === value) ??
      items?.[0];
    target?.focus();
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function moveFocus(event: React.KeyboardEvent) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("[data-value]") ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : Math.min(
              Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0),
              items.length - 1,
            );
    items[next]?.focus();
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="input flex cursor-pointer items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          // Con flecha abajo/arriba se abre, como un select nativo.
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          className={`size-4 shrink-0 text-pine transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label={label}
          onKeyDown={moveFocus}
          className="absolute left-0 z-30 mt-2 max-h-64 w-full min-w-44 overflow-y-auto rounded-2xl border-2 border-pine/15 bg-white p-1.5 text-ink shadow-xl shadow-black/25"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-value={option.value}
                onClick={() => pick(option.value)}
                className={[
                  "block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-gold",
                  isSelected
                    ? "bg-berry text-white shadow-md shadow-berry-dark/40"
                    : "hover:bg-pine/10",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
