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
- `RESEND_API_KEY`, `EMAIL_FROM` (remitente de un dominio verificado en Resend) y `APP_URL` (URL pública para los enlaces de los correos). Sin las dos primeras, en desarrollo los correos se imprimen en la consola del servidor.

Esquema en `prisma/schema.prisma`; migraciones en `prisma/migrations`. Despliegue en Vercel: un push a `main` despliega (las mismas variables deben existir en Vercel).

## Estructura
- `src/app` — rutas (`login`, `register`, `dashboard`, `groups/new`, `groups/[id]`, `groups/[id]/edit`, `join/[code]`, `profile`, `verify-email`, `forgot-password`, `reset-password`).
- `src/actions` — server actions (`auth.ts` incluye `updateProfile`, `groups.ts`, `wishlist.ts`).
- `src/lib` — `db.ts`, `session.ts`, `validation.ts` (schemas zod compartidos cliente/servidor), `draw.ts` (+ test), `format.ts`, `tokens.ts` (tokens y esperas, con test), `email.ts` (Resend), `email-templates.ts`, `email-tokens.ts` (tokens de correo genéricos), `verification.ts`, `password-reset.ts`, `group-changes.ts` (+test), `group-list.ts` (+test: búsqueda, orden, filtros y paginación de `/dashboard`; el estado vive en `searchParams`, se resuelve en el servidor con Prisma), `group-emails.ts`, `session-validity.ts` (+test).
- `src/components` — componentes de UI; `buttons.tsx` exporta `SubmitButton` y `Spinner`.
- `src/app/globals.css` — tema (colores `pine`, `berry`, `gold`, `cream`, `ink`) y clases reutilizables: `.card`, `.btn*`, `.label`, `.input`, `.select`, `.field-error`, `.chip`.

## Reglas de grupos
- El organizador edita el grupo (`updateGroup`), quita participantes (`removeMember`) y lo elimina (`deleteGroup`); los demás solo pueden salirse (`leaveGroup`).
- Tras el sorteo nadie puede salirse ni ser quitado (rompería la cadena de regalos); el organizador puede rehacer el sorteo.
- `/join/<código>` es pública: quien no tiene sesión ve la tarjeta de la invitación con botones para iniciar sesión o registrarse (vuelve ahí con `?next=`); unirse (`joinGroup`) sí exige sesión.
- **Correo confirmado obligatorio (bloqueo total):** `requireUser` redirige a `/verify-email` si `emailVerifiedAt` es null; solo `getCurrentUser` deja pasar a cuentas sin confirmar. El registro envía el correo con un token de 24 h (solo se guarda su hash en `EmailToken`), `/verify-email?token=` pide un clic para confirmar (los escáneres de correo abren los enlaces) y el reenvío espera 60 s y se limita a 5 por hora.
- **Correos (Resend):** `sendEmail` en `src/lib/email.ts`; plantillas HTML con estilos en línea en `src/lib/email-templates.ts`. **Avisos del grupo:** `updateGroup` envía un correo a los participantes (menos al organizador) solo si algo cambió de verdad (`diffGroup` en `group-changes.ts`), y `runDraw` avisa a todos de que el sorteo se hizo o se rehízo. Se envían con `after()` de `next/server` (después de responder) mediante `sendEmails` (lotes de Resend) y un fallo de envío solo se registra. **Los correos del sorteo nunca dicen a quién le toca a nadie.**
- **Contraseña:** se cambia desde `/profile` (pide la actual) o con "¿Olvidaste tu contraseña?" (`/forgot-password` → correo con token `PASSWORD_RESET` de 1 h → `/reset-password`). `requestPasswordReset` responde siempre igual para no revelar qué correos existen. Al cambiarla se guarda `User.passwordChangedAt` y `getCurrentUser` descarta las sesiones (JWT) anteriores a esa fecha; quien la cambia desde el perfil recibe una sesión nueva.
- Los permisos se validan siempre en el servidor (`src/actions/groups.ts`), no solo ocultando botones. En Prisma, para vaciar un campo opcional hay que enviar `null` (con `undefined` no se toca).

## Preferencias para formularios (aplican a todo formulario nuevo o que se modifique)
1. **Validación con react-hook-form + zod**, reutilizando los schemas de `src/lib/validation.ts` (los mismos que valida el servidor):
   - `<form noValidate>`, sin atributos de validación nativa que disparen tooltips del navegador (`required`, `min`, etc.).
   - `useForm` con `zodResolver(schema)`, `mode: "onTouched"` y `reValidateMode: "onChange"` (errores mientras se escribe).
   - Mensajes en español **debajo de cada input**, con `<p className="field-error">`, `aria-invalid` y `aria-describedby`.
   - Los errores que devuelve la server action se pintan con `setError` (por campo o `root`); los valores escritos no deben perderse.
   - Referencias: `src/components/AuthForm.tsx` y `src/components/GroupForm.tsx`.
2. **Spinner en el botón de envío**: usar `Spinner` de `src/components/buttons.tsx`, deshabilitar el botón mientras envía (`useTransition`) y cambiar el texto a uno de progreso ("Creando grupo…", "Entrando…").
3. **Fechas**: no usar `<input type="date">`; usar `DatePicker` (`src/components/DatePicker.tsx`). El valor es `"AAAA-MM-DD"` (sin zona horaria) y se muestra con `formatDate`. **Hora**: tampoco `<input type="time">`; usar `TimePicker` (`src/components/TimePicker.tsx`). El valor es `"HH:mm"` en 24 h (sin zona horaria), se guarda en `Group.exchangeTime`, solo existe junto a una fecha y se muestra con `formatTime`/`formatDateTime` (12 h, "6:30 p. m.").
4. **Selects**: clase `input select` (flecha propia con espacio al borde), no el estilo nativo.

Pendiente de adoptar estas convenciones: `WishlistEditor`, `DrawButton` y el botón de unirse (`SubmitButton` ya admite `spinner`).
