import Link from "next/link"
import {
  ExternalLink,
  Film,
  Image as ImageIcon,
  Smartphone,
} from "lucide-react"

import { EditarRegistro } from "@/components/panel/registro"
import { Encabezado, Insignia, Tarjeta } from "@/components/panel/ui"
import { aColumnas } from "@/lib/vs/campos"
import { formatoRD } from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { CATEGORIA_LABEL, TIPO_TRABAJO_LABEL } from "@/lib/vs/types"

export const metadata = { title: "Catálogo" }

export default async function Catalogo() {
  const p = await panelDelDueno()
  const trabajos = [...p.trabajos].sort((a, b) => a.orden - b.orden)
  const ofertas = [...p.ofertas].sort((a, b) => a.orden - b.orden)

  return (
    <>
      <Encabezado
        titulo="Catálogo"
        texto="Lo que se muestra en la portada: los trabajos de la vitrina y los servicios. Los cambios salen en la página al guardar."
        acciones={
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"
          >
            <ExternalLink className="size-4" /> Ver la portada
          </Link>
        }
      />

      <section className="flex flex-col gap-3" aria-labelledby="t-trabajos">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="t-trabajos" className="text-lg font-semibold">
            Trabajos de la vitrina
          </h2>
          <EditarRegistro entidad="trabajo" variante="primario">
            Agregar trabajo
          </EditarRegistro>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {trabajos.map((t) => {
            const Icono = t.video
              ? Film
              : t.tipo === "marca"
                ? ImageIcon
                : Smartphone
            return (
              <Tarjeta key={t.id} className="flex gap-3">
                <div className="relative flex aspect-[9/16] w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {t.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.poster}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <Icono className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="truncate text-xs text-muted-foreground">
                    {t.cliente}
                  </p>
                  <p className="leading-snug font-medium">{t.obra}</p>
                  <div className="flex flex-wrap gap-1">
                    <Insignia>{TIPO_TRABAJO_LABEL[t.tipo]}</Insignia>
                    {t.destacado ? (
                      <Insignia tono="bien">Destacado</Insignia>
                    ) : null}
                    {t.enDestacado ? (
                      <Insignia tono="info">Dentro del destacado</Insignia>
                    ) : null}
                    {!t.visible ? (
                      <Insignia tono="atencion">Escondido</Insignia>
                    ) : null}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1">
                    <EditarRegistro
                      entidad="trabajo"
                      id={t.id}
                      valores={aColumnas(t)}
                      tam="chico"
                      variante="suave"
                    >
                      Editar
                    </EditarRegistro>
                    <Link
                      href={`/#${t.id}`}
                      target="_blank"
                      className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Ver ficha
                    </Link>
                  </div>
                </div>
              </Tarjeta>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="t-ofertas">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="t-ofertas" className="text-lg font-semibold">
              Servicios
            </h2>
            <p className="text-sm text-muted-foreground">
              Los públicos salen en «Lo que hacemos». Los demás se usan por
              dentro en prospectos, proyectos y cobros. Solo la radiografía
              muestra precio.
            </p>
          </div>
          <EditarRegistro entidad="oferta" variante="primario">
            Agregar servicio
          </EditarRegistro>
        </div>
        <Tarjeta className="p-0">
          <ul className="flex flex-col divide-y divide-border">
            {ofertas.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{o.nombre}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {o.resumen || "Sin descripción"}
                  </p>
                </div>
                <span className="flex flex-wrap gap-1">
                  <Insignia>{CATEGORIA_LABEL[o.categoria]}</Insignia>
                  {o.publico ? (
                    <Insignia tono="bien">En la portada</Insignia>
                  ) : (
                    <Insignia>Interno</Insignia>
                  )}
                  {o.precioPublico ? (
                    <Insignia tono="info">
                      {formatoRD(o.precioPublico)}
                    </Insignia>
                  ) : null}
                  {o.precioReferencia ? (
                    <Insignia>Ref. {formatoRD(o.precioReferencia)}</Insignia>
                  ) : null}
                  {!o.activo ? (
                    <Insignia tono="atencion">Inactivo</Insignia>
                  ) : null}
                </span>
                <EditarRegistro
                  entidad="oferta"
                  id={o.id}
                  valores={aColumnas(o)}
                  tam="chico"
                  variante="fantasma"
                >
                  Editar
                </EditarRegistro>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </section>
    </>
  )
}
