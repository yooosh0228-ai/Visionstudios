-- Créditos de bienvenida: cada cuenta nueva recibe un regalo para probar el
-- Estudio, hasta un tope total de personas. Se prende, se apaga y se ajusta
-- desde el panel (Ajustes → Regalo de bienvenida), que guarda en
-- vs_ajustes.datos->'bienvenida' = {"activo": bool, "creditos": n, "tope": n}.
--
-- Cada regalo queda en el libro de movimientos como ajuste con la nota
-- «Bienvenida»; esa nota es la que se cuenta para el tope.
-- Se puede correr más de una vez.

-- Valores iniciales (sin pisar lo que el dueño ya haya cambiado).
update public.vs_ajustes
set datos = jsonb_set(
  datos,
  '{bienvenida}',
  coalesce(datos->'bienvenida', '{"activo": true, "creditos": 50, "tope": 100}'::jsonb)
)
where id = 1;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conf jsonb;
  regalo numeric := 0;
  tope integer := 0;
  dados integer := 0;
begin
  insert into public.accounts (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;

  select datos->'bienvenida' into conf from public.vs_ajustes where id = 1;
  if conf is null or coalesce((conf->>'activo')::boolean, false) is not true then
    return new;
  end if;
  regalo := least(greatest(coalesce((conf->>'creditos')::numeric, 0), 0), 1000);
  tope := greatest(coalesce((conf->>'tope')::integer, 0), 0);
  if regalo <= 0 then
    return new;
  end if;

  -- Un solo regalo a la vez: evita que dos registros simultáneos pasen el tope.
  perform pg_advisory_xact_lock(hashtext('vs_bienvenida'));
  select count(*) into dados from public.ledger
  where reason = 'adjustment' and note = 'Bienvenida';
  if dados >= tope then
    return new;
  end if;
  -- Nunca dos veces a la misma cuenta.
  if exists (
    select 1 from public.ledger
    where user_id = new.id and reason = 'adjustment' and note = 'Bienvenida'
  ) then
    return new;
  end if;

  update public.accounts set credits = credits + regalo where user_id = new.id;
  insert into public.ledger (user_id, delta, balance_after, reason, note)
  select new.id, regalo, a.credits, 'adjustment', 'Bienvenida'
  from public.accounts a where a.user_id = new.id;
  return new;
exception when others then
  -- Si algo del regalo falla, la cuenta igual se crea: entrar nunca se bloquea.
  insert into public.accounts (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;
  return new;
end $$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
