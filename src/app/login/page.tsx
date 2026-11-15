import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { PageLoading } from "@/components/Header";
import { getCurrentUser, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Iniciar sesión" };

async function Content({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeNext(next, "") : "";

  if (await getCurrentUser()) redirect(nextPath || "/dashboard");

  return (
    <div className="card mx-auto mt-6 max-w-md">
      <h1 className="font-display text-4xl font-bold text-berry">
        ¡Qué gusto verte! 🎄
      </h1>
      <p className="mt-1 mb-5 text-sm text-ink/70">
        {nextPath.startsWith("/join/")
          ? "Inicia sesión para unirte al intercambio."
          : "Entra para ver tus intercambios."}
      </p>
      <AuthForm mode="login" next={nextPath || undefined} />
    </div>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
