"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/format";

const STEP = 15;
/** Hora que se muestra al abrir cuando aún no hay ninguna elegida. */
const DEFAULT_TIME = "18:00";

const pad = (n: number) => String(n).padStart(2, "0");

/** "00:00", "00:15", … "23:45" */
const SLOTS = Array.from({ length: (24 * 60) / STEP }, (_, i) => {
  const minutes = i * STEP;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
});

/** Lista de horas; si el valor actual no cae en la rejilla, se incluye. */
function optionsFor(value: string): string[] {
  if (!value || SLOTS.includes(value)) return SLOTS;
  return [...SLOTS, value].sort();
}

/** Selector de hora: lista con scroll (valor "HH:mm" en 24 h, o ""). */
export function TimePicker({
  value,
  onChange,
  onBlur,
  id,
  invalid,
  describedBy,
  disabled,
  placeholder = "Elige una hora",
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [openState, setOpen] = useState(false);
  // Si se bloquea mientras está abierto (p. ej. se quitó la fecha), se cierra.
  const open = openState && !disabled;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function close(returnFocus: boolean) {
    setOpen(false);
    onBlur?.();
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(time: string) {
    onChange(time);
    close(true);
  }

  // Cerrar al hacer clic fuera del selector.
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onBlur]);

  // Al abrir, centrar la hora elegida (o las 6:00 p. m.) y darle el foco.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const target = list?.querySelector<HTMLButtonElement>(
      `[data-time="${value || DEFAULT_TIME}"]`,
    );
    if (!list || !target) return;
    list.scrollTop =
      target.offsetTop - list.clientHeight / 2 + target.clientHeight / 2;
    target.focus({ preventScroll: true });
    // Solo al abrir: elegir una hora cierra la lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("[data-time]") ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = items[index + (event.key === "ArrowDown" ? 1 : -1)];
    next?.focus();
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
        disabled={disabled}
        className="input flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        data-invalid={invalid || undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        <span className={value ? "" : "text-ink/35"}>
          {value ? formatTime(value) : disabled ? "Elige primero la fecha" : placeholder}
        </span>
        <svg
          className="size-5 shrink-0 text-pine/70"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-full min-w-44 overflow-hidden rounded-2xl border-2 border-pine/15 bg-white text-ink shadow-xl shadow-black/25">
          <div
            ref={listRef}
            role="listbox"
            aria-label="Elegir hora"
            onKeyDown={onListKeyDown}
            className="relative max-h-60 overflow-y-auto p-1.5"
          >
            {optionsFor(value).map((time) => {
              const selected = time === value;
              return (
                <button
                  key={time}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-time={time}
                  tabIndex={selected || (!value && time === DEFAULT_TIME) ? 0 : -1}
                  onClick={() => pick(time)}
                  className={[
                    "block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-gold",
                    selected
                      ? "bg-berry text-white shadow-md shadow-berry-dark/40"
                      : "hover:bg-pine/10",
                  ].join(" ")}
                >
                  {formatTime(time)}
                </button>
              );
            })}
          </div>

          {value && (
            <div className="border-t border-pine/10 p-1.5">
              <button
                type="button"
                onClick={() => pick("")}
                className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-bold text-berry hover:bg-berry/10"
              >
                Quitar hora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
