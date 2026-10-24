-- Lista de espera de «Próximamente» (Estudio IA, Agentes IA, juegos).
-- Solo el servidor (service role) lee y escribe.
create table if not exists public.vs_suscriptores (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  fuente text not null default 'proximamente',
  origen text not null default '',
  created_at timestamptz not null default now()
);
alter table public.vs_suscriptores enable row level security;
revoke all on public.vs_suscriptores from anon, authenticated;
