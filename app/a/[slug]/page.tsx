import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AssistantChat } from "@/components/servicios/assistant-chat"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { SLUG_PATTERN } from "@/servicios/catalog"

export const dynamic = "force-dynamic"

async function load(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null
  const { data } = await createSupabaseAdmin()
    .from("assistants")
    .select("slug, business_name, greeting, whatsapp, active")
    .eq("slug", slug)
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const assistant = await load(slug)
  return {
    title: assistant ? `${assistant.business_name} · Atención al cliente` : "Asistente",
    robots: { index: false },
  }
}

/** Chat público del asistente de un negocio. No pide cuenta. */
export default async function AssistantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const assistant = await load(slug)
  if (!assistant) notFound()
  return (
    <AssistantChat
      slug={String(assistant.slug)}
      businessName={String(assistant.business_name)}
      greeting={String(assistant.greeting || `¡Hola! Bienvenido a ${assistant.business_name}. ¿En qué te ayudo?`)}
      whatsapp={assistant.whatsapp ? String(assistant.whatsapp) : null}
      active={!!assistant.active}
    />
  )
}
