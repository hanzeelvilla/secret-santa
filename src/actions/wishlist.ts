"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { type FormState, itemSchema, toFormState } from "@/lib/validation";

const MAX_ITEMS = 30;

function parseItem(formData: FormData) {
  return itemSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
  });
}

export async function addItem(
  groupId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const membership = await db.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
    select: { id: true, _count: { select: { items: true } } },
  });
  if (!membership) return { error: "No perteneces a este grupo" };
  if (membership._count.items >= MAX_ITEMS) {
    return { error: `Tu lista ya tiene ${MAX_ITEMS} deseos, ¡es suficiente!` };
  }

  const parsed = parseItem(formData);
  if (!parsed.success) return toFormState(parsed.error);

  await db.wishlistItem.create({
    data: {
      membershipId: membership.id,
      title: parsed.data.title,
      url: parsed.data.url ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return undefined;
}

export async function updateItem(
  itemId: string,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    select: { membership: { select: { userId: true, groupId: true } } },
  });
  if (!item || item.membership.userId !== user.id) {
    return { error: "No puedes editar este deseo" };
  }

  const parsed = parseItem(formData);
  if (!parsed.success) return toFormState(parsed.error);

  await db.wishlistItem.update({
    where: { id: itemId },
    data: {
      title: parsed.data.title,
      url: parsed.data.url ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath(`/groups/${item.membership.groupId}`);
  return undefined;
}

export async function deleteItem(itemId: string) {
  const user = await requireUser();

  const item = await db.wishlistItem.findUnique({
    where: { id: itemId },
    select: { membership: { select: { userId: true, groupId: true } } },
  });
  if (!item || item.membership.userId !== user.id) return;

  await db.wishlistItem.delete({ where: { id: itemId } });
  revalidatePath(`/groups/${item.membership.groupId}`);
}
