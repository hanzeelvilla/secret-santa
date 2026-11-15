import "server-only";
import { getAppUrl, sendEmail } from "@/lib/email";
import { issueEmailToken } from "@/lib/email-tokens";
import {
  passwordChangedEmail,
  passwordResetEmail,
} from "@/lib/email-templates";
import { PASSWORD_RESET_TTL_MS } from "@/lib/tokens";

type Recipient = { id: string; name: string; email: string };

/** Crea un token de restablecimiento (1 hora) y envía el enlace por correo. */
export async function sendPasswordResetEmail(user: Recipient): Promise<void> {
  const token = await issueEmailToken(
    user.id,
    "PASSWORD_RESET",
    PASSWORD_RESET_TTL_MS,
  );
  const url = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.email,
    ...passwordResetEmail({ name: user.name, url }),
  });
}

/**
 * Avisa de que la contraseña cambió. Si falla el envío no se revierte el
 * cambio: solo se registra el error.
 */
export async function notifyPasswordChanged(user: Recipient): Promise<void> {
  try {
    await sendEmail({
      to: user.email,
      ...passwordChangedEmail({
        name: user.name,
        resetUrl: `${getAppUrl()}/forgot-password`,
      }),
    });
  } catch (error) {
    console.error("No se pudo enviar el aviso de cambio de contraseña:", error);
  }
}
