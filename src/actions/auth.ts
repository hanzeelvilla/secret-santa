"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  createSession,
  deleteSession,
  getCurrentUser,
  requireUser,
  safeNext,
} from "@/lib/session";
import { getSendStatus } from "@/lib/email-tokens";
import { notifyPasswordChanged, sendPasswordResetEmail } from "@/lib/password-reset";
import { hashToken, isExpired } from "@/lib/tokens";
import { getResendStatus, sendVerificationEmail } from "@/lib/verification";
import {
  changePasswordSchema,
  type FormState,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
  toFormState,
} from "@/lib/validation";

export async function register(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return toFormState(parsed.error);

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  let userId: string;
  try {
    const user = await db.user.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        fieldErrors: { email: ["Ya existe una cuenta con ese correo"] },
      };
    }
    throw error;
  }

  await createSession(userId);

  // Con la cuenta creada, se manda el correo de confirmación. Si el envío
  // falla no se rompe el registro: la pantalla siguiente permite reenviarlo.
  const next = safeNext(formData.get("next"));
  try {
    await sendVerificationEmail({ id: userId, name, email }, next);
  } catch (error) {
    console.error("No se pudo enviar el correo de confirmación:", error);
  }
  redirect(`/verify-email?next=${encodeURIComponent(next)}`);
}

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return toFormState(parsed.error);

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    return { error: "Correo o contraseña incorrectos" };
  }

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

/** Confirma el correo con el token del enlace (un solo uso, vence a las 24 h). */
export async function confirmEmail(
  token: string,
  next: string,
): Promise<FormState> {
  const record = await db.emailToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { type: true, expiresAt: true, userId: true },
  });
  if (
    !record ||
    record.type !== "EMAIL_VERIFICATION" ||
    isExpired(record.expiresAt)
  ) {
    return { error: "Este enlace no es válido o ya venció. Pide uno nuevo." };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    db.emailToken.deleteMany({
      where: { userId: record.userId, type: "EMAIL_VERIFICATION" },
    }),
  ]);
  revalidatePath("/", "layout");

  // Solo se continúa dentro de la app si la sesión es de esa misma cuenta;
  // tener el token no inicia sesión por sí solo.
  const destination = safeNext(next);
  const current = await getCurrentUser();
  redirect(
    current?.id === record.userId
      ? destination
      : `/login?next=${encodeURIComponent(destination)}`,
  );
}

/** Reenvía el correo de confirmación (con espera de 60 s y tope por hora). */
export async function resendVerification(next: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerified) redirect(safeNext(next));

  const { waitSeconds, limited } = await getResendStatus(user.id);
  if (waitSeconds > 0) {
    return { error: `Espera ${waitSeconds} segundos para pedir otro correo.` };
  }
  if (limited) {
    return {
      error: "Pediste demasiados correos. Inténtalo de nuevo en una hora.",
    };
  }

  try {
    await sendVerificationEmail(user, safeNext(next));
  } catch (error) {
    console.error("No se pudo reenviar el correo de confirmación:", error);
    return {
      error: "No pudimos enviar el correo. Inténtalo de nuevo en un momento.",
    };
  }
  return { success: "Te enviamos un correo nuevo 📬" };
}

/** Actualiza el nombre de la persona con sesión (no recibe ningún id del cliente). */
export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/profile");

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return toFormState(parsed.error);

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });

  // El nombre aparece en el header, el dashboard y todos los grupos.
  revalidatePath("/", "layout");
  return { success: "Nombre actualizado ✅" };
}

/** Cambia la contraseña de quien tiene sesión (pide la actual) y cierra las demás sesiones. */
export async function changePassword(formData: FormData): Promise<FormState> {
  const user = await requireUser("/profile");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return toFormState(parsed.error);

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const matches =
    record !== null &&
    (await bcrypt.compare(parsed.data.currentPassword, record.passwordHash));
  if (!matches) {
    return {
      fieldErrors: { currentPassword: ["La contraseña actual no es correcta"] },
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
      // Invalida todas las sesiones anteriores, también la de este dispositivo…
      passwordChangedAt: new Date(),
    },
  });
  // …y por eso se emite una nueva para quien acaba de cambiarla.
  await createSession(user.id);
  await notifyPasswordChanged(user);

  return { success: "Contraseña actualizada ✅ Se cerraron tus otras sesiones." };
}

const RESET_REQUESTED =
  "Si hay una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña. Revisa también el spam.";

/**
 * Pide el correo de "olvidé mi contraseña". Responde siempre lo mismo, exista o
 * no la cuenta, para no revelar qué correos están registrados.
 */
export async function requestPasswordReset(
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return toFormState(parsed.error);

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });
  if (user) {
    const { waitSeconds, limited } = await getSendStatus(
      user.id,
      "PASSWORD_RESET",
    );
    // El límite (60 s y 5 por hora) se aplica sin avisar de nada al usuario.
    if (waitSeconds === 0 && !limited) {
      try {
        await sendPasswordResetEmail(user);
      } catch (error) {
        console.error("No se pudo enviar el correo de restablecimiento:", error);
      }
    }
  }
  return { success: RESET_REQUESTED };
}

/** Fija la contraseña nueva con el token del correo (un solo uso, 1 hora). */
export async function resetPassword(
  token: string,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return toFormState(parsed.error);

  const record = await db.emailToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      type: true,
      expiresAt: true,
      user: {
        select: { id: true, name: true, email: true, emailVerifiedAt: true },
      },
    },
  });
  if (
    !record ||
    record.type !== "PASSWORD_RESET" ||
    isExpired(record.expiresAt)
  ) {
    return { error: "Este enlace no es válido o ya venció. Pide uno nuevo." };
  }

  const { user } = record;
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        passwordChangedAt: new Date(),
        // Recibir el enlace prueba que el correo es suyo.
        ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
      },
    }),
    db.emailToken.deleteMany({
      where: { userId: user.id, type: "PASSWORD_RESET" },
    }),
  ]);
  await notifyPasswordChanged(user);

  // No se inicia sesión solo por tener el token: se vuelve al login.
  redirect("/login?reset=1");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
