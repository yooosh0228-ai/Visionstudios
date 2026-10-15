/* eslint-disable @next/next/no-img-element */
import Link from "next/link"

import type { Ajustes } from "@/lib/vs/ajustes"
import { enlaceChat } from "@/lib/vs/ajustes"
import { TRENDS } from "@/lib/studio/trends"
import { formatoRD } from "@/lib/vs/cuentas"
import type { Oferta, Trabajo } from "@/lib/vs/types"

import { FormularioContacto } from "./contacto"
import { Ficha } from "./ficha"
import { Icono, LogoVertical } from "./iconos"
import type { NombreIcono } from "./iconos"
import { Barra, Pulgar, Visor } from "./interactivos"
import { Pedir } from "./pedir"
import { Vitrina } from "./vitrina"

/**
 * Detecta el dispositivo antes de pintar, para que la página llegue ya ajustada.
 * Escribe en <html>: data-dispositivo (telefono | tablet | escritorio),
 * data-tactil, data-so (ios | android | otro) y data-datos (ahorro | normal).
 */
const DETECTAR = `(function(){try{var d=document.documentElement,u=navigator.userAgent||"";var t=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0&&!matchMedia("(pointer:fine)").matches;var i=/iPad|iPhone|iPod/.test(u)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);var a=/Android/i.test(u);var l=Math.min(screen.width||0,screen.height||0);d.dataset.dispositivo=!t?"escritorio":(l<600?"telefono":"tablet");d.dataset.tactil=t?"si":"no";d.dataset.so=i?"ios":a?"android":"otro";var c=navigator.connection;d.dataset.datos=c&&(c.saveData||/2g/.test(c.effectiveType||""))?"ahorro":"normal"}catch(e){}})();`

