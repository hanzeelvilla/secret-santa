import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { PageLoading } from "@/components/Header";
import { getCurrentUser, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Crear cuenta" };

async function Content({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeNext(next, "") : "";

  if (await getCurrentUser()) redirect(nextPath || "/dashboard");

  return (
    <div className="card mx-auto mt-6 max-w-md">
      <h1 className="font-display text-4xl font-bold text-berry">
        Únete a la fiesta 🎅
      </h1>
      <p className="mt-1 mb-5 text-sm text-ink/70">
        {nextPath.startsWith("/join/")
          ? "Crea tu cuenta para unirte al intercambio."
          : "Crea tu cuenta para organizar o unirte a un intercambio."}
      </p>
      <AuthForm mode="register" next={nextPath || undefined} />
    </div>
  );
}

export default function RegisterPage(props: PageProps<"/register">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
