"use client"

import { useState, useSyncExternalStore, useTransition } from "react"
import { ExternalLink, MessageSquareText, Plus, Save } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCredits } from "@/generation/billing"
import { cn } from "@/lib/utils"
import { getAssistantConversations, updateAssistant } from "@/servicios/actions"
import type { AssistantView, Conversation } from "@/servicios/actions"

import { CopyButton } from "./copy-button"

const textareaClass =
  "w-full resize-y rounded-lg border border-input bg-white/5 px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const noop = () => () => {}

function useOrigin() {
  return useSyncExternalStore(noop, () => window.location.origin, () => "")
}

function when(iso: string) {
  return new Date(iso).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Conversations({ assistantId }: { assistantId: string }) {
  const [items, setItems] = useState<Conversation[] | null>(null)
  const [pending, start] = useTransition()
  const load = () => start(async () => setItems(await getAssistantConversations(assistantId)))
  if (items === null)
    return (
      <Button variant="outline" size="sm" onClick={load} disabled={pending}>
        <MessageSquareText /> {pending ? "Cargando…" : "Ver conversaciones"}
      </Button>
    )
  if (!items.length)
    return <p className="text-sm text-muted-foreground">Todavía nadie ha escrito.</p>
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Últimas conversaciones</p>
        <Button variant="ghost" size="xs" onClick={load} disabled={pending}>
          Actualizar
        </Button>
      </div>
      {items.map((c) => (
        <details key={c.visitor} className="rounded-lg border border-border p-3">
          <summary className="cursor-pointer text-sm">
            Cliente {c.visitor.slice(0, 6)} · {c.messages.length} mensajes · {when(c.lastAt)}
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {c.messages.map((m, i) => (
              <p
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line",
                  m.role === "user" ? "self-end bg-primary/15" : "self-start bg-white/5"
                )}
              >
                {m.content}
              </p>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

function AssistantCard({
  assistant,
  messagePrice,
  isOwner,
  onSaved,
}: {
  assistant: AssistantView
  messagePrice: number | null
  isOwner: boolean
  onSaved: () => void
}) {
  const origin = useOrigin()
  const link = origin ? `${origin}/a/${assistant.slug}` : `/a/${assistant.slug}`
  const [knowledge, setKnowledge] = useState(assistant.knowledge)
  const [greeting, setGreeting] = useState(assistant.greeting)
  const [whatsapp, setWhatsapp] = useState(assistant.whatsapp ?? "")
  const [limit, setLimit] = useState(String(assistant.dailyLimit))
  const [slug, setSlug] = useState(assistant.slug)
  const [message, setMessage] = useState<{ text: string; failed: boolean } | null>(null)
  const [pending, start] = useTransition()

  const autoReply = `¡Hola! Gracias por escribir a ${assistant.businessName}. Para ver precios, horarios y hacer tu pedido al instante, entra aquí: ${link}\nSi prefieres, sigue escribiendo por aquí y te atendemos.`

  const save = (patch: Record<string, unknown>, ok: string) =>
    start(async () => {
      setMessage(null)
      const result = await updateAssistant({ id: assistant.id, ...patch })
      setMessage(result.ok ? { text: ok, failed: false } : { text: result.message, failed: true })
      if (result.ok) onSaved()
    })

  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{assistant.businessName}</h2>
          <p className="text-sm text-muted-foreground">
            {assistant.repliesToday} de {assistant.dailyLimit} respuestas en las últimas 24 horas
            {!isOwner && messagePrice !== null
              ? ` · cada respuesta usa ${formatCredits(messagePrice)} créditos de tu saldo`
              : ""}
          </p>
        </div>
        <Button
          variant={assistant.active ? "outline" : "default"}
          size="sm"
          disabled={pending}
          onClick={() =>
            save({ active: !assistant.active }, assistant.active ? "Asistente apagado." : "Asistente encendido.")
          }
        >
          {assistant.active ? "Apagar" : "Encender"}
        </Button>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium">Enlace para tus clientes</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="max-w-full truncate rounded-md bg-white/5 px-2 py-1 text-sm">{link}</code>
          <CopyButton text={link} label="Copiar enlace" />
          <a
            href={`/a/${assistant.slug}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ExternalLink /> Probar
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Ponlo en tu bio de Instagram, en tus estados y en la respuesta automática de WhatsApp Business.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium">Respuesta automática para WhatsApp Business</p>
        <p className="rounded-lg bg-white/5 p-3 text-sm whitespace-pre-line">{autoReply}</p>
        <div>
          <CopyButton text={autoReply} label="Copiar mensaje" />
        </div>
        <p className="text-xs text-muted-foreground">
          En WhatsApp Business: Herramientas para la empresa → Mensaje de bienvenida (o Mensaje de ausencia) → pega
          este texto.
        </p>
      </section>

      <details className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">Editar asistente (gratis)</summary>
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            save(
              { knowledge, greeting, whatsapp, dailyLimit: Number(limit), slug },
              "Cambios guardados."
            )
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              WhatsApp del negocio
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Tope de respuestas al día
              <Input value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="numeric" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Dirección (/a/…)
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            Saludo
            <textarea className={cn(textareaClass, "min-h-16")} value={greeting} maxLength={400} onChange={(e) => setGreeting(e.target.value)} />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Ficha del negocio (lo único que el asistente sabe)
            <textarea className={cn(textareaClass, "min-h-72 font-mono text-xs")} value={knowledge} maxLength={14000} onChange={(e) => setKnowledge(e.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">
            ¿Cambió un precio o el horario? Corrígelo aquí y guarda: el asistente lo usa desde la próxima respuesta.
          </p>
          <div>
            <Button type="submit" variant="outline" disabled={pending}>
              <Save /> {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </details>

      {message ? (
        <p role={message.failed ? "alert" : "status"} className={message.failed ? "text-sm text-destructive" : "text-sm text-primary"}>
          {message.text}
        </p>
      ) : null}

      <Conversations assistantId={assistant.id} />
    </article>
  )
}

export function AssistantsPanel({
  assistants,
  messagePrice,
  isOwner,
  onCreate,
  onChanged,
}: {
  assistants: AssistantView[]
  messagePrice: number | null
  isOwner: boolean
  onCreate: () => void
  onChanged: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-q-headline-md-semi-bold">Mis asistentes</h1>
          <p className="text-sm text-muted-foreground">
            Contestan a tus clientes a cualquier hora y los pasan a tu WhatsApp para cerrar la venta.
          </p>
        </div>
        <Button variant="outline" onClick={onCreate}>
          <Plus /> Nuevo asistente
        </Button>
      </div>
      {assistants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no tienes asistentes. Crea uno con los datos de tu negocio.
        </div>
      ) : (
        assistants.map((a) => (
          <AssistantCard
            key={`${a.id}-${a.updatedAt}`}
            assistant={a}
            messagePrice={messagePrice}
            isOwner={isOwner}
            onSaved={onChanged}
          />
        ))
      )}
    </div>
  )
}
