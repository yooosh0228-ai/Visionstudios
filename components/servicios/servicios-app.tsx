"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutGrid,
  Loader2,
  MessagesSquare,
  Stethoscope,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { BrandMark } from "@/components/studio/brand-mark"
import { buttonVariants } from "@/components/ui/button"
import { getBalance } from "@/generation/account-actions"
import { DEFAULT_TOPUP_URL, formatCredits } from "@/generation/billing"
import { cn } from "@/lib/utils"
import {
  getServiceJobs,
  listAssistants,
  startServiceJob,
} from "@/servicios/actions"
import type { AssistantView, JobView } from "@/servicios/actions"
import type { AgentChatSummary } from "@/servicios/agent-actions"
import {
  AGENT_MESSAGE_PRICE_ID,
  ASSISTANT_MESSAGE_PRICE_ID,
  getService,
  SERVICES,
} from "@/servicios/catalog"
import type { ServiceDef, ServiceId } from "@/servicios/catalog"

import { AgentsPanel } from "./agents-panel"
import { AssistantsPanel } from "./assistants-panel"
import { JobResult } from "./job-result"
import { ServiceForm } from "./service-form"
import type { FormValues } from "./service-form"

const TOPUP_URL = DEFAULT_TOPUP_URL

const ICONS: Record<ServiceId, LucideIcon> = {
  contenido: CalendarDays,
  radiografia: Stethoscope,
  documento: FileText,
  asistente: Bot,
}

type View =
  | { kind: "agents" }
  | { kind: "catalog" }
  | { kind: "form"; service: ServiceId }
  | { kind: "jobs" }
  | { kind: "job"; id: string }
  | { kind: "assistants" }

const STATUS_LABEL: Record<JobView["status"], string> = {
  queued: "En cola",
  running: "Preparando",
  done: "Listo",
  failed: "No salió",
}

function when(iso: string) {
  return new Date(iso).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function NavItem({
  icon: Icon,
  label,
  meta,
  selected,
  onClick,
}: {
  icon: LucideIcon
  label: string
  meta?: string | number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-current={selected ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected
          ? "bg-white/8 text-foreground"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      <span className="flex-1 text-left">{label}</span>
      {meta !== undefined ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {meta}
        </span>
      ) : null}
    </button>
  )
}

function StatusBadge({ status }: { status: JobView["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
        status === "done" && "bg-primary/15 text-primary",
        status === "failed" && "bg-destructive/15 text-destructive",
        (status === "queued" || status === "running") &&
          "bg-white/8 text-muted-foreground"
      )}
    >
      {status === "queued" || status === "running" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : null}
      {STATUS_LABEL[status]}
    </span>
  )
}

