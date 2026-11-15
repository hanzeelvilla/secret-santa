@AGENTS.md

# Secret Santa

App web para organizar intercambios navideños: se crea un grupo, se invita por enlace (`/join/<código>`), cada participante sube su lista de deseos y el organizador hace el sorteo (un solo ciclo, mínimo 3 personas; cada quien solo ve su propia asignación). **Toda la interfaz y los mensajes están en español.**

## Stack
Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind 4 · Prisma 6 + PostgreSQL (Supabase) · zod 4 · react-hook-form · bcryptjs + JWT (`jose`) en cookie httpOnly. Gestor de paquetes: **npm**.

## Comandos
- `npm run dev` — servidor local en http://localhost:3000
- `npm run build` — ejecuta `prisma migrate deploy` y luego `next build`
- `npm run lint`, `npx tsc --noEmit`, `npm test` (vitest; hoy solo cubre el sorteo)
- `npm run db:migrate` — `prisma migrate dev` (crear/aplicar migraciones en desarrollo)

## Entorno y base de datos
Variables (en `.env`, que nunca se sube; plantilla en `.env.example`):
- `DATABASE_URL` — Supabase *transaction pooler* (puerto 6543, con `?pgbouncer=true`), usada por la app.
- `DIRECT_URL` — Supabase *session pooler* (puerto 5432), usada por Prisma para migraciones (la conexión directa de Supabase es solo IPv6 y falla en el build de Vercel).
- `SESSION_SECRET` — secreto aleatorio de 32+ caracteres para firmar la sesión.

Esquema en `prisma/schema.prisma`; migraciones en `prisma/migrations`. Despliegue en Vercel: un push a `main` despliega (las mismas tres variables deben existir en Vercel).

## Estructura
- `src/app` — rutas (`login`, `register`, `dashboard`, `groups/new`, `groups/[id]`, `join/[code]`).
- `src/actions` — server actions (`auth.ts`, `groups.ts`, `wishlist.ts`).
- `src/lib` — `db.ts`, `session.ts`, `validation.ts` (schemas zod compartidos cliente/servidor), `draw.ts` (+ test), `format.ts`.
- `src/components` — componentes de UI; `buttons.tsx` exporta `SubmitButton` y `Spinner`.
- `src/app/globals.css` — tema (colores `pine`, `berry`, `gold`, `cream`, `ink`) y clases reutilizables: `.card`, `.btn*`, `.label`, `.input`, `.select`, `.field-error`, `.chip`.

## Preferencias para formularios (aplican a todo formulario nuevo o que se modifique)
1. **Validación con react-hook-form + zod**, reutilizando los schemas de `src/lib/validation.ts` (los mismos que valida el servidor):
   - `<form noValidate>`, sin atributos de validación nativa que disparen tooltips del navegador (`required`, `min`, etc.).
   - `useForm` con `zodResolver(schema)`, `mode: "onTouched"` y `reValidateMode: "onChange"` (errores mientras se escribe).
   - Mensajes en español **debajo de cada input**, con `<p className="field-error">`, `aria-invalid` y `aria-describedby`.
   - Los errores que devuelve la server action se pintan con `setError` (por campo o `root`); los valores escritos no deben perderse.
   - Referencias: `src/components/AuthForm.tsx` y `src/components/GroupForm.tsx`.
2. **Spinner en el botón de envío**: usar `Spinner` de `src/components/buttons.tsx`, deshabilitar el botón mientras envía (`useTransition`) y cambiar el texto a uno de progreso ("Creando grupo…", "Entrando…").
3. **Fechas**: no usar `<input type="date">`; usar `DatePicker` (`src/components/DatePicker.tsx`). El valor es `"AAAA-MM-DD"` (sin zona horaria) y se muestra con `formatDate`.
4. **Selects**: clase `input select` (flecha propia con espacio al borde), no el estilo nativo.

Pendiente de adoptar estas convenciones: `WishlistEditor`, `DrawButton` y el botón de unirse (`SubmitButton` ya admite `spinner`).
