import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Encabezado, Insignia, Tarjeta, Vacio } from "@/components/panel/ui"
import { formatoRD, hoyRD } from "@/lib/vs/cuentas"
import { panelDelDueno } from "@/lib/vs/panel-cache"
import { radiografiaDe } from "@/lib/vs/radiografia"
import { cobrosConCuenta } from "@/lib/vs/resumen"
import { ETAPA_LABEL } from "@/lib/vs/types"

export const metadata = { title: "Clientes" }

export default async function Clientes() {
  const p = await panelDelDueno()
  const cobros = cobrosConCuenta(p, hoyRD())
  return (
    <>
      <Encabezado
        titulo="Clientes"
        texto="Cada cliente tiene una fuente de verdad: negocio, oferta, audiencia, objetivo, pruebas y decisiones. Su correo de Google le abre su área de cliente."
        acciones={
          <Link
            href="/admin/clientes/nuevo"
            className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/85"
          >
            Nuevo cliente (Master Intake)
          </Link>
        }
      />
      {p.clientes.length === 0 ? (
        <Vacio
          titulo="Todavía no hay clientes."
          texto="El Master Intake crea el primero y le abre su diagnóstico sin duplicar información."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {p.clientes.map((c) => {
            const proyectos = p.proyectos.filter(
              (x) => x.clienteId === c.id && !x.cerrado
            )
            const saldo = cobros
              .filter((x) => x.clienteId === c.id)
              .reduce((a, x) => a + x.cuenta.saldo, 0)
            const rx = radiografiaDe(c)
            return (
              <Link
                key={c.id}
                href={`/admin/clientes/${c.id}`}
                className="group"
              >
                <Tarjeta className="flex h-full flex-col gap-3 transition-colors group-hover:border-foreground/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">
                        {c.nombre}
                      </h2>
                      <p className="truncate text-sm text-muted-foreground">
                        {[c.contacto, c.sector].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {c.estado !== "activo" ? (
                      <Insignia>
                        {c.estado === "pausa" ? "En pausa" : "Cerrado"}
                      </Insignia>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {proyectos.length ? (
                      proyectos.map((x) => (
                        <Insignia key={x.id} tono="info">
                          {ETAPA_LABEL[x.etapa]}
                        </Insignia>
                      ))
                    ) : (
                      <Insignia>Sin proyecto abierto</Insignia>
                    )}
                    {saldo > 0 ? (
                      <Insignia tono="atencion">
                        Debe {formatoRD(saldo)}
                      </Insignia>
                    ) : null}
                    {c.email ? (
                      <Insignia tono="bien">Tiene acceso</Insignia>
                    ) : (
                      <Insignia>Sin acceso</Insignia>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
                    <span>Información {rx.completo}% completa</span>
                    <ArrowRight className="size-4" />
                  </div>
                </Tarjeta>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
