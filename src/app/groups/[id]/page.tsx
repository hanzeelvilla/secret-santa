import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteGroup, leaveGroup, removeMember } from "@/actions/groups";
import { Countdown } from "@/components/Countdown";
import { DrawButton } from "@/components/DrawButton";
import { GiftReveal } from "@/components/GiftReveal";
import { PageLoading } from "@/components/Header";
import { InviteLink } from "@/components/InviteLink";
import { WishlistEditor } from "@/components/WishlistEditor";
import { SubmitButton } from "@/components/buttons";
import { db } from "@/lib/db";
import { MIN_PARTICIPANTS } from "@/lib/draw";
import { formatDate, formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Intercambio" };

async function Content({ params }: PageProps<"/groups/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/groups/${id}`);

  const group = await db.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      budget: true,
      currency: true,
      exchangeDate: true,
      inviteCode: true,
      drawnAt: true,
      ownerId: true,
      memberships: {
        orderBy: { createdAt: "asc" },
        select: {
          userId: true,
          user: { select: { name: true } },
          items: {
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true, url: true, note: true },
          },
        },
      },
    },
  });

  // Los grupos solo existen para sus miembros.
  const me = group?.memberships.find((m) => m.userId === user.id);
  if (!group || !me) notFound();

  const isOwner = group.ownerId === user.id;
  const isDrawn = group.drawnAt !== null;
  const memberCount = group.memberships.length;
  const missing = MIN_PARTICIPANTS - memberCount;

  // Solo se consulta la asignación del usuario en sesión: nadie puede ver
  // la de los demás, ni siquiera quien organiza.
  const assignment = isDrawn
    ? await db.assignment.findUnique({
        where: { groupId_giverId: { groupId: id, giverId: user.id } },
        select: { receiverId: true },
      })
    : null;
  const receiver = assignment
    ? group.memberships.find((m) => m.userId === assignment.receiverId)
    : undefined;

  return (
    <div className="space-y-5">
      <Link href="/dashboard" className="text-sm text-snow/70 hover:text-snow">
        ← Mis grupos
      </Link>

      {/* Encabezado */}
      <section className="card border-t-8 border-berry">
        <h1 className="font-display text-5xl leading-tight font-bold break-words text-pine">
          {group.name}
        </h1>
        {group.description && (
          <p className="mt-2 break-words whitespace-pre-line text-ink/75">
            {group.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="chip">
            👥 {memberCount}{" "}
            {memberCount === 1 ? "participante" : "participantes"}
          </span>
          {group.budget !== null && (
            <span className="chip">
              💰 Presupuesto: {formatMoney(group.budget, group.currency)}
            </span>
          )}
          {group.exchangeDate && (
            <span className="chip">📅 {formatDate(group.exchangeDate)}</span>
          )}
        </div>
        {group.exchangeDate && (
          <div className="mt-4">
            <Countdown date={group.exchangeDate} />
          </div>
        )}
        {isOwner && (
          <Link
            href={`/groups/${group.id}/edit`}
            className="btn btn-outline mt-4"
          >
            ✏️ Editar grupo
          </Link>
        )}
      </section>

      {/* Sorteo / revelación */}
      <section className="card">
        {isDrawn ? (
          receiver ? (
            <GiftReveal
              // Cada sorteo (o rehacerlo) cambia `drawnAt`: la `key` hace que el
              // regalo vuelva a aparecer tapado, aunque toque la misma persona.
              key={group.drawnAt?.getTime()}
              receiverName={receiver.user.name}
              items={receiver.items}
            />
          ) : (
            <p className="text-center text-ink/70">
              No tienes una asignación en este sorteo.
            </p>
          )
        ) : (
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-berry">
              {isOwner ? "¿Ya están todos?" : "Esperando el sorteo ⏳"}
            </h2>
            {isOwner ? (
              <>
                <p className="mx-auto mt-1 mb-4 max-w-md text-sm text-ink/70">
                  {missing > 0
                    ? `Se necesitan al menos ${MIN_PARTICIPANTS} participantes. ${
                        missing === 1 ? "Falta 1 persona" : `Faltan ${missing} personas`
                      } por unirse.`
                    : "Cuando hagas el sorteo, cada quien podrá ver a quién le regala. Ya no podrá unirse nadie más."}
                </p>
                {missing <= 0 && <DrawButton groupId={group.id} />}
              </>
            ) : (
              <p className="mx-auto mt-1 max-w-md text-sm text-ink/70">
                Cuando el organizador haga el sorteo, aquí podrás descubrir a la
                persona que te tocó. Mientras tanto, ¡llena tu lista de deseos!
              </p>
            )}
          </div>
        )}
      </section>

      {/* Invitación */}
      {isOwner && !isDrawn && (
        <section className="card">
          <h2 className="font-display text-3xl font-bold text-pine">
            💌 Invita a los participantes
          </h2>
          <p className="mt-1 mb-3 text-sm text-ink/70">
            Comparte este enlace. Quien lo abra podrá unirse al grupo.
          </p>
          <InviteLink code={group.inviteCode} />
        </section>
      )}

      {/* Mi lista */}
      <section className="card">
        <h2 className="font-display text-3xl font-bold text-pine">
          📝 Mi lista de deseos
        </h2>
        <p className="mt-1 mb-4 text-sm text-ink/70">
          Tu amigo secreto verá esta lista para elegir tu regalo.
        </p>
        <WishlistEditor groupId={group.id} items={me.items} />
      </section>

      {/* Participantes */}
      <section className="card">
        <h2 className="font-display text-3xl font-bold text-pine">
          👥 Participantes
        </h2>
        {isOwner && isDrawn && (
          <p className="mt-1 text-sm text-ink/60">
            Tras el sorteo no se puede quitar a nadie; si necesitas cambiar algo,
            puedes rehacer el sorteo.
          </p>
        )}
        <ul className="mt-3 divide-y divide-pine/10">
          {group.memberships.map((member) => (
            <li key={member.userId} className="flex items-start gap-2 py-2">
              <details className="min-w-0 flex-1">
                <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                  <span className="min-w-0 flex-1 break-words">
                    {member.user.name}
                    {member.userId === user.id && (
                      <span className="font-normal text-ink/50"> (tú)</span>
                    )}
                  </span>
                  {member.userId === group.ownerId && (
                    <span className="shrink-0 rounded-full bg-gold/30 px-2.5 py-0.5 text-xs font-bold">
                      Organizador
                    </span>
                  )}
                  <span className="shrink-0 text-sm font-normal text-ink/55">
                    {member.items.length}{" "}
                    {member.items.length === 1 ? "deseo" : "deseos"} ▾
                  </span>
                </summary>
                {member.items.length === 0 ? (
                  <p className="mt-2 pl-1 text-sm text-ink/55">
                    Aún no ha agregado deseos.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5 pl-1">
                    {member.items.map((item) => (
                      <li key={item.id} className="flex gap-2 text-sm">
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
                            <p className="break-words text-ink/65">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
              {isOwner && !isDrawn && member.userId !== group.ownerId && (
                <form action={removeMember.bind(null, group.id, member.userId)}>
                  <SubmitButton
                    className="btn btn-danger"
                    pendingText="Quitando…"
                    spinner
                    confirmMessage={`¿Quitar a ${member.user.name} del grupo? Se borrará su lista de deseos.`}
                    confirmLabel="Sí, quitar"
                    confirmIcon="🚪"
                  >
                    Quitar
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Acciones delicadas */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end gap-2">
          {isOwner && isDrawn && <DrawButton groupId={group.id} redo />}
          {isOwner ? (
            <form action={deleteGroup.bind(null, group.id)}>
              <SubmitButton
                className="btn btn-ghost text-snow/70"
                pendingText="Eliminando…"
                spinner
                confirmMessage={`¿Eliminar "${group.name}"? Se borrarán las listas y el sorteo de todos. No se puede deshacer.`}
                confirmLabel="Sí, eliminar"
                confirmIcon="🗑️"
              >
                Eliminar grupo
              </SubmitButton>
            </form>
          ) : (
            !isDrawn && (
              <form action={leaveGroup.bind(null, group.id)}>
                <SubmitButton
                  className="btn btn-outline border-snow/30 text-snow hover:border-snow hover:bg-white/10"
                  pendingText="Saliendo…"
                  spinner
                  confirmMessage="¿Salir de este intercambio? Se borrará tu lista de deseos."
                  confirmLabel="Sí, salir"
                  confirmIcon="👋"
                >
                  Salir del grupo
                </SubmitButton>
              </form>
            )
          )}
        </div>
        {!isOwner && isDrawn && (
          <p className="text-sm text-snow/60">
            Ya se hizo el sorteo, por eso ya no puedes salirte del grupo.
          </p>
        )}
      </div>
    </div>
  );
}

export default function GroupPage(props: PageProps<"/groups/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
