"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  Check,
  Lightbulb,
  Loader2,
  Megaphone,
  MessageSquarePlus,
  Pencil,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  SendHorizontal,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCredits } from "@/generation/billing"
import { cn } from "@/lib/utils"
import { deleteAgentChat, getAgentChat, renameAgentChat, sendAgentMessage } from "@/servicios/agent-actions"
import type { AgentChatSummary, AgentMessageView } from "@/servicios/agent-actions"
import { AGENT_MESSAGE_MAX, AGENTS, getAgent } from "@/servicios/agents"
import type { AgentDef, AgentId } from "@/servicios/agents"

import { CopyButton } from "./copy-button"
import { MarkdownView } from "./markdown-view"

const AGENT_ICONS: Record<AgentId, LucideIcon> = {
  negocio: TrendingUp,
  contenido: Megaphone,
  marca: Sparkles,
  ventas: Lightbulb,
}

type Bubble = AgentMessageView & { pending?: boolean; error?: boolean }

type Open = { agent: AgentId; chatId: string | null } | null

function when(iso: string) {
  return new Date(iso).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

function AgentAvatar({ agent, className }: { agent: AgentId; className?: string }) {
  const Icon = AGENT_ICONS[agent]
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary", className)}>
      <Icon className="size-[18px]" />
    </span>
  )
}