export function Sitio({
  ajustes,
  trabajos,
  ofertas,
}: {
  ajustes: Ajustes
  trabajos: Trabajo[]
  ofertas: Oferta[]
}) {
  const radiografia = ofertas.find((o) => o.id === ajustes.radiografia.oferta)
  const servicios = ofertas.filter((o) => o.id !== ajustes.radiografia.oferta)
  const chat = enlaceChat(ajustes)
  const opciones = [
    ...servicios.map((s) => s.nombre),
    ...(radiografia ? [radiografia.nombre] : []),
    "No sé, ayúdame a decidir",
  ]
  const canales: [string, string, string][] = []
  if (ajustes.whatsapp)
    canales.push([
      `https://wa.me/${ajustes.whatsapp}`,
      "WhatsApp",
      "Escríbenos directo",
    ])
  canales.push([
    `https://www.instagram.com/${ajustes.instagram}/`,
    "Instagram",
    `@${ajustes.instagram}`,
  ])
  if (ajustes.correo)
    canales.push([`mailto:${ajustes.correo}`, "Correo", ajustes.correo])

  const datosNegocio = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: ajustes.nombre,
    url: "https://402visionstudios.com/",
    image: "https://402visionstudios.com/og.jpg",
    description:
      "Estudio de diseño, software y video para negocios en Santiago de los Caballeros.",
    areaServed: { "@type": "City", name: "Santiago de los Caballeros" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Santiago de los Caballeros",
      addressCountry: "DO",
    },
    sameAs: [`https://www.instagram.com/${ajustes.instagram}/`],
    ...(radiografia?.precioPublico
      ? {
          makesOffer: {
            "@type": "Offer",
            name: radiografia.nombre,
            price: String(radiografia.precioPublico),
            priceCurrency: "DOP",
          },
        }
      : {}),
  }

  return (
    <div className="vs">
      <script dangerouslySetInnerHTML={{ __html: DETECTAR }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datosNegocio).replace(/</g, "\\u003c"),
        }}
      />
      <a className="saltar" href="#trabajo">
        Saltar al trabajo
      </a>
      <Barra />

      <main id="inicio">
        {/* PORTADA: mostrar primero. */}
        <section
          className="portada"
          id="inicio-portada"
          aria-labelledby="titulo"
        >
          <div className="envoltura">
            <div>
              <h1 id="titulo">
                Tu negocio,
                <br />
                en foco.
              </h1>
              <p className="bajada">
                Diseñamos y programamos apps, páginas, marcas y video para
                negocios de Santiago.{" "}
                <span>Todo hecho a la medida, desde cero.</span>
              </p>
              <div className="acciones">
                <a className="boton claro" href="#trabajo">
                  Ver el trabajo
                </a>
                <Pedir className="boton">Cuéntanos tu negocio</Pedir>
              </div>
              {ajustes.pruebaSocial.length ? (
                <p className="prueba-social">
                  {ajustes.pruebaSocial.map(([a, b]) => (
                    <span key={a + b}>
                      <b>{a}</b> {b}
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
            <Visor trabajos={trabajos} portada={ajustes.portada} />
          </div>
        </section>

        {/* PRUÉBALO: la puerta al Estudio con los trends del momento. */}
        <section
          className="seccion pruebalo"
          id="pruebalo"
          aria-labelledby="t-pruebalo"
        >
          <div className="envoltura">
            <div className="cabeza">
              <h2 id="t-pruebalo">Tu foto, en el trend del momento.</h2>
              <p>
                Sube una selfie, escoge el estilo y en segundos la tienes lista
                para tus estados. También le das vida en video.
                {ajustes.bienvenida.activo && ajustes.bienvenida.creditos > 0
                  ? " Entra con tu cuenta de Google y te regalamos créditos para probar."
                  : ""}
              </p>
            </div>
            <ul className="trends" role="list">
              {TRENDS.filter((t) => t.before).slice(0, 8).map((t) => (
                <li key={t.id}>
                  <Link href="/estudio" className="trend">
                    {t.coverVideo ? (
                      <video src={t.coverVideo} poster={t.cover} muted loop autoPlay playsInline preload="metadata" aria-hidden />
                    ) : (
                      <img src={t.cover} alt="" loading="lazy" decoding="async" />
                    )}
                    {t.before ? (
                      <img
                        className="antes"
                        src={t.before}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <span>
                      <b>{t.title}</b>
                      {t.kind === "video" ? <em>Video</em> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="boton claro grande" href="/estudio">
              {ajustes.bienvenida.activo && ajustes.bienvenida.creditos > 0
                ? "Pruébalo gratis"
                : "Entrar a Visiopus"}
            </Link>
          </div>
        </section>

        {/* VITRINA: el catálogo de lo que ya está hecho. */}
        <section
          className="seccion vitrina"
          id="trabajo"
          aria-labelledby="t-trabajo"
        >
          <div className="envoltura">
            <div className="cabeza">
              <h2 id="t-trabajo">Lo que ya está hecho.</h2>
              <p>
                Trabajo real, en uso. Toca cualquier pieza para ver qué hicimos
                y cómo funciona.
              </p>
            </div>
            <Vitrina trabajos={trabajos} espacioLibre={ajustes.espacioLibre} />
          </div>
        </section>

        {/* HECHO A LA MEDIDA */}
        <section
          className="seccion medida"
          id="medida"
          aria-labelledby="t-medida"
        >
          <div className="envoltura">
            <div>
              <h2 id="t-medida">Hecho para tu negocio. No para cualquiera.</h2>
              <p className="lead">
                La mayoría de las páginas y apps que se venden por aquí son
                maquetas compradas y revendidas con otro logo encima.{" "}
                <b>Aquí no.</b> Empezamos por tu negocio: cómo vendes, cómo
                atiendes y qué te está costando clientes. De ahí diseñamos y
                programamos todo desde cero. <b>Trabajo 100% personalizado.</b>
              </p>
            </div>
            <div className="compromisos">
              {ajustes.compromisos.map(([k, t, d]) => {
                const I = Icono[k as NombreIcono] ?? Icono.check
                return (
                  <div className="compromiso" key={k + t}>
                    <I />
                    <div>
                      <h3>{t}</h3>
                      <p>{d}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* SERVICIOS: sin precios; cada uno se cotiza a la medida. */}
        <section
          className="seccion"
          id="servicios"
          aria-labelledby="t-servicios"
        >
          <div className="envoltura">
            <div className="cabeza">
              <h2 id="t-servicios">Lo que hacemos.</h2>
              <p>
                Cada trabajo se cotiza según tu negocio, después de entenderlo.
                Si no sabes por dónde empezar, empieza por la radiografía.
              </p>
            </div>
            <div className="servicios">
              {servicios.map((s) => (
                <article className="servicio" key={s.id}>
                  <h3>{s.nombre}</h3>
                  <p className="que">{s.resumen}</p>
                  {s.incluye.length ? (
                    <ul>
                      {s.incluye.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  ) : null}
                  <Pedir className="enlace" servicio={s.nombre}>
                    Me interesa
                  </Pedir>
                </article>
              ))}
            </div>
            <div className="nota-estudio">
              <p>
                <b>¿Prefieres crear tú mismo?</b> En Visiopus haces
                fotos y videos para tu negocio desde el celular, con trends de
                un toque, y pagas solo lo que usas.
              </p>
              <Link className="boton" href="/estudio">
                <Icono.afuera />
                Entrar al Estudio
              </Link>
            </div>
          </div>
        </section>

        {/* RADIOGRAFÍA: la única tarifa publicada. */}
        {radiografia ? (
          <section
            className="seccion radiografia"
            id="radiografia"
            aria-labelledby="t-radio"
          >
            <div className="envoltura">
              <div className="placa">
                <div>
                  <span className="etiqueta">
                    <i />
                    <span>{ajustes.radiografia.etiqueta}</span>
                  </span>
                  <h2 id="t-radio">{radiografia.nombre}.</h2>
                  <p className="lead">{ajustes.radiografia.lead}</p>
                  <ul>
                    {radiografia.incluye.map((i) => (
                      <li key={i}>
                        <Icono.check />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="precio">
                  {radiografia.precioPublico ? (
                    <p className="cifra">
                      <small>RD$</small>
                      {formatoRD(radiografia.precioPublico).replace("RD$", "")}
                    </p>
                  ) : null}
                  <p className="condicion">{ajustes.radiografia.condicion}</p>
                  <Pedir className="boton vivo" servicio={radiografia.nombre}>
                    Pedir mi radiografía
                  </Pedir>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* PROCESO */}
        <section className="seccion" id="proceso" aria-labelledby="t-proceso">
          <div className="envoltura">
            <div className="cabeza">
              <h2 id="t-proceso">
                Como una foto: enfocar, encuadrar, disparar, revelar.
              </h2>
              <p>
                Trabajamos con depósito y a fecha. Cada cliente tiene su área
                privada donde ve en qué va su proyecto, aprueba las entregas y
                lleva sus pagos al día.
              </p>
            </div>
            <ol className="pasos">
              {ajustes.pasos.map(([t, d], i) => (
                <li className="paso" key={t}>
                  <span className="num">Paso {i + 1}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CONTACTO: llega al panel como prospecto nuevo. */}
        <section
          className="seccion contacto"
          id="contacto"
          aria-labelledby="t-contacto"
        >
          <div className="envoltura">
            <div>
              <h2 id="t-contacto">Cuéntanos tu negocio.</h2>
              <p className="lead">
                Un minuto y nos llega todo. Te contestamos por WhatsApp. Primero
                entendemos, después cotizamos, sin compromiso.
              </p>
              <div className="canales">
                {canales.map(([h, t, s]) => (
                  <a
                    className="canal"
                    href={h}
                    key={t}
                    target="_blank"
                    rel="noopener"
                  >
                    <b>{t}</b>
                    <span>{s}</span>
                  </a>
                ))}
                <Link className="canal" href="/entrar">
                  <b>¿Ya eres cliente?</b>
                  <span>Entra a tu cuenta</span>
                </Link>
              </div>
            </div>
            <div>
              <FormularioContacto
                opciones={opciones}
                whatsapp={ajustes.whatsapp}
                instagram={ajustes.instagram}
              />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="envoltura">
          <div style={{ display: "grid", gap: 24 }}>
            <LogoVertical className="vertical" />
            <nav aria-label="Pie">
              <a href="#trabajo">Trabajo</a>
              <a href="#servicios">Servicios</a>
              <a href="#radiografia">Radiografía</a>
              <a href="#contacto">Contacto</a>
              <Link href="/estudio">Estudio</Link>
              <Link href="/entrar">Mi cuenta</Link>
            </nav>
          </div>
          <div className="datos">
            <a
              href={`https://www.instagram.com/${ajustes.instagram}/`}
              target="_blank"
              rel="noopener"
            >
              @{ajustes.instagram}
            </a>
            {ajustes.correo ? (
              <a href={`mailto:${ajustes.correo}`}>{ajustes.correo}</a>
            ) : null}
            <span>Santiago de los Caballeros, República Dominicana</span>
            <span>
              <Link href="/privacidad">Privacidad</Link> ·{" "}
              <Link href="/terminos">Condiciones</Link>
            </span>
            <span>
              © {new Date().getFullYear()} {ajustes.nombre}
            </span>
          </div>
        </div>
      </footer>

      <Pulgar chat={chat} />
      <Ficha trabajos={trabajos} />
    </div>
  )
}
