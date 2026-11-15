import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordCard } from "@/components/ForgotPasswordCard";
import { PageLoading } from "@/components/Header";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ForgotPasswordCard />
    </Suspense>
  );
}
