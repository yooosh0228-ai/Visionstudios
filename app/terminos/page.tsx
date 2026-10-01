import type { Metadata } from "next"

import { LegalPage } from "@/components/studio/legal-page"

export const metadata: Metadata = {
  title: "Condiciones del Servicio · 402 Vision Studios",
}

export default function TermsPage() {
  return (
    <LegalPage title="Condiciones del Servicio" updated="1 de octubre de 2026">
      <p>
        Al entrar con tu cuenta de Google y usar este estudio aceptas estas
        condiciones.
      </p>
      <h2>Créditos</h2>
      <ul>
        <li>
          Los créditos se recargan por adelantado con 402 Vision Studios y se
          descuentan al enviar cada generación, según el precio del modelo.
        </li>
        <li>
          Si una generación falla, es rechazada o se cancela antes de
          completarse, los créditos se devuelven automáticamente.
        </li>
        <li>
          Si una generación queda sin confirmar, la revisamos y, si
          corresponde, te devolvemos los créditos.
        </li>
        <li>Los créditos no son dinero y no se canjean por efectivo.</li>
      </ul>
      <h2>Uso permitido</h2>
      <ul>
        <li>
          Eres responsable de lo que escribes y subes. No uses el estudio para
          contenido ilegal, que viole derechos de terceros o que el proveedor
          de generación prohíba.
        </li>
        <li>
          Puedes usar comercialmente lo que generas, salvo restricciones del
          proveedor del modelo.
        </li>
      </ul>
      <h2>Disponibilidad</h2>
      <p>
        El servicio depende de terceros (Higgsfield, Supabase y Netlify) y se
        ofrece tal cual. Podemos suspender cuentas que abusen del servicio.
      </p>
      <h2>Contacto</h2>
      <p>
        Escríbenos a{" "}
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
