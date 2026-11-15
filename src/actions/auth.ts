"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, deleteSession, safeNext } from "@/lib/session";
import {
  type FormState,
  loginSchema,
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

export async function logout() {
  await deleteSession();
  redirect("/");
}
