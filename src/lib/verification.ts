import "server-only";
import { db } from "@/lib/db";
import { getAppUrl, sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/email-templates";
import {
  cooldownSeconds,
  generateToken,
  reachedHourlyLimit,
  VERIFICATION_TTL_MS,
} from "@/lib/tokens";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Crea un token de confirmación y envía el correo con el enlace.
 * `next` es la ruta a la que volver tras confirmar (ya validada con safeNext).
 */
export async function sendVerificationEmail(
  user: { id: string; name: string; email: string },
  next: string,
): Promise<void> {
  const { token, hash } = generateToken();

  // Solo se limpian los vencidos: los envíos recientes cuentan para el límite.
  await db.emailToken.deleteMany({
    where: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      expiresAt: { lte: new Date() },
    },
  });
  await db.emailToken.create({
    data: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      tokenHash: hash,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
  await sendEmail({
    to: user.email,
    ...verificationEmail({ name: user.name, url }),
  });
}

/** Estado de reenvío: segundos de espera y si ya llegó al límite por hora. */
export async function getResendStatus(userId: string): Promise<{
  waitSeconds: number;
  limited: boolean;
}> {
  const [latest, sentInLastHour] = await Promise.all([
    db.emailToken.findFirst({
      where: { userId, type: "EMAIL_VERIFICATION" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.emailToken.count({
      where: {
        userId,
        type: "EMAIL_VERIFICATION",
        createdAt: { gt: new Date(Date.now() - HOUR_MS) },
      },
    }),
  ]);
  return {
    waitSeconds: cooldownSeconds(latest?.createdAt ?? null),
    limited: reachedHourlyLimit(sentInLastHour),
  };
}
