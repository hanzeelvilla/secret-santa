import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { joinGroup } from "@/actions/groups";
import { PageLoading } from "@/components/Header";
import { InviteCard } from "@/components/InviteCard";
import { SubmitButton } from "@/components/buttons";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Invitación" };

async function Content({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  // La invitación es pública: quien no tiene sesión también ve la tarjeta
  // (y desde ahí se le invita a entrar). Unirse sí exige sesión (`joinGroup`).
  const user = await getCurrentUser();
  const next = encodeURIComponent(`/join/${code}`);

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
        <Link
          href={user ? "/dashboard" : "/login"}
          className="btn btn-outline mt-4"
        >
          {user ? "Ir a mis grupos" : "Iniciar sesión"}
        </Link>
      </div>
    );
  }

  if (user && group.memberships.some((m) => m.userId === user.id)) {
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
        {user ? (
          <Link href="/dashboard" className="btn btn-outline mt-4">
            Ir a mis grupos
          </Link>
        ) : (
          <>
            <p className="mt-4 text-sm text-ink/70">
              Si ya participas en este intercambio, inicia sesión para verlo.
            </p>
            <Link href={`/login?next=${next}`} className="btn btn-outline mt-2">
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <InviteCard group={group} count={group.memberships.length}>
      {user ? (
        <>
          <form action={joinGroup.bind(null, code)} className="mt-6">
            <SubmitButton
              className="btn btn-primary w-full py-3 text-base"
              pendingText="Uniéndote…"
              spinner
            >
              ¡Quiero participar! 🎅
            </SubmitButton>
          </form>
          <p className="mt-3 text-xs text-ink/50">Entrarás como {user.name}</p>
        </>
      ) : (
        <div className="mt-6">
          <Link
            href={`/login?next=${next}`}
            className="btn btn-primary w-full py-3 text-base"
          >
            Iniciar sesión para unirme 🎅
          </Link>
          <p className="mt-3 text-sm text-ink/70">
            ¿Aún no tienes cuenta?{" "}
            <Link
              href={`/register?next=${next}`}
              className="font-bold text-berry underline underline-offset-2"
            >
              Regístrate
            </Link>
          </p>
        </div>
      )}
    </InviteCard>
  );
}

export default function JoinPage(props: PageProps<"/join/[code]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
