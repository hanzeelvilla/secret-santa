import type { Metadata } from "next";
import { Mountains_of_Christmas, Nunito } from "next/font/google";
import { Header } from "@/components/Header";
import { Snowfall } from "@/components/Snowfall";
import "./globals.css";

const festive = Mountains_of_Christmas({
  variable: "--font-festive",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Secret Santa 🎅",
    template: "%s · Secret Santa",
  },
  description:
    "Organiza tu intercambio navideño: crea un grupo, invita a tus amigos, compartan sus listas de deseos y hagan el sorteo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${festive.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Snowfall />
        <Header />
        <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 pt-4 pb-16">
          {children}
        </main>
        <footer className="relative z-10 pb-6 text-center text-sm text-snow/50">
          Hecho con ❤️ y mucho ponche 🎄
        </footer>
      </body>
    </html>
  );
}
