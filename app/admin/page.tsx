import { redirect } from "next/navigation"

import { AdminPanel } from "@/components/admin/admin-panel"
import { priceUnit } from "@/generation/billing"
import { MODELS } from "@/generation/catalog"
import { getSession } from "@/generation/session"
import type { Session } from "@/generation/session"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const metadata = { title: "Panel de dueño · 402 Vision Studios" }

export default async function AdminPage() {
  let session: Session | null = null
  try {
    session = await getSession()
  } catch {
    session = null
  }
  if (!session?.isOwner) redirect("/")

  const admin = createSupabaseAdmin()
  const [accounts, prices, ledger, pending] = await Promise.all([
    admin
      .from("accounts")
      .select("user_id, email, credits, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin.from("model_prices").select("model_id, credits"),
    admin
      .from("ledger")
      .select("id, user_id, delta, balance_after, reason, note, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    admin
      .from("generations")
      .select("id, user_id, model_id, cost, status, created_at")
      .in("status", ["charged", "unconfirmed"])
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  const emails = new Map<string, string>()
  for (const row of accounts.data ?? [])
    emails.set(String(row.user_id), String(row.email))
  const who = (userId: unknown) =>
    emails.get(String(userId)) ?? String(userId).slice(0, 8)

  const priceByModel = new Map<string, number>()
  for (const row of prices.data ?? [])
    priceByModel.set(String(row.model_id), Number(row.credits))

  return (
    <AdminPanel
      ownerEmail={session.email}
      accounts={(accounts.data ?? []).map((row) => ({
        userId: String(row.user_id),
        email: String(row.email),
        credits: Number(row.credits),
        createdAt: String(row.created_at),
      }))}
      models={MODELS.map((model) => ({
        id: model.id,
        label: model.label,
        surface: model.surface,
        unit: priceUnit(model),
        price: priceByModel.get(model.id) ?? null,
      }))}
      movements={(ledger.data ?? []).map((row) => ({
        id: Number(row.id),
        email: who(row.user_id),
        delta: Number(row.delta),
        balanceAfter: Number(row.balance_after),
        reason: String(row.reason),
        note: row.note ? String(row.note) : null,
        createdAt: String(row.created_at),
      }))}
      pending={(pending.data ?? []).map((row) => ({
        id: String(row.id),
        email: who(row.user_id),
        modelId: String(row.model_id),
        cost: Number(row.cost),
        status: String(row.status),
        createdAt: String(row.created_at),
      }))}
    />
  )
}
