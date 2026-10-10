"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AppWindow,
  Briefcase,
  ExternalLink,
  FolderKanban,
  Gauge,
  Image as ImageIcon,
  LayoutGrid,
  Menu,
  MessagesSquare,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { BrandMark } from "@/components/studio/brand-mark"
import { cn } from "@/lib/utils"

export type Contadores = {
  prospectos: number
  cobros: number
  proyectos: number
}

const NAV: {
  href: string
  etiqueta: string
  icono: LucideIcon
  contador?: keyof Contadores
}[] = [
  { href: "/admin", etiqueta: "Resumen", icono: Gauge },
  {
    href: "/admin/prospectos",
    etiqueta: "Prospectos",
    icono: MessagesSquare,
    contador: "prospectos",
  },
  { href: "/admin/clientes", etiqueta: "Clientes", icono: Users },
  {
    href: "/admin/proyectos",
    etiqueta: "Proyectos",
    icono: FolderKanban,
    contador: "proyectos",
  },
  {
    href: "/admin/cobros",
    etiqueta: "Cobros",
    icono: Wallet,
    contador: "cobros",
  },
  { href: "/admin/catalogo", etiqueta: "Catálogo", icono: LayoutGrid },
  { href: "/admin/apps", etiqueta: "Apps y páginas", icono: AppWindow },
  { href: "/admin/estudio", etiqueta: "Estudio y créditos", icono: ImageIcon },
  { href: "/admin/ajustes", etiqueta: "Ajustes", icono: Settings },
]

const AFUERA = [
  { href: "/", etiqueta: "Ver la portada" },
  { href: "/estudio", etiqueta: "Abrir el Estudio" },
  { href: "/servicios", etiqueta: "Agentes" },
]

function Navegacion({
  contadores,
  onIr,
}: {
  contadores: Contadores
  onIr?: () => void
}) {
  const ruta = usePathname()
  return (
    <nav aria-label="Panel" className="flex flex-col gap-0.5">
      {NAV.map(({ href, etiqueta, icono: Icono, contador }) => {
        const activa =
          href === "/admin" ? ruta === "/admin" : ruta.startsWith(href)
        const n = contador ? contadores[contador] : 0
        return (
          <Link
            key={href}
            href={href}
            onClick={onIr}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
              activa && "bg-white/8 text-foreground"
            )}
          >
            <Icono className="size-[18px] shrink-0" />
            <span className="flex-1">{etiqueta}</span>
            {n > 0 ? (
              <span className="min-w-6 rounded-full bg-primary px-1.5 text-center text-xs font-semibold text-primary-foreground tabular-nums">
                {n}
              </span>
            ) : null}
          </Link>
        )
      })}
      <div className="my-3 h-px bg-border" />
      {AFUERA.map(({ href, etiqueta }) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <ExternalLink className="size-4 shrink-0" />
          {etiqueta}
        </Link>
      ))}
    </nav>
  )
}

/**
 * El marco del panel: barra lateral fija en la computadora y la tablet en
 * horizontal; en el teléfono, barra arriba con el menú en un cajón.
 */
export function MarcoPanel({
  correo,
  contadores,
  children,
}: {
  correo: string
  contadores: Contadores
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const ruta = usePathname()
  // Al cambiar de página se cierra el cajón del teléfono.
  const [rutaVista, setRutaVista] = useState(ruta)
  if (ruta !== rutaVista) {
    setRutaVista(ruta)
    setAbierto(false)
  }
  useEffect(() => {
    if (!abierto) return
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false)
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [abierto])
  const total = contadores.prospectos + contadores.cobros + contadores.proyectos

  return (
    <div className="min-h-dvh lg:flex">
      {/* Teléfono y tablet vertical */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur lg:hidden">
        <button
          type="button"
          aria-label="Abrir el menú"
          aria-expanded={abierto}
          onClick={() => setAbierto(true)}
          className="relative inline-flex size-11 items-center justify-center rounded-full border border-border bg-card"
        >
          <Menu className="size-5" />
          {total > 0 ? (
            <span
              className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </button>
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <BrandMark className="w-8" /> Panel
        </Link>
        <span className="size-11" aria-hidden />
      </header>
      {abierto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar el menú"
            className="absolute inset-0 bg-black/60"
            onClick={() => setAbierto(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col gap-4 overflow-y-auto border-r border-border bg-sidebar p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between px-2">
              <span className="flex items-center gap-2 font-semibold">
                <BrandMark className="w-8" /> Vision Studios
              </span>
              <button
                type="button"
                aria-label="Cerrar el menú"
                onClick={() => setAbierto(false)}
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <Navegacion
              contadores={contadores}
              onIr={() => setAbierto(false)}
            />
            <p className="mt-auto truncate px-3 text-xs text-muted-foreground">
              {correo}
            </p>
          </aside>
        </div>
      ) : null}

      {/* Computadora */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-r border-border bg-sidebar p-3 lg:flex">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-2 pt-2 font-semibold"
        >
          <BrandMark className="w-9" />
          <span className="flex flex-col leading-tight">
            Vision Studios{" "}
            <span className="text-xs font-normal text-muted-foreground">
              Panel de control
            </span>
          </span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Navegacion contadores={contadores} />
        </div>
        <p
          className="truncate px-3 text-xs text-muted-foreground"
          title={correo}
        >
          <Briefcase className="mr-1 inline size-3" />
          {correo}
        </p>
      </aside>

      <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-6 px-4 pt-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-8 md:pt-8">
        {children}
      </main>
    </div>
  )
}
