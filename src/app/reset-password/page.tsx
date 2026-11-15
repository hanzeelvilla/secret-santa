import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoading } from "@/components/Header";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { db } from "@/lib/db";
import { hashToken, isExpired } from "@/lib/tokens";

export const metadata: Metadata = { title: "Nueva contraseña" };

async function Content({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";

  // Solo se comprueba el token (no se consume): se gasta al guardar la contraseña.
  const record = value
    ? await db.emailToken.findUnique({
        where: { tokenHash: hashToken(value) },
        select: { type: true, expiresAt: true },
      })
    : null;
  const valid =
    record !== null &&
    record.type === "PASSWORD_RESET" &&
    !isExpired(record.expiresAt);

  if (!valid) {
    return (
      <div className="card mx-auto mt-6 max-w-md text-center">
        <p className="text-5xl" aria-hidden="true">
          ⏳
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-berry">
          Este enlace ya no sirve
        </h1>
        <p className="mt-1 text-sm text-ink/70">
          Puede haber vencido (valen 1 hora) o ya se usó. Pide uno nuevo.
        </p>
        <Link href="/forgot-password" className="btn btn-primary mt-4">
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }

  return (
    <div className="card mx-auto mt-6 max-w-md">
      <h1 className="font-display text-4xl font-bold text-berry">
        Elige tu nueva contraseña 🔑
      </h1>
      <p className="mt-1 mb-5 text-sm text-ink/70">
        Al guardarla se cerrarán las sesiones abiertas en otros dispositivos.
      </p>
      <ResetPasswordForm token={value} />
    </div>
  );
}

export default function ResetPasswordPage(props: PageProps<"/reset-password">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
