# 🎅 Secret Santa

Web para organizar intercambios navideños: crea un grupo, invita por enlace, cada quien sube su lista de deseos y se hace el sorteo.

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind 4 · Prisma + PostgreSQL.

## Cómo correrlo

```bash
npm install
cp .env.example .env      # pon tu DATABASE_URL de Postgres y un SESSION_SECRET aleatorio de 32+ caracteres
npx prisma migrate dev    # crea las tablas en tu base de datos
npm run dev               # http://localhost:3000
```

Otros comandos: `npm test` (tests del sorteo), `npm run lint`, `npm run build`.

## Cómo funciona

- **Cuentas:** email + contraseña (bcrypt). La sesión es un JWT firmado en una cookie httpOnly (`src/lib/session.ts`).
- **Grupos:** quien lo crea es el organizador. Tiene nombre, descripción, presupuesto y fecha opcionales.
- **Invitaciones:** enlace `/join/<código>`. Se cierran al hacer el sorteo.
- **Listas de deseos:** una por participante y por grupo; las ven todos los miembros del grupo.
- **Sorteo** (`src/lib/draw.ts`): baraja a los participantes y los asigna en un solo ciclo, así nadie se regala a sí mismo y no hay subgrupos cerrados. Mínimo 3 personas.
- **Privacidad:** cada quien solo puede consultar su propia asignación; el organizador tampoco ve las demás.

## Desplegar en Vercel

1. Importa el repo en Vercel y añade una base Postgres (Storage → Neon/Prisma Postgres, o cualquier Postgres externo).
2. Define las variables de entorno `DATABASE_URL` y `SESSION_SECRET`.
3. `npm run build` ejecuta `prisma migrate deploy` antes de compilar, así que las migraciones se aplican en cada deploy.
