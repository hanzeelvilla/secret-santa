"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { drawAssignments, MIN_PARTICIPANTS } from "@/lib/draw";
import { requireUser } from "@/lib/session";
import { type FormState, groupSchema, toFormState } from "@/lib/validation";

export async function createGroup(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/groups/new");

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    budget: formData.get("budget"),
    currency: formData.get("currency") ?? undefined,
    exchangeDate: formData.get("exchangeDate"),
  });
  if (!parsed.success) return toFormState(parsed.error);

  const group = await db.group.create({
    data: {
      ...parsed.data,
      inviteCode: randomBytes(9).toString("base64url"),
      ownerId: user.id,
      memberships: { create: { userId: user.id } },
    },
    select: { id: true },
  });

  redirect(`/groups/${group.id}`);
}

/** Actualiza los datos del grupo. Solo el organizador. */
export async function updateGroup(
  groupId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(`/groups/${groupId}/edit`);

  const group = await db.group.findFirst({
    where: { id: groupId, ownerId: user.id },
    select: { id: true },
  });
  if (!group) redirect(`/groups/${groupId}`);

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    budget: formData.get("budget"),
    currency: formData.get("currency") ?? undefined,
    exchangeDate: formData.get("exchangeDate"),
  });
  if (!parsed.success) return toFormState(parsed.error);

  const { name, description, budget, currency, exchangeDate } = parsed.data;
  await db.group.update({
    where: { id: groupId },
    data: {
      name,
      currency,
      // En Prisma `undefined` significa "no tocar": para poder borrar un
      // campo opcional hay que enviar `null` de forma explícita.
      description: description ?? null,
      budget: budget ?? null,
      exchangeDate: exchangeDate ?? null,
    },
  });

  // `/groups/<id>` no invalida su ruta hija `/edit`: sin esto, al volver a
  // editar podría verse la versión en caché con los datos anteriores.
  revalidatePath(`/groups/${groupId}/edit`);
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  redirect(`/groups/${groupId}`);
}

/** Quita a un participante. Solo el organizador y solo antes del sorteo. */
export async function removeMember(groupId: string, userId: string) {
  const user = await requireUser();

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true, drawnAt: true },
  });
  // Tras el sorteo no se puede quitar a nadie (rompería la cadena de regalos)
  // y el organizador no puede quitarse a sí mismo.
  if (
    !group ||
    group.ownerId !== user.id ||
    group.drawnAt ||
    userId === group.ownerId
  ) {
    redirect(`/groups/${groupId}`);
  }

  await db.membership.deleteMany({ where: { groupId, userId } });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
}

export async function joinGroup(inviteCode: string) {
  const user = await requireUser(`/join/${inviteCode}`);

  const group = await db.group.findUnique({
    where: { inviteCode },
    select: { id: true, drawnAt: true },
  });
  if (!group) redirect("/dashboard");

  const existing = await db.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
    select: { id: true },
  });

  if (!existing) {
    // Con el sorteo hecho ya no se aceptan participantes nuevos;
    // la página de invitación muestra el aviso.
    if (group.drawnAt) redirect(`/join/${inviteCode}`);
    await db.membership.create({
      data: { userId: user.id, groupId: group.id },
    });
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${group.id}`);
}

export async function leaveGroup(groupId: string) {
  const user = await requireUser();

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true, drawnAt: true },
  });
  // El organizador no puede salirse, y nadie puede salirse tras el sorteo
  // (rompería la cadena de regalos).
  if (!group || group.ownerId === user.id || group.drawnAt) {
    redirect(`/groups/${groupId}`);
  }

  await db.membership.deleteMany({ where: { groupId, userId: user.id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteGroup(groupId: string) {
  const user = await requireUser();
  await db.group.deleteMany({ where: { id: groupId, ownerId: user.id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Hace (o rehace) el sorteo. Solo el organizador. */
export async function runDraw(groupId: string): Promise<FormState> {
  const user = await requireUser();

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: {
      ownerId: true,
      memberships: { select: { userId: true } },
    },
  });
  if (!group || group.ownerId !== user.id) {
    return { error: "Solo quien organiza el grupo puede hacer el sorteo" };
  }
  if (group.memberships.length < MIN_PARTICIPANTS) {
    return {
      error: `Se necesitan al menos ${MIN_PARTICIPANTS} participantes para sortear`,
    };
  }

  const pairs = drawAssignments(group.memberships.map((m) => m.userId));

  await db.$transaction([
    db.assignment.deleteMany({ where: { groupId } }),
    db.assignment.createMany({
      data: pairs.map((pair) => ({ groupId, ...pair })),
    }),
    db.group.update({ where: { id: groupId }, data: { drawnAt: new Date() } }),
  ]);

  revalidatePath(`/groups/${groupId}`);
  return undefined;
}
