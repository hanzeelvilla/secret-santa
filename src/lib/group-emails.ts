import "server-only";
import { db } from "@/lib/db";
import { getAppUrl, sendEmails, type EmailMessage } from "@/lib/email";
import { drawDoneEmail, groupUpdatedEmail } from "@/lib/email-templates";
import { formatDate, formatMoney } from "@/lib/format";
import type { GroupChange } from "@/lib/group-changes";

/**
 * Avisa a los participantes (menos al organizador, que hizo el cambio) de lo
 * que cambió en el grupo. Nunca lanza: un fallo de envío solo se registra.
 */
export async function notifyGroupUpdated(
  groupId: string,
  changes: GroupChange[],
): Promise<void> {
  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: {
        name: true,
        ownerId: true,
        owner: { select: { name: true } },
        memberships: {
          select: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!group) return;

    const url = `${getAppUrl()}/groups/${groupId}`;
    const messages: EmailMessage[] = group.memberships
      .map((m) => m.user)
      .filter((user) => user.id !== group.ownerId)
      .map((user) => ({
        to: user.email,
        ...groupUpdatedEmail({
          name: user.name,
          ownerName: group.owner.name,
          groupName: group.name,
          changes,
          url,
        }),
      }));

    await sendEmails(messages);
  } catch (error) {
    console.error("No se pudieron enviar los avisos de grupo actualizado:", error);
  }
}

/**
 * Avisa a todos los participantes (también al organizador) de que el sorteo se
 * hizo o se rehízo. El correo NO incluye a quién le toca a nadie. Nunca lanza.
 */
export async function notifyDrawDone(
  groupId: string,
  { redo }: { redo: boolean },
): Promise<void> {
  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: {
        name: true,
        budget: true,
        currency: true,
        exchangeDate: true,
        owner: { select: { name: true } },
        memberships: {
          select: { user: { select: { name: true, email: true } } },
        },
      },
    });
    if (!group) return;

    const url = `${getAppUrl()}/groups/${groupId}`;
    const messages: EmailMessage[] = group.memberships.map(({ user }) => ({
      to: user.email,
      ...drawDoneEmail({
        name: user.name,
        ownerName: group.owner.name,
        groupName: group.name,
        redo,
        exchangeDate: group.exchangeDate ? formatDate(group.exchangeDate) : null,
        budget:
          group.budget !== null ? formatMoney(group.budget, group.currency) : null,
        url,
      }),
    }));

    await sendEmails(messages);
  } catch (error) {
    console.error("No se pudieron enviar los avisos del sorteo:", error);
  }
}
