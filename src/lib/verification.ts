import "server-only";
import { getAppUrl, sendEmail } from "@/lib/email";
import { getSendStatus, issueEmailToken } from "@/lib/email-tokens";
import { verificationEmail } from "@/lib/email-templates";
import { VERIFICATION_TTL_MS } from "@/lib/tokens";

/**
 * Crea un token de confirmación y envía el correo con el enlace.
 * `next` es la ruta a la que volver tras confirmar (ya validada con safeNext).
 */
export async function sendVerificationEmail(
  user: { id: string; name: string; email: string },
  next: string,
): Promise<void> {
  const token = await issueEmailToken(
    user.id,
    "EMAIL_VERIFICATION",
    VERIFICATION_TTL_MS,
  );

  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
  await sendEmail({
    to: user.email,
    ...verificationEmail({ name: user.name, url }),
  });
}

/** Estado de reenvío: segundos de espera y si ya llegó al límite por hora. */
export function getResendStatus(userId: string) {
  return getSendStatus(userId, "EMAIL_VERIFICATION");
}
