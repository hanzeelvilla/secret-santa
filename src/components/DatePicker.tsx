"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/format";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Suma días a una fecha "AAAA-MM-DD" sin depender de la zona horaria. */
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

const monthLabel = (year: number, month: number) =>
  new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));

type View = { year: number; month: number };

/** Calendario temático para elegir una fecha (valor "AAAA-MM-DD" o ""). */
export function DatePicker({
  value,
  onChange,
  onBlur,
  id,
  invalid,
  describedBy,
  placeholder = "Elige una fecha",
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ year: 2000, month: 0 });
  const [focusIso, setFocusIso] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocusGrid = useRef(false);

  const today = open ? todayIso() : "";
  const [todayY, todayM] = today ? today.split("-").map(Number) : [0, 0];
  const isCurrentMonth = view.year === todayY && view.month === todayM - 1;

  function show() {
    const now = todayIso();
    const base = value && value >= now ? value : now;
    const [y, m] = base.split("-").map(Number);
    setView({ year: y, month: m - 1 });
    setFocusIso(base);
    shouldFocusGrid.current = true;
    setOpen(true);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    onBlur?.();
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(iso: string) {
    onChange(iso);
    close(true);
  }

  // Cerrar al hacer clic fuera del calendario.
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

  // Mover el foco al día activo cuando se abre o se navega con el teclado.
  useEffect(() => {
    if (!open || !shouldFocusGrid.current) return;
    shouldFocusGrid.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)
      ?.focus();
  }, [open, focusIso, view]);

  function shiftMonth(delta: number) {
    const date = new Date(Date.UTC(view.year, view.month + delta, 1));
    const next = { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    setView(next);
    const first = toIso(next.year, next.month, 1);
    setFocusIso(first < today ? today : first);
  }

  function moveFocus(days: number) {
    const now = todayIso();
    let next = addDays(focusIso, days);
    if (next < now) next = now;
    const [y, m] = next.split("-").map(Number);
    setFocusIso(next);
    setView({ year: y, month: m - 1 });
    shouldFocusGrid.current = true;
  }

  function onGridKeyDown(event: React.KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in moves) {
      event.preventDefault();
      moveFocus(moves[event.key]);
    }
  }

  // Cuadrícula de 6 semanas empezando en lunes.
  const firstWeekday =
    (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(Date.UTC(view.year, view.month, 1 - firstWeekday + i));
    return {
      iso: toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === view.month,
    };
  });

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
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        data-invalid={invalid || undefined}
        onClick={() => (open ? close(false) : show())}
      >
        <span className={value ? "" : "text-ink/35"}>
          {value ? formatDate(value) : placeholder}
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
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          className="absolute left-0 z-30 mt-2 w-[19rem] max-w-[calc(100vw-3rem)] rounded-2xl border-2 border-pine/15 bg-white p-3 text-ink shadow-xl shadow-black/25"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={isCurrentMonth}
              aria-label="Mes anterior"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-pine transition hover:bg-pine/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ‹
            </button>
            <p
              aria-live="polite"
              className="font-display text-xl font-bold text-berry capitalize"
            >
              {monthLabel(view.year, view.month)}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Mes siguiente"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-pine transition hover:bg-pine/10"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-bold text-pine/60">
            {WEEKDAYS.map((weekday, i) => (
              <span key={i} className="py-1" aria-hidden="true">
                {weekday}
              </span>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            className="grid grid-cols-7 gap-y-0.5"
            onKeyDown={onGridKeyDown}
          >
            {cells.map(({ iso, day, inMonth }) => {
              const disabled = iso < today;
              const selected = iso === value;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  data-iso={iso}
                  tabIndex={iso === focusIso ? 0 : -1}
                  aria-label={formatDate(iso)}
                  aria-pressed={selected}
                  aria-disabled={disabled}
                  onClick={() => !disabled && pick(iso)}
                  className={[
                    "mx-auto flex size-9 items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-gold",
                    disabled
                      ? "cursor-not-allowed text-ink/20"
                      : "cursor-pointer",
                    selected
                      ? "bg-berry text-white shadow-md shadow-berry-dark/40"
                      : !disabled && "hover:bg-pine/10",
                    !selected && !disabled && !inMonth && "text-ink/40",
                    isToday && !selected && "ring-2 ring-gold ring-inset",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-pine/10 pt-2 text-sm font-bold">
            <button
              type="button"
              onClick={() => pick(today)}
              className="cursor-pointer rounded-full px-3 py-1 text-pine hover:bg-pine/10"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => pick("")}
              disabled={!value}
              className="cursor-pointer rounded-full px-3 py-1 text-berry hover:bg-berry/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Quitar fecha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
