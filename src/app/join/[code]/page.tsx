import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { joinGroup } from "@/actions/groups";
import { PageLoading } from "@/components/Header";
import { SubmitButton } from "@/components/buttons";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Invitación" };

async function Content({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const user = await requireUser(`/join/${code}`);

  const group = await db.group.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      name: true,
      description: true,
      budget: true,
      currency: true,
      exchangeDate: true,
      drawnAt: true,
      owner: { select: { name: true } },
      memberships: { select: { userId: true } },
    },
  });

  if (!group) {
    return (
      <div className="card mx-auto mt-6 max-w-md text-center">
        <p className="text-5xl" aria-hidden="true">
          🧐
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-berry">
          Esta invitación no existe
        </h1>
        <p className="mt-1 text-sm text-ink/70">
          Revisa que el enlace esté completo o pide uno nuevo a quien organiza.
        </p>
        <Link href="/dashboard" className="btn btn-outline mt-4">
          Ir a mis grupos
        </Link>
      </div>
    );
  }

  if (group.memberships.some((m) => m.userId === user.id)) {
    redirect(`/groups/${group.id}`);
  }

  if (group.drawnAt) {
    return (
      <div className="card mx-auto mt-6 max-w-md text-center">
        <p className="text-5xl" aria-hidden="true">
          🎁
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-berry">
          El sorteo ya se hizo
        </h1>
        <p className="mt-1 text-sm text-ink/70">
          «{group.name}» ya no acepta participantes nuevos. Habla con{" "}
          {group.owner.name} si crees que es un error.
        </p>
        <Link href="/dashboard" className="btn btn-outline mt-4">
          Ir a mis grupos
        </Link>
      </div>
    );
  }

  const count = group.memberships.length;

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
      <form action={joinGroup.bind(null, code)} className="mt-6">
        <SubmitButton
          className="btn btn-primary w-full py-3 text-base"
          pendingText="Uniéndote…"
        >
          ¡Quiero participar! 🎅
        </SubmitButton>
      </form>
      <p className="mt-3 text-xs text-ink/50">Entrarás como {user.name}</p>
    </div>
  );
}

export default function JoinPage(props: PageProps<"/join/[code]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
