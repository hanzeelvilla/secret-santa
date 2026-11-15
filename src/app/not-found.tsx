import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md text-center">
      <p className="text-5xl" aria-hidden="true">
        ☃️
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold text-berry">
        Aquí solo hay nieve
      </h1>
      <p className="mt-1 text-sm text-ink/70">
        No encontramos esta página, o no tienes acceso a este intercambio.
      </p>
      <Link href="/dashboard" className="btn btn-primary mt-4">
        Ir a mis grupos
      </Link>
    </div>
  );
}
