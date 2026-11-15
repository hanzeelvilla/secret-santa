import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GroupForm } from "@/components/GroupForm";
import { PageLoading } from "@/components/Header";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Nuevo grupo" };

async function Content() {
  await requireUser("/groups/new");

  return (
    <div className="mx-auto mt-4 max-w-xl">
      <Link
        href="/dashboard"
        className="mb-3 inline-block text-sm text-snow/70 hover:text-snow"
      >
        ← Mis grupos
      </Link>

      <div className="card">
        <h1 className="font-display text-4xl font-bold text-berry">
          Nuevo intercambio 🎄
        </h1>
        <p className="mt-1 mb-5 text-sm text-ink/70">
          Después de crearlo recibirás un enlace para invitar a los demás.
        </p>
        <GroupForm />
      </div>
    </div>
  );
}

export default function NewGroupPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}
