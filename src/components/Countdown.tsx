"use client";

import { useEffect, useState } from "react";

const DAY = 86_400_000;

/**
 * Cuenta regresiva al día del intercambio (medianoche local) o, si hay hora
 * ("HH:mm"), a esa hora local.
 */
export function Countdown({ date, time }: { date: string; time?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  if (now === null) {
    return <div className="h-[74px]" aria-hidden="true" />;
  }

  const [y, m, d] = date.split("-").map(Number);
  const [hour, minute] = time ? time.split(":").map(Number) : [0, 0];
  const target = new Date(y, m - 1, d, hour, minute).getTime();
  const diff = target - now;

  if (diff <= -DAY) {
    return (
      <p className="font-display text-2xl font-bold text-pine">
        El intercambio ya pasó. ¡Ojalá te haya encantado tu regalo! 🎁
      </p>
    );
  }
  if (diff <= 0) {
    return (
      <p className="font-display text-3xl font-bold text-berry">
        ¡Hoy es el intercambio! 🎉
      </p>
    );
  }

  const parts = [
    { label: "días", value: Math.floor(diff / DAY) },
    { label: "horas", value: Math.floor((diff % DAY) / 3_600_000) },
    { label: "min", value: Math.floor((diff % 3_600_000) / 60_000) },
    { label: "seg", value: Math.floor((diff % 60_000) / 1000) },
  ];

  return (
    <div className="flex gap-2" role="timer" aria-label="Tiempo para el intercambio">
      {parts.map((part) => (
        <div
          key={part.label}
          className="min-w-[62px] rounded-xl bg-pine px-2 py-2 text-center text-cream"
        >
          <div className="font-display text-3xl leading-none font-bold tabular-nums">
            {String(part.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[11px] font-bold tracking-wide text-gold uppercase">
            {part.label}
          </div>
        </div>
      ))}
    </div>
  );
}
