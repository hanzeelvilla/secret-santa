import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { isSessionStale } from "./session-validity";

const COOKIE_NAME = "santa_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "Falta SESSION_SECRET (mínimo 32 caracteres) en el archivo .env",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

async function readSession(): Promise<{
  userId: string;
  issuedAt: number | undefined;
} | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.userId === "string"
      ? { userId: payload.userId, issuedAt: payload.iat }
      : null;
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

/** Usuario de la sesión actual, o null si no hay sesión válida. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      passwordChangedAt: true,
    },
  });
  if (!user) return null;
  // Cambiar la contraseña cierra las sesiones anteriores en todos los dispositivos.
  if (isSessionStale(session.issuedAt, user.passwordChangedAt)) return null;
  const { emailVerifiedAt, passwordChangedAt, ...rest } = user;
  void passwordChangedAt;
  return { ...rest, emailVerified: emailVerifiedAt !== null };
});

/**
 * Igual que getCurrentUser, pero manda a /login si no hay sesión y a
 * /verify-email si el correo aún no se ha confirmado (bloqueo total: una
 * cuenta sin confirmar no accede a nada más).
 */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  if (!user.emailVerified) {
    redirect(
      next ? `/verify-email?next=${encodeURIComponent(next)}` : "/verify-email",
    );
  }
  return user;
}

/** Solo acepta rutas internas para evitar redirecciones a otros sitios. */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\")
  ) {
    return next;
  }
  return fallback;
}
