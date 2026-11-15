import "server-only";
import type { EmailTokenType } from "@prisma/client";
import { db } from "@/lib/db";
import { cooldownSeconds, generateToken, reachedHourlyLimit } from "@/lib/tokens";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Crea un token de un solo uso para el correo y devuelve el valor en claro (el
 * que va en el enlace); en la base solo se guarda su hash.
 */
export async function issueEmailToken(
  userId: string,
  type: EmailTokenType,
  ttlMs: number,
): Promise<string> {
  const { token, hash } = generateToken();

  // Solo se limpian los vencidos: los envíos recientes cuentan para el límite.
  await db.emailToken.deleteMany({
    where: { userId, type, expiresAt: { lte: new Date() } },
  });
  await db.emailToken.create({
    data: {
      userId,
      type,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return token;
}

/** Estado de envío: segundos de espera y si ya llegó al límite por hora. */
export async function getSendStatus(
  userId: string,
  type: EmailTokenType,
): Promise<{ waitSeconds: number; limited: boolean }> {
  const [latest, sentInLastHour] = await Promise.all([
    db.emailToken.findFirst({
      where: { userId, type },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.emailToken.count({
      where: { userId, type, createdAt: { gt: new Date(Date.now() - HOUR_MS) } },
    }),
  ]);
  return {
    waitSeconds: cooldownSeconds(latest?.createdAt ?? null),
    limited: reachedHourlyLimit(sentInLastHour),
  };
}