export function ServiciosApp({
  email,
  isOwner,
  initialBalance,
  prices,
  initialJobs,
  initialAssistants,
  initialChats,
}: {
  email: string
  isOwner: boolean
  initialBalance: number
  prices: Record<string, number>
  initialJobs: JobView[]
  initialAssistants: AssistantView[]
  initialChats: AgentChatSummary[]
}) {
  const [view, setView] = useState<View>({ kind: "agents" })
  const [balance, setBalance] = useState(initialBalance)
  const [jobs, setJobs] = useState<JobView[]>(initialJobs)
  const [assistants, setAssistants] =
    useState<AssistantView[]>(initialAssistants)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  const go = (next: View) => {
    setError(null)
    setView(next)
    mainRef.current?.scrollTo({ top: 0 })
  }

  const refreshAssistants = useCallback(async () => {
    setAssistants(await listAssistants())
  }, [])

  // Sondeo de los pedidos en vuelo.
  const pendingIds = jobs
    .filter((j) => j.status === "queued" || j.status === "running")
    .map((j) => j.id)
  const pendingKey = pendingIds.join(",")
  useEffect(() => {
    if (!pendingKey) return
    let alive = true
    const ids = pendingKey.split(",")
    const tick = async () => {
      try {
        const fresh = await getServiceJobs(ids)
        if (!alive || !fresh.length) return
        const settled = fresh.filter(
          (j) => j.status === "done" || j.status === "failed"
        )
        setJobs((all) => all.map((j) => fresh.find((f) => f.id === j.id) ?? j))
        if (settled.some((j) => j.status === "failed")) {
          const credits = await getBalance()
          if (alive && credits !== null) setBalance(credits)
        }
        if (
          settled.some((j) => j.service === "asistente" && j.status === "done")
        )
          void refreshAssistants()
      } catch {
        /* se reintenta en el próximo ciclo */
      }
    }
    const timer = setInterval(() => void tick(), 4000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [pendingKey, refreshAssistants])

  const submit = async (service: ServiceDef, values: FormValues) => {
    setBusy(true)
    setError(null)
    try {
      const result = await startServiceJob({
        service: service.id,
        submissionId: crypto.randomUUID(),
        input: values,
      })
      if (result.balance !== undefined) setBalance(result.balance)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setJobs((all) => [
        result.job,
        ...all.filter((j) => j.id !== result.job.id),
      ])
      if (result.job.service === "asistente" && result.job.status === "done")
        void refreshAssistants()
      go({ kind: "job", id: result.job.id })
    } catch {
      setError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  const price = (service: ServiceDef) => prices[service.priceId] ?? null
  const currentJob =
    view.kind === "job" ? jobs.find((j) => j.id === view.id) : undefined

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 border-b border-sidebar-border bg-sidebar p-3 md:sticky md:top-0 md:m-2.5 md:h-[calc(100dvh-20px)] md:w-64 md:rounded-xl md:border">
        <div className="flex items-center gap-2 px-1">
          <BrandMark className="w-9 text-foreground" title="Vision Studios" />
          <span className="text-sm font-semibold">Agentes y servicios</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-1 md:flex-col md:overflow-visible">
          <NavItem
            icon={MessagesSquare}
            label="Agentes"
            selected={view.kind === "agents"}
            onClick={() => go({ kind: "agents" })}
          />
          <NavItem
            icon={LayoutGrid}
            label="Nuevo pedido"
            selected={view.kind === "catalog" || view.kind === "form"}
            onClick={() => go({ kind: "catalog" })}
          />
          <NavItem
            icon={ClipboardList}
            label="Mis pedidos"
            meta={jobs.length || undefined}
            selected={view.kind === "jobs" || view.kind === "job"}
            onClick={() => go({ kind: "jobs" })}
          />
          <NavItem
            icon={Bot}
            label="Mis asistentes"
            meta={assistants.length || undefined}
            selected={view.kind === "assistants"}
            onClick={() => go({ kind: "assistants" })}
          />
          <Link
            href="/"
            className="flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground md:mt-auto"
          >
            <ArrowLeft className="size-4" /> Imágenes y video
          </Link>
        </nav>
        <div className="hidden flex-col gap-2 rounded-lg border border-border p-3 md:flex">
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          {isOwner ? (
            <p className="text-sm">Cuenta de dueño</p>
          ) : (
            <p className="text-sm">
              <span className="text-xl font-semibold tabular-nums">
                {formatCredits(balance)}
              </span>{" "}
              <span className="text-muted-foreground">créditos</span>
            </p>
          )}
          {!isOwner ? (
            <a
              href={TOPUP_URL}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Wallet /> Recargar créditos
            </a>
          ) : (
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Panel de dueño
            </Link>
          )}
        </div>
      </aside>

      <main
        ref={mainRef}
        className="mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-10"
      >
        {!isOwner ? (
          <p className="text-sm text-muted-foreground md:hidden">
            Saldo:{" "}
            <strong className="text-foreground tabular-nums">
              {formatCredits(balance)}
            </strong>{" "}
            créditos ·{" "}
            <a href={TOPUP_URL} className="underline">
              Recargar
            </a>
          </p>
        ) : null}

        {view.kind === "agents" ? (
          <AgentsPanel
            initialChats={initialChats}
            price={prices[AGENT_MESSAGE_PRICE_ID] ?? null}
            isOwner={isOwner}
            balance={balance}
            onBalance={setBalance}
          />
        ) : null}

        {view.kind === "catalog" ? (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-q-headline-md-semi-bold">
                ¿Qué necesita tu negocio hoy?
              </h1>
              <p className="text-sm text-muted-foreground">
                Llena un formulario corto y recibe el trabajo listo para usar.
                Pagas con los mismos créditos de tus imágenes y videos; si algo
                no sale, se te devuelven solos.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {SERVICES.map((service) => {
                const Icon = ICONS[service.id]
                const p = price(service)
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => go({ kind: "form", service: service.id })}
                    className="group flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-5 text-left transition-colors hover:border-primary/50 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-lg font-semibold">
                      {service.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {service.tagline}
                    </span>
                    <span className="mt-auto text-sm">
                      {isOwner ? (
                        <span className="text-muted-foreground">
                          Gratis para el dueño
                        </span>
                      ) : p === null ? (
                        <span className="text-muted-foreground">
                          Próximamente
                        </span>
                      ) : (
                        <>
                          <strong className="tabular-nums">
                            {formatCredits(p)}
                          </strong>{" "}
                          <span className="text-muted-foreground">
                            créditos
                          </span>
                        </>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        ) : null}

        {view.kind === "form"
          ? (() => {
              const service = getService(view.service)
              if (!service) return null
              return (
                <ServiceForm
                  key={service.id}
                  service={service}
                  price={price(service)}
                  isOwner={isOwner}
                  balance={balance}
                  busy={busy}
                  error={error}
                  submitLabel={
                    service.id === "asistente" ? "Crear asistente" : "Preparar"
                  }
                  onBack={() => go({ kind: "catalog" })}
                  onSubmit={(values) => void submit(service, values)}
                />
              )
            })()
          : null}

        {view.kind === "jobs" ? (
          <>
            <h1 className="text-q-headline-md-semi-bold">Mis pedidos</h1>
            {jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Aquí quedan guardados todos tus pedidos.
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {jobs.map((job) => {
                  const service = getService(job.service)
                  const Icon = service ? ICONS[service.id] : FileText
                  return (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() => go({ kind: "job", id: job.id })}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {job.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {service?.name} · {when(job.createdAt)}
                          </span>
                        </span>
                        <StatusBadge status={job.status} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : null}

        {view.kind === "job" ? (
          currentJob ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => go({ kind: "jobs" })}
                  className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Mis pedidos
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-q-headline-md-semi-bold">
                    {currentJob.title}
                  </h1>
                  <StatusBadge status={currentJob.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {getService(currentJob.service)?.name} ·{" "}
                  {when(currentJob.createdAt)}
                  {currentJob.cost > 0
                    ? ` · ${formatCredits(currentJob.cost)} créditos`
                    : ""}
                </p>
              </div>
              {currentJob.status === "queued" ||
              currentJob.status === "running" ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border p-10 text-center">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="font-medium">Estamos preparando tu pedido…</p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Suele tardar entre 1 y 3 minutos. Puedes salir de esta
                    pantalla: queda guardado en «Mis pedidos».
                  </p>
                </div>
              ) : currentJob.status === "failed" ? (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/40 p-6"
                >
                  <p className="font-medium">Este pedido no salió.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentJob.error ?? "Se devolvieron los créditos."} Puedes
                    intentarlo otra vez.
                  </p>
                </div>
              ) : currentJob.output ? (
                <JobResult
                  output={currentJob.output}
                  title={currentJob.title}
                  onOpenAssistants={() => go({ kind: "assistants" })}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ese pedido no está en tu cuenta.
            </p>
          )
        ) : null}

        {view.kind === "assistants" ? (
          <AssistantsPanel
            assistants={assistants}
            messagePrice={prices[ASSISTANT_MESSAGE_PRICE_ID] ?? null}
            isOwner={isOwner}
            onCreate={() => go({ kind: "form", service: "asistente" })}
            onChanged={() => void refreshAssistants()}
          />
        ) : null}
      </main>
    </div>
  )
}
