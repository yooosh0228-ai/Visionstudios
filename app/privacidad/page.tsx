import type { Metadata } from "next"

import { LegalPage } from "@/components/studio/legal-page"

export const metadata: Metadata = {
  title: "Política de Privacidad · 402 Vision Studios",
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidad" updated="1 de octubre de 2026">
      <p>
        Este estudio es operado por 402 Vision Studios (Santiago de los
        Caballeros, República Dominicana). Aquí explicamos qué datos usamos y
        para qué.
      </p>
      <h2>Qué datos recibimos</h2>
      <ul>
        <li>
          De tu cuenta de Google: tu correo electrónico y tu nombre. No vemos
          tu contraseña de Google ni accedemos a tus archivos, contactos u otros
          datos de Google.
        </li>
        <li>
          De tu uso del estudio: tu saldo de créditos, el historial de
          generaciones (modelo, costo y estado) y los textos y archivos que
          envías para generar.
        </li>
        <li>
          Una cookie técnica para mantener tu sesión iniciada y reconocer tu
          dispositivo.
        </li>
      </ul>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Identificarte, mantener tu sesión y llevar tu saldo de créditos.</li>
        <li>
          Enviar tus textos y archivos al proveedor de generación (Higgsfield)
          para producir tus imágenes y videos.
        </li>
        <li>Resolver reclamos de cobros y evitar abusos.</li>
      </ul>
      <h2>Con quién se comparten</h2>
      <p>
        No vendemos tus datos. Se procesan en Supabase (cuentas y base de
        datos), Netlify (alojamiento) y Higgsfield (generación). Cada uno trata
        los datos según sus propias políticas.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes pedirnos ver, corregir o borrar tu cuenta y tus datos escribiendo
        a{" "}
        <a
          className="underline"
          href="https://instagram.com/402visionstudios"
          target="_blank"
          rel="noreferrer"
        >
          @402visionstudios
        </a>{" "}
        en Instagram.
      </p>
    </LegalPage>
  )
}
