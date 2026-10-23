import { PaginaProximamente } from "@/components/sitio/proximamente"
import { TRENDS } from "@/lib/studio/trends"

import { ServiciosApp } from "@/components/servicios/servicios-app"
import { getSession } from "@/generation/session"
import type { Session } from "@/generation/session"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { listAssistants, listServiceJobs } from "@/servicios/actions"
import { listAgentChats } from "@/servicios/agent-actions"
import { SERVICE_PRICE_IDS } from "@/servicios/catalog"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Agentes IA · Vision Studios",
  description:
    "Agentes especialistas para tu negocio, mes de contenido, radiografía de negocio, CV y documentos, y un asistente que atiende tu WhatsApp.",
}

export default async function ServiciosPage() {
  let session: Session | null = null
  try {
    session = await getSession()
  } catch {
    session = null
  }
  // Agentes IA aún no está abierto al público: solo el dueño entra.
  if (!session?.isOwner) return <PaginaProximamente fotos={TRENDS.slice(0, 6).map((t) => t.cover)} inicio={1} />

  const admin = createSupabaseAdmin()
  const [account, priceRows, jobs, assistants, chats] = await Promise.all([
    admin.from("accounts").select("credits").eq("user_id", session.userId).maybeSingle(),
    admin.from("model_prices").select("model_id, credits").in("model_id", [...SERVICE_PRICE_IDS]),
    listServiceJobs(),
    listAssistants(),
    listAgentChats(),
  ])
  const prices: Record<string, number> = {}
  for (const row of priceRows.data ?? []) prices[String(row.model_id)] = Number(row.credits)

  return (
    <ServiciosApp
      email={session.email}
      isOwner={session.isOwner}
      initialBalance={account.data ? Number(account.data.credits) : 0}
      prices={prices}
      initialJobs={jobs}
      initialAssistants={assistants}
      initialChats={chats}
    />
  )
}
