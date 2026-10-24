 
import Link from "next/link"

import type { Ajustes } from "@/lib/vs/ajustes"
import { TRENDS } from "@/lib/studio/trends"
import { PILARES, PROMOS } from "@/lib/vs/pilares"
import { Deslizador } from "@/components/ui/deslizador"
import type { Oferta, Trabajo } from "@/lib/vs/types"

import { FormularioContacto } from "./contacto"
import { Ficha } from "./ficha"
import { LogoVertical } from "./iconos"
import { Barra, Pulgar } from "./interactivos"
import { ProximamenteEmergente } from "./proximamente"
import { Pedir } from "./pedir"
import { Monumento } from "./escribenos"
import { CatalogoVivo, VideoTelefono } from "./promos"
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
  const enPilares = new Set(PILARES.map((p) => p.servicio))
  const otros = ofertas.filter((o) => !enPilares.has(o.nombre))
  const opciones = [
    ...PILARES.map((p) => p.servicio),
    ...otros.map((s) => s.nombre),
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
      "Videos promocionales, influencers para marcas, apps web y marca para negocios en Santiago de los Caballeros.",
    areaServed: { "@type": "City", name: "Santiago de los Caballeros" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Santiago de los Caballeros",
      addressCountry: "DO",
    },
    sameAs: [`https://www.instagram.com/${ajustes.instagram}/`],
    ...(ajustes.correo ? { email: ajustes.correo } : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios",
      itemListElement: PILARES.map((p) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: p.nombre },
      })),
    },
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
      <a className="saltar" href="#servicios">
        Saltar a los servicios
      </a>
      <Barra instagram={ajustes.instagram} whatsapp={ajustes.whatsapp} correo={ajustes.correo} />

      {/* Ventana de oferta guardada para más adelante (no se muestra):
      <OfertaEmergente regalo={…} recarga={…} fotos={…} /> */}
      <ProximamenteEmergente
        fotos={TRENDS.slice(0, 6).map((t) => t.cover)}
        instagram={ajustes.instagram}
      />
      <main id="inicio">
        {/* PORTADA: qué hacemos y la prueba en video al lado. */}
        <section className="portada" id="inicio-portada" aria-labelledby="titulo">
          <div className="aurora" aria-hidden />
          <div className="envoltura">
            <div>
              <h1 id="titulo">
                Hacemos que tu negocio
                <br />
                <em>se vea, se venda</em>
                <br />y funcione.
              </h1>
              <p className="bajada">
                Videos promocionales, influencers para tu marca, apps web y
                marca. <span>Todo a la medida, nada de plantillas.</span>
              </p>
              <div className="acciones">
                <a className="boton vivo" href="#servicios">
                  Ver servicios
                </a>
                <Pedir className="boton">Pedir una cotización</Pedir>
              </div>
              <div className="acciones-demo">
                <Link className="boton demo" href="/demo">
                  <span aria-hidden>✨</span> Arma el demo de tu app
                </Link>
              </div>
              {ajustes.pruebaSocial.length ? (
                <p className="prueba-social">
                  {ajustes.pruebaSocial
                    .filter(([a]) => a !== "Cero")
                    .map(([a, b]) =>
                      /santiago/i.test(a + b) ? (
                        <span key="santiago" className="lugar">
                          <Monumento className="monumento" />
                          <b>Santiago, RD</b>
                        </span>
                      ) : (
                        <span key={a + b}>
                          <b>{a}</b> {b}
                        </span>
                      )
                    )}
                </p>
              ) : null}
            </div>
            <div className="abanico" aria-label="Lo que hacemos, en tres teléfonos">
              <VideoTelefono
                className="t-izq"
                src="/videos/promos/gallery-reserva.mp4"
                poster="/videos/promos/gallery-reserva.jpg"
                negocio="Gallery Barber Studio"
                titulo="Reservando un turno"
                sinSonido
              />
              <VideoTelefono
                className="t-centro"
                src="/videos/promos/yoshira-apps.mp4"
                poster="/videos/promos/yoshira-apps.jpg"
                negocio="Yoshira"
                titulo="Apps web para negocios de Santiago"
              />
              <div className="t-der">
                <CatalogoVivo />
              </div>
            </div>
          </div>
        </section>

        {/* SERVICIOS: los protagonistas. */}
        <section className="seccion" id="servicios" aria-labelledby="t-servicios">
          <div className="envoltura">
            <div className="cabeza">
              <span className="rotulo">Servicios</span>
              <h2 id="t-servicios">Escoge por dónde empezamos.</h2>
              <p>
                Pide el servicio aquí mismo. Te escribimos por WhatsApp, entendemos
                tu negocio y te cotizamos sin compromiso.
              </p>
            </div>
            <div className="pilares">
              {PILARES.map((p) => (
                <article className={`pilar pilar-${p.id}`} key={p.id}>
                  <span className="rotulo">{p.rotulo}</span>
                  <h3>{p.nombre}</h3>
                  <p>{p.gancho}</p>
                  <ul>
                    {p.puntos.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <div className="pilar-acciones">
                    <Pedir className="boton vivo" servicio={p.servicio}>
                      {p.accion}
                    </Pedir>
                    {p.ancla !== "servicios" ? (
                      <a className="enlace" href={`#${p.ancla}`}>
                        Ver ejemplos
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <details className="mas-servicios">
              <summary>Ver todos los servicios ({otros.length})</summary>
              <div className="servicios">
                {otros.map((s) => (
                  <article className="servicio" key={s.id}>
                    <h3>{s.nombre}</h3>
                    <p className="que">{s.resumen}</p>
                    <Pedir className="enlace" servicio={s.nombre}>
                      Pedir este
                    </Pedir>
                  </article>
                ))}
              </div>
            </details>
          </div>
        </section>

        {/* VIDEOS: la prueba para el servicio de video. */}
        <section className="seccion videos" id="videos" aria-labelledby="t-videos">
          <div className="envoltura">
            <div className="cabeza">
              <span className="rotulo">Videos promocionales</span>
              <h2 id="t-videos">Un colmado, un car wash y una repostería.</h2>
              <p>
                Tres negocios, tres historias contadas como habla la gente de
                aquí. Toca cualquier video para oírlo. El tuyo puede ser el
                próximo.
              </p>
            </div>
            <Deslizador etiqueta="Videos promocionales" pistaClassName="tira-videos">
              {PROMOS.map((p) => (
                <VideoTelefono key={p.id} {...p} />
              ))}
            </Deslizador>
            <Pedir className="boton vivo grande" servicio="Video y foto publicitaria">
              Quiero un video para mi negocio
            </Pedir>
          </div>
        </section>

        {/* VISION INFLUENCER */}
        <section className="seccion influencer" id="influencer" aria-labelledby="t-influencer">
          <div className="envoltura">
            <VideoTelefono
              src="/videos/promos/yoshira-presenta.mp4"
              poster="/videos/promos/yoshira-presenta.jpg"
              negocio="Yoshira"
              titulo="La cara de Vision Studios"
            />
            <div>
              <span className="rotulo">Vision Influencer</span>
              <h2 id="t-influencer">Ella es Yoshira. Tu negocio puede tener la suya.</h2>
              <p className="lead">
                Diseñamos un personaje solo para tu marca: su cara, su voz, su
                forma de hablar. Explica tus servicios, presenta tus ofertas y
                sale en tus redes cada semana, siempre igualita.
              </p>
              <ol className="mini-pasos">
                <li><b>Lo creamos.</b> Rostro, estilo y personalidad según tu marca.</li>
                <li><b>Le damos voz.</b> Habla como tus clientes, en dominicano.</li>
                <li><b>Lo ponemos a trabajar.</b> Videos para feed, historias y TikTok.</li>
              </ol>
              <Pedir className="boton vivo" servicio="Vision Influencer">
                Quiero mi influencer
              </Pedir>
            </div>
          </div>
        </section>

        {/* APPS: el catálogo de lo que ya está hecho. */}
        <section className="seccion vitrina" id="trabajo" aria-labelledby="t-trabajo">
          <div className="envoltura">
            <div className="cabeza">
              <span className="rotulo">Apps web a la medida</span>
              <h2 id="t-trabajo">Apps que ya están trabajando.</h2>
              <p>
                Mientras otros revenden la misma plantilla con otro logo,
                nosotros empezamos por tu negocio. Toca cualquier pieza para ver
                qué hicimos y cómo funciona.
              </p>
            </div>
            <Vitrina trabajos={trabajos} espacioLibre={ajustes.espacioLibre} />
          </div>
        </section>

        {/* PROCESO */}
        <section className="seccion" id="proceso" aria-labelledby="t-proceso">
          <div className="envoltura">
            <div className="cabeza">
              <span className="rotulo">Cómo trabajamos</span>
              <h2 id="t-proceso">Enfocar, encuadrar, disparar, revelar.</h2>
              <p>
                Trabajamos con depósito y a fecha. Cada cliente tiene su área
                privada donde ve en qué va su proyecto y aprueba las entregas.
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
        <section className="seccion contacto" id="contacto" aria-labelledby="t-contacto">
          <div className="envoltura">
            <div>
              <span className="rotulo">Pedir un servicio</span>
              <h2 id="t-contacto">Cuéntanos tu negocio.</h2>
              <p className="lead">
                Escoge el servicio, déjanos tu WhatsApp y en un minuto nos llega
                todo. Primero entendemos, después cotizamos, sin compromiso.
              </p>
              <div className="canales">
                {canales.map(([h, t, s]) => (
                  <a className="canal" href={h} key={t} target="_blank" rel="noopener">
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
              <a href="#servicios">Servicios</a>
              <a href="#videos">Videos</a>
              <a href="#influencer">Influencer</a>
              <a href="#trabajo">Apps</a>
              <a href="#contacto">Contacto</a>
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

      <Pulgar instagram={ajustes.instagram} whatsapp={ajustes.whatsapp} correo={ajustes.correo} />
      <Ficha trabajos={trabajos} />
    </div>
  )
}
