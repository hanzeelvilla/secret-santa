/**
 * Una sesión (JWT) deja de valer si es anterior al último cambio de contraseña.
 * `iat` está en segundos; se compara en segundos para que la sesión que se
 * reemite justo al cambiar la contraseña (mismo segundo) siga siendo válida.
 */
export function isSessionStale(
  issuedAtSeconds: number | undefined,
  passwordChangedAt: Date | null,
): boolean {
  if (!passwordChangedAt) return false;
  // Sin fecha de emisión no se puede garantizar que sea posterior al cambio.
  if (typeof issuedAtSeconds !== "number") return true;
  return issuedAtSeconds < Math.floor(passwordChangedAt.getTime() / 1000);
}
