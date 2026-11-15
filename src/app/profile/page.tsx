import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PageLoading } from "@/components/Header";
import { ProfileForm } from "@/components/ProfileForm";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mi perfil" };

async function Content() {
  const user = await requireUser("/profile");

  return (
    <div className="mx-auto mt-4 max-w-md">
      <Link
        href="/dashboard"
        className="mb-3 inline-block text-sm text-snow/70 hover:text-snow"
      >
        ← Mis grupos
      </Link>

      <div className="card">
        <h1 className="font-display text-4xl font-bold text-berry">
          Mi perfil 🎅
        </h1>
        <p className="mt-1 mb-5 text-sm text-ink/70">
          Tu nombre es el que ven los demás participantes en todos tus grupos.
        </p>

        <p className="label">Correo</p>
        <p className="mb-4 break-words text-ink/70">{user.email}</p>

        <ProfileForm name={user.name} />
      </div>

      <div className="card mt-5">
        <h2 className="font-display text-3xl font-bold text-berry">
          Cambiar contraseña 🔒
        </h2>
        <p className="mt-1 mb-5 text-sm text-ink/70">
          Al cambiarla se cerrarán tus sesiones en otros dispositivos.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}
