-- Servicios de texto con Claude (mes de contenido, radiografía, documentos y
-- asistente de WhatsApp). Se cobran con el mismo saldo y las mismas funciones
-- (begin_generation / refund_generation) que las imágenes y los videos.
-- Aplicada en el proyecto 402-studio como migración "servicios_y_agentes_claude" (7 oct 2026).

create table if not exists public.claude_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  generation_id uuid not null unique references public.generations (id) on delete cascade,
  service text not null
    check (service in ('contenido', 'radiografia', 'documento', 'asistente')),
  title text not null,
  input jsonb not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'failed')),
  output jsonb,
  error text,
  usage jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists claude_jobs_user_idx
  on public.claude_jobs (user_id, created_at desc);
alter table public.claude_jobs enable row level security;
drop policy if exists "claude_jobs: ver los propios" on public.claude_jobs;
create policy "claude_jobs: ver los propios" on public.claude_jobs
  for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.claude_jobs (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  business_name text not null,
  whatsapp text,
  greeting text not null default '',
  knowledge text not null,
  active boolean not null default true,
  daily_limit integer not null default 150 check (daily_limit between 0 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assistants_user_idx on public.assistants (user_id);
alter table public.assistants enable row level security;
drop policy if exists "assistants: ver los propios" on public.assistants;
create policy "assistants: ver los propios" on public.assistants
  for select to authenticated using ((select auth.uid()) = user_id);

-- Conversaciones del asistente público. Solo el servidor (llave de servicio) lee y escribe.
create table if not exists public.assistant_messages (
  id bigint generated always as identity primary key,
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  visitor text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists assistant_messages_idx
  on public.assistant_messages (assistant_id, visitor, created_at);
create index if not exists assistant_messages_day_idx
  on public.assistant_messages (assistant_id, created_at);
alter table public.assistant_messages enable row level security;

-- Agentes Vision: conversaciones con agentes especialistas, cobradas por respuesta.
create table if not exists public.agent_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent text not null check (agent in ('negocio', 'contenido', 'marca', 'ventas')),
  title text not null default 'Conversación nueva',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_chats_user_idx
  on public.agent_chats (user_id, updated_at desc);
alter table public.agent_chats enable row level security;
drop policy if exists "agent_chats: ver los propios" on public.agent_chats;
create policy "agent_chats: ver los propios" on public.agent_chats
  for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.agent_messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.agent_chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  generation_id uuid references public.generations (id) on delete set null,
  usage jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agent_messages_chat_idx
  on public.agent_messages (chat_id, id);
alter table public.agent_messages enable row level security;
drop policy if exists "agent_messages: ver los propios" on public.agent_messages;
create policy "agent_messages: ver los propios" on public.agent_messages
  for select to authenticated using (
    exists (
      select 1 from public.agent_chats c
      where c.id = chat_id and c.user_id = (select auth.uid())
    )
  );

-- Precios iniciales en créditos (1 crédito = US$0.01), ≈5 veces el costo de
-- la API en el caso más caro. El dueño los cambia en /admin.
insert into public.model_prices (model_id, credits) values
  ('svc-contenido', 85),
  ('svc-radiografia', 45),
  ('svc-documento', 35),
  ('svc-asistente', 35),
  ('svc-asistente-msg', 3),
  ('svc-agente-msg', 10)
on conflict (model_id) do nothing;
