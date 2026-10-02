# 402 Vision Studios · Studio

Estudio de generación de 402 Vision Studios. Escribe un brief o elige un preset
de producción, escoge un modelo y genera imágenes o video con la
[API de Higgsfield](https://api.higgsfield.ai). Los clientes entran con un clic
(Google), pagan con créditos que recarga el dueño, y el dueño genera gratis.

Hecho sobre la plantilla Higgsfield Studio (`higgsfield-ai/app-templates/studio`)
con Next.js 16, Tailwind v4 y shadcn/Base UI. Lee `AGENTS.md`,
`layouts/AGENTS.md` y `components/studio/AGENTS.md` antes de cambiar la app.

## Cómo funciona el cobro

- **Una sola llave de Higgsfield**, la del estudio (`HF_API_KEY`), vive solo en
  el servidor. Los clientes nunca ven ni pegan una llave.
- **Entrada**: botón "Continuar con Google" (Supabase Auth). La cuenta se crea
  sola al primer ingreso, con saldo 0.
- **Créditos**: un crédito vale US$0.01 de lo que paga el cliente. Cada
  modelo tiene un precio en la misma unidad en que Higgsfield le cobra al
  estudio: **por segundo** de video (se multiplica por la duración elegida),
  **por imagen** (se multiplica por la cantidad) o **por generación** (DoP y los
  modelos sin duración elegible). El cobro se hace **antes** de enviar a
  Higgsfield, con una función de base de datos atómica y repetible: un doble
  clic o una pestaña repetida nunca cobran dos veces.
- **Reembolsos automáticos**: si Higgsfield rechaza el envío, o la generación
  termina `failed`, `nsfw` o `canceled`, los créditos se devuelven (una sola
  vez). Al volver al estudio se liquida lo que quedó en cola mientras la
  pestaña estaba cerrada.
- **Envío sin confirmar** (timeout): el cobro se queda y aparece en
  `/admin > Por revisar`, porque la generación pudo haberse hecho. Revisas tu
  historial en Higgsfield y devuelves los créditos si no.
- **Dueño**: los correos de `OWNER_EMAILS` (con el correo confirmado) generan
  sin gastar créditos y entran a `/admin`.
- **Panel `/admin`**: recargar o descontar créditos a un cliente, fijar el
  precio de cada modelo, ver los últimos movimientos y los cobros por revisar.
- **Un modelo sin precio no se puede usar por los clientes.** Pon el precio de
  la configuración más cara de cada modelo (resolución, audio) para no cobrar
  de menos; la duración ya se multiplica sola. Los modelos de editar video y de
  control de movimiento cobran Higgsfield según el largo del video de origen,
  que el estudio no conoce: déjalos sin precio o ponles un precio por
  generación que cubra el peor caso.

## Variables de entorno

Ver `.env.example`. Las de servidor (`HF_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`OWNER_EMAILS`) nunca deben llevar el prefijo `NEXT_PUBLIC_`.

## Correrlo en tu computadora

```sh
pnpm install
pnpm dev            # http://localhost:3000
```

Llena en `.env.local` `HF_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `OWNER_EMAILS`.

## Base de datos (Supabase, proyecto `402-studio`)

Tablas: `accounts` (saldo), `model_prices`, `generations`, `ledger`
(movimientos). Todas con RLS: un cliente solo lee lo suyo y **no puede
escribir nada**. Todo cobro, reembolso y recarga pasa por funciones que solo
ejecuta la llave de servicio (`begin_generation`, `refund_generation`,
`admin_adjust`, ...).

## Publicarlo en studio.402visionstudios.com

1. **Google**: en Google Cloud Console crea un "ID de cliente OAuth" de tipo
   web. URI de redirección autorizada:
   `https://buymvfjdbjlgmkdawkft.supabase.co/auth/v1/callback`.
2. **Supabase > Authentication > Providers > Google**: activa y pega el ID y el
   secreto. En **URL Configuration**: Site URL
   `https://studio.402visionstudios.com` y en Redirect URLs agrega
   `https://studio.402visionstudios.com/**` y `http://localhost:3000/**`.
3. **Netlify**: conecta este repo, build `pnpm build` (ya está en
   `netlify.toml`) y carga las variables de `.env.example`.
4. **Dominio**: en Netlify agrega `studio.402visionstudios.com`; en el DNS de
   Squarespace crea un CNAME `studio` hacia el dominio `.netlify.app` que te
   indique Netlify.

## Cómo se genera

- `generation/actions.ts`: server actions. Valida el plano contra el esquema del
  modelo, cobra, y envía a Higgsfield una sola vez (un POST nunca se
  reintenta). Devuelve resultados tipados (`generation/errors.ts`).
- `generation/billing.ts`: reglas de precio y saldo, puras y con pruebas.
- `generation/poll.ts`: una consulta agrupada por intervalo para todas las
  generaciones en vuelo; solo se consultan las del propio usuario.
- `app/api/upload/route.ts`: URL firmada para subir referencias (requiere sesión).

El historial y los proyectos se guardan en el navegador (IndexedDB). Si entra
otra cuenta en el mismo navegador, se borra el historial local.

## Revisiones

```sh
pnpm test        # pruebas unitarias (cobro, credenciales, subidas, guardas)
pnpm typecheck
pnpm lint
pnpm build
```
