import type { ReactNode } from "react";
import { formatDate, formatMoney } from "@/lib/format";

/** Tarjeta de invitación a un grupo; el pie (botones) lo pone quien la usa. */
export function InviteCard({
  group,
  count,
  children,
}: {
  group: {
    name: string;
    description: string | null;
    budget: number | null;
    currency: string;
    exchangeDate: string | null;
    owner: { name: string };
  };
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="card mx-auto mt-6 max-w-md text-center">
      <p className="text-5xl" aria-hidden="true">
        💌
      </p>
      <p className="mt-2 text-sm text-ink/70">
        {group.owner.name} te invita al intercambio
      </p>
      <h1 className="font-display text-5xl leading-tight font-bold break-words text-pine">
        {group.name}
      </h1>
      {group.description && (
        <p className="mt-2 text-sm break-words whitespace-pre-line text-ink/75">
          {group.description}
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="chip">
          👥 {count} {count === 1 ? "participante" : "participantes"}
        </span>
        {group.budget !== null && (
          <span className="chip">
            💰 {formatMoney(group.budget, group.currency)}
          </span>
        )}
        {group.exchangeDate && (
          <span className="chip">📅 {formatDate(group.exchangeDate)}</span>
        )}
      </div>
      {children}
    </div>
  );
}
