import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/actions/auth";
import { getCurrentUser } from "@/lib/session";

async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Link href="/login" className="btn btn-ghost">
          Entrar
        </Link>
        <Link href="/register" className="btn btn-gold px-4 py-1.5">
          Crear cuenta
        </Link>
      </>
    );
  }

  // Con el correo sin confirmar solo se puede salir (bloqueo total).
  if (!user.emailVerified) {
    return (
      <form action={logout}>
        <button type="submit" className="btn btn-ghost">
          Salir
        </button>
      </form>
    );
  }

  return (
    <>
      <Link href="/dashboard" className="btn btn-ghost">
        Mis grupos
      </Link>
      <Link
        href="/profile"
        className="btn btn-ghost max-w-40"
        aria-label="Mi perfil"
      >
        <span className="hidden truncate sm:inline">{user.name}</span>
        <span className="sm:hidden">Perfil</span>
      </Link>
      <form action={logout}>
        <button type="submit" className="btn btn-ghost">
          Salir
        </button>
      </form>
    </>
  );
}

export function Header() {
  return (
    <header className="relative z-10">
      <div className="lights" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link
          href="/"
          className="font-display text-2xl font-bold text-cream sm:text-3xl"
        >
          🎅 Secret Santa
        </Link>
        <nav className="flex items-center gap-1">
          <Suspense fallback={null}>
            <UserNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

export function PageLoading() {
  return (
    <p className="py-16 text-center font-display text-2xl text-cream/80">
      🎄 Cargando…
    </p>
  );
}
