import Link from "next/link";

const steps = [
  {
    icon: "🎄",
    title: "Crea tu grupo",
    text: "Ponle nombre, presupuesto y fecha a tu intercambio.",
  },
  {
    icon: "💌",
    title: "Invita a todos",
    text: "Comparte un enlace y cada quien se une con su cuenta.",
  },
  {
    icon: "📝",
    title: "Listas de deseos",
    text: "Cada participante anota lo que le gustaría recibir.",
  },
  {
    icon: "🎁",
    title: "¡Sorteo!",
    text: "Cada quien abre su regalo y descubre a quién le toca.",
  },
];

export default function Home() {
  return (
    <div className="pt-8 text-center sm:pt-14">
      <p className="text-6xl sm:text-7xl" aria-hidden="true">
        🎅
      </p>
      <h1 className="mt-3 font-display text-5xl font-bold text-cream sm:text-7xl">
        Tu intercambio navideño,
        <br />
        <span className="text-gold">sin papelitos</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-snow/80">
        Organiza el Secret Santa de tu familia, amigos u oficina en minutos.
        Nadie sabe quién le regala a quién… ni siquiera el organizador.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/groups/new"
          className="btn btn-primary px-7 py-3 text-base"
        >
          Crear un intercambio
        </Link>
        <Link
          href="/dashboard"
          className="btn border-2 border-cream/40 px-7 py-3 text-base text-cream hover:bg-white/10"
        >
          Ver mis grupos
        </Link>
      </div>

      <ol className="mt-14 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="card">
            <p className="text-3xl" aria-hidden="true">
              {step.icon}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-berry">
              {index + 1}. {step.title}
            </h2>
            <p className="mt-1 text-sm text-ink/75">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
