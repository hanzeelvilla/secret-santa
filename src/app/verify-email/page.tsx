import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { logout } from "@/actions/auth";
import { ConfirmEmailForm } from "@/components/ConfirmEmailForm";
import { PageLoading } from "@/components/Header";
import { ResendButton } from "@/components/ResendButton";
import { getCurrentUser, safeNext } from "@/lib/session";
import { getResendStatus } from "@/lib/verification";

export const metadata: Metadata = { title: "Confirma tu correo" };

async function Content({ searchParams }: PageProps<"/verify-email">) {
  const { token, next } = await searchParams;
  const nextPath = safeNext(typeof next === "string" ? next : undefined);

  // Llegada desde el enlace del correo: un clic confirma la cuenta.
  if (typeof token === "string" && token) {
    return (
      <div className="card mx-auto mt-6 max-w-md text-center">
        <p className="text-5xl" aria-hidden="true">
          ✉️
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-berry">
          Confirma tu correo
        </h1>
        <p className="mt-1 mb-5 text-sm text-ink/70">
          Un último paso para activar tu cuenta.
        </p>
        <ConfirmEmailForm token={token} next={nextPath} />
        <p className="mt-4 text-sm text-ink/70">
          ¿El enlace no funciona?{" "}
          <Link
            href={`/verify-email?next=${encodeURIComponent(nextPath)}`}
            className="font-bold text-berry underline underline-offset-2"
          >
            Pide uno nuevo
          </Link>
        </p>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (user.emailVerified) redirect(nextPath);

  const { waitSeconds } = await getResendStatus(user.id);

  return (
    <div className="card mx-auto mt-6 max-w-md text-center">
      <p className="text-5xl" aria-hidden="true">
        📬
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold text-berry">
        Revisa tu correo
      </h1>
      <p className="mt-1 mb-5 text-sm text-ink/70">
        Te enviamos un enlace de confirmación a{" "}
        <strong className="break-all text-ink">{user.email}</strong>. Ábrelo
        para activar tu cuenta. Si no lo ves, revisa la carpeta de spam.
      </p>
      <ResendButton next={nextPath} initialWait={waitSeconds} />
      <form action={logout} className="mt-4">
        <button
          type="submit"
          className="cursor-pointer text-sm font-bold text-berry underline underline-offset-2"
        >
          Salir o usar otra cuenta
        </button>
      </form>
    </div>
  );
}

export default function VerifyEmailPage(props: PageProps<"/verify-email">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
