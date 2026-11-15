import { createHash, randomBytes } from "node:crypto";

/** Tiempo de vida del enlace de confirmación de correo. */
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
/** Tiempo de vida del enlace para restablecer la contraseña. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
/** Espera mínima entre dos envíos del mismo correo. */
export const RESEND_COOLDOWN_MS = 60 * 1000;
/** Máximo de correos de confirmación por hora y cuenta. */
export const MAX_SENDS_PER_HOUR = 5;

/** El token se guarda siempre como hash: nunca en claro en la base de datos. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Token aleatorio para el enlace (256 bits) y su hash para guardar. */
export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

/** Segundos que faltan para poder reenviar (0 si ya se puede). */
export function cooldownSeconds(
  lastSentAt: Date | null,
  now: Date = new Date(),
): number {
  if (!lastSentAt) return 0;
  const remaining = lastSentAt.getTime() + RESEND_COOLDOWN_MS - now.getTime();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function reachedHourlyLimit(sentInLastHour: number): boolean {
  return sentInLastHour >= MAX_SENDS_PER_HOUR;
}