export function AgentsPanel({
  initialChats,
  price,
  isOwner,
  balance,
  onBalance,
}: {
  initialChats: AgentChatSummary[]
  price: number | null
  isOwner: boolean
  balance: number
  onBalance: (credits: number) => void
}) {
  const [chats, setChats] = useState<AgentChatSummary[]>(initialChats)
  const [open, setOpen] = useState<Open>(null)

  if (open) {
    const agent = getAgent(open.agent)
    if (agent)
      return (
        <AgentChat
          key={open.chatId ?? `nuevo-${agent.id}`}
          agent={agent}
          chat={chats.find((c) => c.id === open.chatId) ?? null}
          price={price}
          isOwner={isOwner}
          balance={balance}
          onBalance={onBalance}
          onBack={() => setOpen(null)}
          onSaved={(chat) => {
            setChats((all) => [chat, ...all.filter((c) => c.id !== chat.id)])
            setOpen({ agent: chat.agent, chatId: chat.id })
          }}
          onRenamed={(id, title) => setChats((all) => all.map((c) => (c.id === id ? { ...c, title } : c)))}
          onDeleted={(id) => {
            setChats((all) => all.filter((c) => c.id !== id))
            setOpen(null)
          }}
        />
      )
  }

  const priceLabel = isOwner
    ? "Gratis para el dueño"
    : price === null
      ? "Próximamente"
      : `${formatCredits(price)} créditos por respuesta`

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-q-headline-md-semi-bold">Agentes Vision</h1>
        <p className="text-sm text-muted-foreground">
          Habla con un especialista como si fuera tu socio: pregúntale lo que sea de tu negocio y recibe respuestas
          concretas al momento. {priceLabel}; solo pagas las respuestas que llegan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => setOpen({ agent: agent.id, chatId: null })}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-5 text-left transition-colors hover:border-primary/50 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex items-center gap-3">
              <AgentAvatar agent={agent.id} className="size-10" />
              <span className="flex flex-col">
                <span className="text-lg font-semibold">{agent.name}</span>
                <span className="text-xs text-muted-foreground">{agent.role}</span>
              </span>
            </span>
            <span className="text-sm text-muted-foreground">{agent.description}</span>
            <span className="mt-auto inline-flex items-center gap-1.5 text-sm text-primary">
              <MessageSquarePlus className="size-4" /> Empezar conversación
            </span>
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Tus conversaciones</h2>
        {chats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aquí quedan guardadas tus conversaciones para retomarlas cuando quieras.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => setOpen({ agent: chat.agent, chatId: chat.id })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <AgentAvatar agent={chat.agent} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{chat.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {getAgent(chat.agent)?.name} · {when(chat.updatedAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function AgentChat({
  agent,
  chat,
  price,
  isOwner,
  balance,
  onBalance,
  onBack,
  onSaved,
  onRenamed,
  onDeleted,
}: {
  agent: AgentDef
  chat: AgentChatSummary | null
  price: number | null
  isOwner: boolean
  balance: number
  onBalance: (credits: number) => void
  onBack: () => void
  onSaved: (chat: AgentChatSummary) => void
  onRenamed: (id: string, title: string) => void
  onDeleted: (id: string) => void
}) {
  const [messages, setMessages] = useState<Bubble[]>([])
  const [loading, setLoading] = useState(chat !== null)
  const [loadError, setLoadError] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(chat?.title ?? "")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const tempSeq = useRef(0)
  const chatId = chat?.id ?? null

  useEffect(() => {
    if (!chatId) return
    let alive = true
    getAgentChat(chatId)
      .then((rows) => {
        if (!alive) return
        if (rows === null) setLoadError(true)
        else setMessages(rows)
      })
      .catch(() => alive && setLoadError(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [chatId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  const canPay = isOwner || (price !== null && balance >= price)

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || sending) return
    setNotice(null)
    setSending(true)
    setDraft("")
    tempSeq.current += 1
    const tempId = `tmp-${tempSeq.current}`
    setMessages((m) => [...m, { id: tempId, role: "user", content: text, createdAt: "", pending: true }])
    try {
      const result = await sendAgentMessage({
        agent: agent.id,
        chatId,
        text,
        submissionId: crypto.randomUUID(),
      })
      if (result.balance !== undefined) onBalance(result.balance)
      if (!result.ok) {
        setMessages((m) => m.filter((b) => b.id !== tempId))
        setDraft(text)
        setNotice(result.message)
        return
      }
      setMessages((m) => [...m.filter((b) => b.id !== tempId), ...result.messages])
      if (!chatId) onSaved(result.chat)
    } catch {
      setMessages((m) => m.filter((b) => b.id !== tempId))
      setDraft(text)
      setNotice("Se cayó la conexión. Tu mensaje sigue en la caja; intenta de nuevo.")
    } finally {
      setSending(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const saveTitle = async () => {
    if (!chatId) return
    const next = title.trim()
    if (!next) return
    const result = await renameAgentChat({ id: chatId, title: next })
    if (result.ok) {
      onRenamed(chatId, next.slice(0, 80))
      setRenaming(false)
    } else setNotice(result.message)
  }

  const remove = async () => {
    if (!chatId) return
    const result = await deleteAgentChat(chatId)
    if (result.ok) onDeleted(chatId)
    else {
      setConfirmDelete(false)
      setNotice(result.message)
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Volver a los agentes" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <AgentAvatar agent={agent.id} />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault()
                void saveTitle()
              }}
            >
              <label htmlFor="chat-title" className="sr-only">
                Nombre de la conversación
              </label>
              <input
                id="chat-title"
                autoFocus
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-white/5 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" size="icon-sm" variant="ghost" aria-label="Guardar nombre">
                <Check />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Cancelar" onClick={() => setRenaming(false)}>
                <X />
              </Button>
            </form>
          ) : (
            <>
              <p className="truncate font-semibold">{chat?.title ?? agent.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {chat ? `${agent.name} · ${agent.role}` : agent.role}
              </p>
            </>
          )}
        </div>
        {chatId && !renaming ? (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Renombrar conversación" onClick={() => setRenaming(true)}>
              <Pencil />
            </Button>
            {confirmDelete ? (
              <>
                <Button type="button" variant="destructive" size="sm" onClick={() => void remove()}>
                  Borrar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Borrar conversación" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-5" aria-live="polite">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando la conversación…
          </p>
        ) : loadError ? (
          <p role="alert" className="text-sm text-destructive">
            No se pudo abrir esta conversación.
          </p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{agent.description} Prueba con una de estas:</p>
            <div className="flex flex-col gap-2">
              {agent.starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  disabled={sending || !canPay}
                  onClick={() => void send(starter)}
                  className="rounded-lg border border-border px-4 py-3 text-left text-sm hover:border-primary/50 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p
                  className={cn(
                    "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line text-primary-foreground",
                    m.pending && "opacity-70"
                  )}
                >
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <AgentAvatar agent={agent.id} className="mt-1 size-7" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <MarkdownView source={m.content} className="text-[15px]" />
                  <div>
                    <CopyButton text={m.content} size="xs" />
                  </div>
                </div>
              </div>
            )
          )
        )}
        {sending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {agent.name} está escribiendo…
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 bg-background px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {notice ? (
          <p role="alert" className="text-sm text-destructive">
            {notice}
          </p>
        ) : null}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void send(draft)
          }}
        >
          <label htmlFor="agent-input" className="sr-only">
            Escribe tu mensaje para {agent.name}
          </label>
          <textarea
            id="agent-input"
            ref={inputRef}
            rows={2}
            value={draft}
            maxLength={AGENT_MESSAGE_MAX}
            disabled={loadError}
            placeholder={`Pregúntale a ${agent.name.toLowerCase()}…`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send(draft)
              }
            }}
            className="max-h-48 min-h-12 flex-1 resize-y rounded-xl border border-input bg-white/5 px-3 py-2.5 text-[16px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" size="icon-lg" aria-label="Enviar" disabled={sending || !draft.trim() || !canPay || loadError}>
            <SendHorizontal />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          {isOwner
            ? "Cuenta de dueño: las respuestas no gastan créditos."
            : price === null
              ? "Los agentes se activan pronto."
              : canPay
                ? `Cada respuesta cuesta ${formatCredits(price)} créditos. Si no llega, no se cobra.`
                : `Necesitas ${formatCredits(price)} créditos para la próxima respuesta. Recarga para seguir.`}
        </p>
      </div>
    </div>
  )
}
