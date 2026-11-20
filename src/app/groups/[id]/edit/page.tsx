import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { GroupForm } from "@/components/GroupForm";
import { PageLoading } from "@/components/Header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Editar intercambio" };

async function Content({ params }: PageProps<"/groups/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/groups/${id}/edit`);

  const group = await db.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      budget: true,
      currency: true,
      exchangeDate: true,
      exchangeTime: true,
      ownerId: true,
      memberships: { where: { userId: user.id }, select: { id: true } },
    },
  });

  // Los grupos solo existen para sus miembros; editar es cosa del organizador.
  if (!group || group.memberships.length === 0) notFound();
  if (group.ownerId !== user.id) redirect(`/groups/${id}`);

  return (
    <div className="mx-auto mt-4 max-w-xl">
      <Link
        href={`/groups/${id}`}
        className="mb-3 inline-block text-sm text-snow/70 hover:text-snow"
      >
        ← Volver al grupo
      </Link>

      <div className="card">
        <h1 className="font-display text-4xl font-bold text-berry">
          Editar intercambio ✏️
        </h1>
        <p className="mt-1 mb-5 text-sm text-ink/70">
          Los cambios los verán todos los participantes.
        </p>
        {/* La `key` cambia con los datos: react-hook-form solo lee los valores
            iniciales al montarse, así que si el grupo cambió (o Next reutiliza
            la página de una visita anterior) se monta un formulario nuevo. */}
        <GroupForm
          key={JSON.stringify([
            group.id,
            group.name,
            group.description,
            group.budget,
            group.currency,
            group.exchangeDate,
            group.exchangeTime,
          ])}
          group={{
            id: group.id,
            name: group.name,
            description: group.description,
            budget: group.budget,
            currency: group.currency,
            exchangeDate: group.exchangeDate,
            exchangeTime: group.exchangeTime,
          }}
        />
      </div>
    </div>
  );
}

export default function EditGroupPage(props: PageProps<"/groups/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
