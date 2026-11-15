"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  createSession,
  deleteSession,
  requireUser,
  safeNext,
} from "@/lib/session";
import {
  type FormState,
  loginSchema,
  profileSchema,
  registerSchema,
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
  redirect(safeNext(formData.get("next")));
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

export async function logout() {
  await deleteSession();
  redirect("/");
}
