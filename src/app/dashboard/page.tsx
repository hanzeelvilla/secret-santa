import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GroupListToolbar } from "@/components/GroupListToolbar";
import { PageLoading } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import {
  buildGroupListQuery,
  groupListHref,
  PAGE_SIZE,
  pageCount,
  parseGroupListParams,
  todayIso,
} from "@/lib/group-list";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mis grupos" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("/dashboard");

  const requested = parseGroupListParams(await searchParams);
  const { where, orderBy } = buildGroupListQuery(
    requested,
    user.id,
    todayIso(),
  );

  // Total del usuario (decide si hay barra de herramientas) y total filtrado
  // (decide las páginas). Una página fuera de rango se ajusta a la última.
  const [totalAll, totalFiltered] = await Promise.all([
    db.membership.count({ where: { userId: user.id } }),
    db.membership.count({ where }),
  ]);
  const params = {
    ...requested,
    page: Math.min(requested.page, pageCount(totalFiltered)),
  };

  const memberships = await db.membership.findMany({
    where,
    orderBy,
    skip: (params.page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      group: {
        select: {
          id: true,
          name: true,
          exchangeDate: true,
          exchangeTime: true,
          drawnAt: true,
          ownerId: true,
          _count: { select: { memberships: true } },
        },
      },
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-snow/70">¡Hola, {user.name}! 👋</p>
          <h1 className="font-display text-5xl font-bold text-cream">
            Mis intercambios
          </h1>
        </div>
        <Link href="/groups/new" className="btn btn-primary">
          + Nuevo grupo
        </Link>
      </div>

      {totalAll > 0 && <GroupListToolbar params={params} />}

      {totalAll > 0 && memberships.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-5xl" aria-hidden="true">
            🔍
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-berry">
            Ningún grupo coincide
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink/70">
            Prueba con otra búsqueda o quita algún filtro.
          </p>
          <Link
            href={groupListHref({ sort: params.sort })}
            className="btn btn-outline mt-4"
          >
            Limpiar filtros
          </Link>
        </div>
      ) : memberships.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-5xl" aria-hidden="true">
            🎁
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-berry">
            Aún no estás en ningún intercambio
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink/70">
            Crea un grupo e invita a tus amigos, o pídele al organizador que
            te mande su enlace de invitación.
          </p>
          <Link href="/groups/new" className="btn btn-primary mt-4">
            Crear mi primer grupo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {memberships.map(({ group }) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="card block h-full border-l-8 border-berry transition hover:-translate-y-0.5 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-3xl leading-tight font-bold break-words text-pine">
                    {group.name}
                  </h2>
                  {group.ownerId === user.id && (
                    <span className="shrink-0 rounded-full bg-gold/30 px-2.5 py-0.5 text-xs font-bold text-ink">
                      Organizas
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="chip">
                    👥 {group._count.memberships}{" "}
                    {group._count.memberships === 1
                      ? "participante"
                      : "participantes"}
                  </span>
                  {group.exchangeDate && (
                    <span className="chip">
                      📅 {formatDateTime(group.exchangeDate, group.exchangeTime)}
                    </span>
                  )}
                  <span
                    className={`chip ${group.drawnAt ? "bg-berry/10 text-berry" : ""}`}
                  >
                    {group.drawnAt ? "🎁 Sorteo hecho" : "⏳ Esperando sorteo"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination params={params} total={totalFiltered} />
    </>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
