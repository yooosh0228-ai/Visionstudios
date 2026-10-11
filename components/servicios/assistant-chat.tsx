"use client"

import { useRef, useState } from "react"
import { MessageCircle, SendHorizontal } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { askAssistant } from "@/servicios/actions"
import { CHAT_MESSAGE_MAX, whatsappLink } from "@/servicios/catalog"

type Bubble = { role: "user" | "assistant"; text: string; handoff?: boolean; error?: boolean }

const VISITOR_KEY = "asistente.visitante"

/** Identificador anónimo del visitante, solo para agrupar su conversación. */
function visitorId(): string {
  try {
    const saved = localStorage.getItem(VISITOR_KEY)
    if (saved && /^[a-z0-9-]{16,64}$/i.test(saved)) return saved
    const fresh = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, fresh)
    return fresh
  } catch {
    return crypto.randomUUID()
  }
}

export function AssistantChat({
  slug,
  businessName,
  greeting,
  whatsapp,
  active,
}: {
  slug: string
  businessName: string
  greeting: string
  whatsapp: string | null
  active: boolean
}) {
  const [messages, setMessages] = useState<Bubble[]>([{ role: "assistant", text: greeting }])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const visitor = useRef<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const handoffText = `Hola ${businessName}, vengo del asistente y quiero seguir por aquí.`
  const waUrl = whatsapp ? whatsappLink(whatsapp, handoffText) : null

  const send = async () => {
    const text = draft.trim()
    if (!text || sending) return
    visitor.current ??= visitorId()
    setDraft("")
    setSending(true)
    setMessages((m) => [...m, { role: "user", text }])
    try {
      const result = await askAssistant({ slug, visitor: visitor.current, text })
      setMessages((m) => [
        ...m,
        result.ok
          ? { role: "assistant", text: result.reply, handoff: result.handoff }
          : { role: "assistant", text: result.message, handoff: result.handoff, error: true },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Se cayó la conexión. Intenta de nuevo.", error: true, handoff: true },
      ])
    } finally {
      setSending(false)
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }))
    }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
          {businessName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{businessName}</p>
          <p className="text-xs text-muted-foreground">{active ? "Responde al instante" : "Fuera de línea"}</p>
        </div>
        {waUrl ? (
          <a href={waUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <MessageCircle /> WhatsApp
          </a>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line",
                m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-white/8",
                m.error && "text-muted-foreground"
              )}
            >
              {m.text}
            </p>
            {m.handoff && waUrl ? (
              <a href={waUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <MessageCircle /> Seguir por WhatsApp
              </a>
            ) : null}
          </div>
        ))}
        {sending ? (
          <p className="w-fit rounded-2xl rounded-bl-sm bg-white/8 px-4 py-2.5 text-muted-foreground">Escribiendo…</p>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Escribe tu mensaje
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={draft}
          maxLength={CHAT_MESSAGE_MAX}
          disabled={!active}
          placeholder={active ? "Escribe tu pregunta…" : "El asistente está apagado. Escríbenos por WhatsApp."}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-white/5 px-3 py-2.5 text-[16px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="icon-lg" aria-label="Enviar" disabled={!active || sending || !draft.trim()}>
          <SendHorizontal />
        </Button>
      </form>
    </div>
  )
}
