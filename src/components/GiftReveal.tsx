"use client";

import { useState } from "react";

export type RevealItem = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
};

export function GiftReveal({
  receiverName,
  items,
}: {
  receiverName: string;
  items: RevealItem[];
}) {
  const [stage, setStage] = useState<"closed" | "opening" | "open">("closed");

  function open() {
    if (stage !== "closed") return;
    setStage("opening");
    setTimeout(() => setStage("open"), 750);
  }

  if (stage !== "open") {
    return (
      <div className="py-4 text-center">
        <button
          type="button"
          className="gift"
          data-opening={stage === "opening"}
          onClick={open}
          aria-label="Abrir el regalo para descubrir a quién le regalas"
        >
          <span className="gift-lid" />
          <span className="gift-box" />
        </button>
        <p className="mt-5 font-display text-2xl font-bold text-pine">
          ¡Toca el regalo para descubrir a quién le regalas!
        </p>
        <p className="mt-1 text-sm text-ink/60">
          Asegúrate de que nadie esté viendo tu pantalla 🤫
        </p>
      </div>
    );
  }

  return (
    <div className="reveal text-center">
      <p className="text-sm font-bold tracking-widest text-pine-light uppercase">
        Te tocó regalarle a
      </p>
      <p className="mt-1 font-display text-5xl font-bold break-words text-berry sm:text-6xl">
        {receiverName}
      </p>
      <p className="mt-1 text-2xl" aria-hidden="true">
        🎄✨🎁✨🎄
      </p>

      <div className="mt-5 rounded-xl bg-pine/5 p-4 text-left">
        <h3 className="font-bold text-pine">Su lista de deseos</h3>
        {items.length === 0 ? (
          <p className="mt-1 text-sm text-ink/60">
            Todavía no ha agregado nada. Vuelve más tarde o sorpréndele. 😉
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex gap-2">
                <span aria-hidden="true">🎁</span>
                <div className="min-w-0">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold break-words text-berry underline underline-offset-2"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="font-semibold break-words">
                      {item.title}
                    </span>
                  )}
                  {item.note && (
                    <p className="text-sm break-words text-ink/65">
                      {item.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="btn btn-outline mt-4"
        onClick={() => setStage("closed")}
      >
        Volver a envolver
      </button>
    </div>
  );
}
