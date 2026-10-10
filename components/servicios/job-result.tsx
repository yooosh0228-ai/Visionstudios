"use client"

import { Download, MessageCircle, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { contentToText } from "@/servicios/outputs"
import type {
  AssistantOutput,
  ContentOutput,
  DiagnosisOutput,
  DocumentOutput,
  ServiceOutput,
} from "@/servicios/outputs"

import { CopyButton } from "./copy-button"
import { MarkdownView } from "./markdown-view"

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function fileName(title: string, ext: string) {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
  return `${base || "pedido"}.${ext}`
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/60 p-4", className)}>{children}</div>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{children}</h3>
}

function ContentResult({ data, title }: { data: ContentOutput; title: string }) {
  const all = contentToText(data)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <CopyButton text={all} label="Copiar todo" />
        <Button variant="outline" size="sm" onClick={() => downloadText(fileName(title, "txt"), all)}>
          <Download /> Descargar texto
        </Button>
      </div>
      <Card>
        <Heading>Estrategia del mes</Heading>
        <p className="mt-2 leading-relaxed">{data.estrategia}</p>
        {data.pilares.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.pilares.map((p) => (
              <span key={p} className="rounded-full border border-border px-3 py-1 text-xs">
                {p}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <section className="flex flex-col gap-3">
        <Heading>Calendario · {data.posts.length} publicaciones</Heading>
        <div className="grid gap-3 md:grid-cols-2">
          {data.posts.map((post) => {
            const caption = [post.texto, "", post.hashtags.join(" ")].join("\n").trim()
            return (
              <Card key={`${post.dia}-${post.tema}`} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-white/8 px-2 py-0.5 font-semibold text-foreground">
                    Día {post.dia}
                  </span>
                  <span>{post.red}</span>
                  <span>·</span>
                  <span>{post.formato}</span>
                </div>
                <p className="font-medium">{post.tema}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/80">Foto o video: </span>
                  {post.idea_visual}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-line">{post.texto}</p>
                {post.hashtags.length ? (
                  <p className="text-xs text-primary/90">{post.hashtags.join(" ")}</p>
                ) : null}
                {post.llamada_accion ? (
                  <p className="text-xs text-muted-foreground">→ {post.llamada_accion}</p>
                ) : null}
                <div className="mt-auto pt-1">
                  <CopyButton text={caption} label="Copiar texto" size="xs" />
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {data.promociones.length ? (
        <section className="flex flex-col gap-3">
          <Heading>Promociones</Heading>
          <div className="grid gap-3 md:grid-cols-2">
            {data.promociones.map((p) => (
              <Card key={p.nombre} className="flex flex-col gap-2">
                <p className="font-medium">{p.nombre}</p>
                <p className="text-sm text-muted-foreground">{p.mecanica}</p>
                <p className="rounded-lg bg-white/5 p-3 text-sm whitespace-pre-line">{p.texto_whatsapp}</p>
                <div>
                  <CopyButton text={p.texto_whatsapp} label="Copiar mensaje" size="xs" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {data.mensajes_whatsapp.length ? (
        <section className="flex flex-col gap-3">
          <Heading>Mensajes de WhatsApp</Heading>
          <div className="grid gap-3 md:grid-cols-2">
            {data.mensajes_whatsapp.map((m) => (
              <Card key={m.situacion} className="flex flex-col gap-2">
                <p className="text-sm font-medium">{m.situacion}</p>
                <p className="rounded-lg bg-white/5 p-3 text-sm whitespace-pre-line">{m.texto}</p>
                <div>
                  <CopyButton text={m.texto} label="Copiar" size="xs" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

const LEVEL_LABEL: Record<string, string> = {
  gratis: "Gratis",
  bajo: "Bajo costo",
  inversion: "Inversión",
}

function scoreTone(n: number) {
  return n >= 7 ? "bg-primary" : n >= 4 ? "bg-amber-400" : "bg-destructive"
}

function DiagnosisResult({ data }: { data: DiagnosisOutput }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer /> Imprimir o guardar PDF
        </Button>
      </div>
      <div data-print className="flex flex-col gap-6">
        <Card>
          <Heading>Diagnóstico</Heading>
          <p className="mt-2 leading-relaxed">{data.resumen}</p>
        </Card>
        <Card className="border-primary/40">
          <Heading>El cuello de botella</Heading>
          <p className="mt-2 text-lg font-semibold">{data.cuello_de_botella.titulo}</p>
          <p className="mt-1 leading-relaxed text-foreground/90">{data.cuello_de_botella.explicacion}</p>
        </Card>
        {data.areas.length ? (
          <section className="flex flex-col gap-3">
            <Heading>Cómo está cada área</Heading>
            <div className="flex flex-col gap-3">
              {data.areas.map((a) => (
                <div key={a.area} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{a.area}</span>
                    <span className="tabular-nums text-muted-foreground">{a.nota}/10</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className={cn("h-full rounded-full", scoreTone(a.nota))} style={{ width: `${a.nota * 10}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">{a.comentario}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {(["gratis", "bajo", "inversion"] as const).map((level) => {
          const items = data.mejoras.filter((m) => m.nivel === level)
          if (!items.length) return null
          return (
            <section key={level} className="flex flex-col gap-3">
              <Heading>Mejoras · {LEVEL_LABEL[level]}</Heading>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((m) => (
                  <Card key={m.titulo} className="flex flex-col gap-2">
                    <p className="font-medium">{m.titulo}</p>
                    <p className="text-sm text-muted-foreground">{m.por_que}</p>
                    <ol className="list-decimal pl-5 text-sm">
                      {m.pasos.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="text-xs text-muted-foreground">
                      Costo: {m.costo_estimado || "—"} · Impacto: {m.impacto || "—"}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
        {data.plan_30_dias.length ? (
          <section className="flex flex-col gap-3">
            <Heading>Plan de 30 días</Heading>
            <div className="grid gap-3 md:grid-cols-2">
              {data.plan_30_dias.map((week) => (
                <Card key={week.semana}>
                  <p className="font-medium">{week.semana}</p>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {week.acciones.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
        {data.siguiente_paso ? (
          <Card className="border-primary/40">
            <Heading>Tu siguiente paso, mañana mismo</Heading>
            <p className="mt-2 leading-relaxed">{data.siguiente_paso}</p>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function DocumentResult({ data }: { data: DocumentOutput }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer /> Imprimir o guardar PDF
        </Button>
        <CopyButton text={data.documento} label="Copiar texto" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadText(fileName(data.titulo, "md"), data.documento)}
        >
          <Download /> Descargar
        </Button>
      </div>
      {data.notas.length ? (
        <Card className="border-amber-400/40">
          <Heading>Antes de usarlo, revisa</Heading>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {data.notas.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      <div data-print className="rounded-xl bg-white p-8 text-[15px] text-neutral-900 shadow-sm md:p-12">
        <MarkdownView source={data.documento} />
      </div>
    </div>
  )
}

function AssistantResult({
  data,
  onOpenAssistants,
}: {
  data: AssistantOutput
  onOpenAssistants: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-primary/40">
        <p className="font-medium">Tu asistente está listo.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          En «Mis asistentes» tienes el enlace para tus clientes, el texto para tu WhatsApp Business y las
          conversaciones.
        </p>
        <Button className="mt-3" variant="outline" size="sm" onClick={onOpenAssistants}>
          <MessageCircle /> Ir a mis asistentes
        </Button>
      </Card>
      <Card>
        <Heading>Saludo</Heading>
        <p className="mt-2">{data.saludo}</p>
      </Card>
      <Card>
        <Heading>Ficha del negocio</Heading>
        <MarkdownView source={data.ficha} className="mt-2 text-sm" />
      </Card>
    </div>
  )
}

export function JobResult({
  output,
  title,
  onOpenAssistants,
}: {
  output: ServiceOutput
  title: string
  onOpenAssistants: () => void
}) {
  switch (output.service) {
    case "contenido":
      return <ContentResult data={output.data} title={title} />
    case "radiografia":
      return <DiagnosisResult data={output.data} />
    case "documento":
      return <DocumentResult data={output.data} />
    case "asistente":
      return <AssistantResult data={output.data} onOpenAssistants={onOpenAssistants} />
  }
}
