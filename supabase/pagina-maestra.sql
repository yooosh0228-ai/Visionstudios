-- Página maestra de Vision Studios: vitrina pública, área de clientes y panel
-- de control (el "sistema operativo" del negocio) en una sola base.
--
-- Todas las tablas tienen RLS encendido y NINGUNA política: el navegador no las
-- puede leer ni escribir. Solo el servidor (llave de servicio) entra, y cada
-- acción revisa antes si quien la pide es el dueño o el cliente dueño del dato.
-- Así las notas internas, los márgenes y los otros clientes nunca salen.
--
-- Aplicada en el proyecto 402-studio como migración "pagina_maestra" (oct 2026).

-- Ajustes generales: contacto, metas, reglas de cobro, cuentas para transferir,
-- paquetes de créditos y textos de la portada. Una sola fila.
create table if not exists public.vs_ajustes (
  id smallint primary key default 1 check (id = 1),
  datos jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Catálogo de trabajos que se muestran en la portada.
create table if not exists public.vs_trabajos (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  tipo text not null check (tipo in ('app', 'video', 'marca')),
  cliente text not null,
  obra text not null,
  donde text not null default '',
  titulo text,
  resumen text not null default '',
  hecho text[] not null default '{}',
  cifras jsonb not null default '[]'::jsonb,
  vivo text,
  nota_vivo text,
  video_local text,
  video_remoto text,
  poster text,
  fondo_local text,
  fondo_remoto text,
  lienzo text check (lienzo in ('marca', 'estudio', 'web')),
  sonido boolean not null default false,
  destacado boolean not null default false,
  en_destacado boolean not null default false,
  pantallas jsonb not null default '[]'::jsonb,
  visible boolean not null default true,
  orden integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ofertas: lo que se vende. Las públicas salen en la portada; el resto se usa
-- por dentro (prospectos, cobros, proyectos).
create table if not exists public.vs_ofertas (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  nombre text not null,
  categoria text not null default 'otro'
    check (categoria in ('diagnostico', 'apps', 'marca', 'video', 'software', 'contenido', 'otro')),
  resumen text not null default '',
  incluye text[] not null default '{}',
  precio_publico numeric check (precio_publico is null or precio_publico >= 0),
  precio_referencia numeric check (precio_referencia is null or precio_referencia >= 0),
  unidad text not null default 'pago único' check (unidad in ('pago único', 'mensual', 'por pieza')),
  publico boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clientes ("Client Brain"): la fuente de verdad de cada cuenta.
create table if not exists public.vs_clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto text not null default '',
  telefono text not null default '',
  email text unique check (email is null or email = lower(email)),
  sector text not null default '',
  ciudad text not null default 'Santiago de los Caballeros',
  enlace text not null default '',
  oferta text not null default '',
  audiencia text not null default '',
  prueba text not null default '',
  rango_precio text not null default '',
  objetivo text not null default '',
  obstaculo text not null default '',
  tono text not null default '',
  materiales text not null default '',
  notas_internas text not null default '',
  estado text not null default 'activo' check (estado in ('activo', 'pausa', 'cerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prospectos: cada contacto con una sola próxima acción y su fecha.
create table if not exists public.vs_prospectos (
  id uuid primary key default gen_random_uuid(),
  negocio text not null,
  contacto text not null default '',
  telefono text not null default '',
  instagram text not null default '',
  sector text not null default '',
  oferta_id text references public.vs_ofertas (id) on delete set null,
  valor numeric check (valor is null or valor >= 0),
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'contactado', 'descubrimiento', 'propuesta', 'deposito', 'ganado', 'perdido')),
  proxima_accion text not null default '',
  fecha_proxima date,
  nota text not null default '',
  fuente text not null default 'manual' check (fuente in ('web', 'manual')),
  datos jsonb not null default '{}'::jsonb,
  cliente_id uuid references public.vs_clientes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vs_prospectos_estado_idx on public.vs_prospectos (estado, fecha_proxima);

-- Proyectos: cada uno en una etapa visible.
create table if not exists public.vs_proyectos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.vs_clientes (id) on delete cascade,
  nombre text not null,
  oferta_id text references public.vs_ofertas (id) on delete set null,
  etapa text not null default 'intake'
    check (etapa in ('intake', 'diagnostico', 'estrategia', 'produccion', 'revision', 'aprobacion', 'entrega')),
  fecha_entrega date,
  nota_cliente text not null default '',
  notas_internas text not null default '',
  cerrado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vs_proyectos_cliente_idx on public.vs_proyectos (cliente_id);

-- Entregables: lo que el cliente revisa y aprueba.
create table if not exists public.vs_entregables (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.vs_proyectos (id) on delete cascade,
  titulo text not null,
  enlace text not null default '',
  descripcion text not null default '',
  estado text not null default 'revision' check (estado in ('borrador', 'revision', 'aprobado', 'cambios')),
  visible_cliente boolean not null default true,
  comentario_cliente text not null default '',
  respondido_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vs_entregables_proyecto_idx on public.vs_entregables (proyecto_id);

-- Cobros: lo contratado. Lo recibido sale de los pagos confirmados.
create table if not exists public.vs_cobros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.vs_clientes (id) on delete cascade,
  proyecto_id uuid references public.vs_proyectos (id) on delete set null,
  oferta_id text references public.vs_ofertas (id) on delete set null,
  concepto text not null,
  tipo text not null default 'proyecto' check (tipo in ('proyecto', 'mensualidad', 'terceros', 'otro')),
  precio numeric not null check (precio >= 0),
  deposito numeric not null default 0 check (deposito >= 0),
  vencimiento date,
  nota text not null default '',
  cancelado boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vs_cobros_cliente_idx on public.vs_cobros (cliente_id);

-- Pagos: un cliente reporta una transferencia (pendiente) y el dueño la confirma.
-- tipo 'creditos' recarga el saldo del Estudio al confirmarse.
create table if not exists public.vs_pagos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('cobro', 'creditos')),
  cobro_id uuid references public.vs_cobros (id) on delete cascade,
  cliente_id uuid references public.vs_clientes (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  monto numeric not null check (monto > 0),
  creditos numeric check (creditos is null or creditos > 0),
  metodo text not null default 'transferencia'
    check (metodo in ('popular', 'qik', 'banreservas', 'efectivo', 'transferencia', 'otro')),
  referencia text not null default '',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'rechazado')),
  reportado_por text not null default 'cliente' check (reportado_por in ('cliente', 'admin')),
  nota text not null default '',
  created_at timestamptz not null default now(),
  revisado_at timestamptz,
  check (tipo <> 'cobro' or cobro_id is not null),
  check (tipo <> 'creditos' or creditos is not null)
);
create index if not exists vs_pagos_estado_idx on public.vs_pagos (estado, created_at desc);
create index if not exists vs_pagos_cobro_idx on public.vs_pagos (cobro_id);

-- Apps, páginas y sistemas que administra Vision Studios.
create table if not exists public.vs_apps (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  url text not null default '',
  tipo text not null default 'pagina' check (tipo in ('app', 'pagina', 'sistema', 'artifact', 'otro')),
  cliente_id uuid references public.vs_clientes (id) on delete set null,
  estado text not null default 'activo' check (estado in ('activo', 'desarrollo', 'pausa', 'archivado')),
  hosting text not null default '',
  repo text not null default '',
  mensualidad numeric check (mensualidad is null or mensualidad >= 0),
  notas text not null default '',
  orden integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vs_ajustes enable row level security;
alter table public.vs_trabajos enable row level security;
alter table public.vs_ofertas enable row level security;
alter table public.vs_clientes enable row level security;
alter table public.vs_prospectos enable row level security;
alter table public.vs_proyectos enable row level security;
alter table public.vs_entregables enable row level security;
alter table public.vs_cobros enable row level security;
alter table public.vs_pagos enable row level security;
alter table public.vs_apps enable row level security;

-- Confirmar un pago de créditos y recargar el saldo en una sola transacción:
-- si cualquiera de los dos pasos falla, no pasa ninguno.
create or replace function public.vs_confirmar_pago_creditos(p_pago uuid, p_nota text)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pago public.vs_pagos;
  v_saldo numeric;
begin
  select * into v_pago from public.vs_pagos where id = p_pago for update;
  if not found then raise exception 'pago_inexistente'; end if;
  if v_pago.tipo <> 'creditos' then raise exception 'no_es_creditos'; end if;
  if v_pago.estado <> 'pendiente' then raise exception 'ya_revisado'; end if;
  if v_pago.user_id is null then raise exception 'no_account'; end if;
  v_saldo := public.admin_adjust(v_pago.user_id, v_pago.creditos, 'topup',
    coalesce(nullif(p_nota, ''), 'Recarga por transferencia ' || v_pago.referencia));
  update public.vs_pagos set estado = 'confirmado', revisado_at = now() where id = p_pago;
  return v_saldo;
end;
$$;
revoke all on function public.vs_confirmar_pago_creditos(uuid, text) from public, anon, authenticated;
grant execute on function public.vs_confirmar_pago_creditos(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Datos iniciales (lo que ya existe hoy). Se pueden editar desde /admin.
-- ---------------------------------------------------------------------------

insert into public.vs_ajustes (id, datos) values (1, $json${
  "nombre": "Vision Studios",
  "whatsapp": "",
  "instagram": "visionstudios.rd",
  "correo": "",
  "portada": "spot-tu-negocio",
  "pruebaSocial": [["100%", "personalizado"], ["Cero", "plantillas"], ["Hecho", "en Santiago"]],
  "espacioLibre": { "titulo": "El próximo puede ser el tuyo.", "texto": "Cuéntanos tu negocio y lo ponemos en foco." },
  "compromisos": [
    ["desde-cero", "Desde cero", "Cada página, app y pieza se diseña y se programa para ti. No compramos plantillas para revenderlas."],
    ["tuyo", "Es tuyo", "Va con tu nombre y en tu dominio. Te quedas con los archivos."],
    ["manual", "Te enseñamos a usarlo", "Entregamos con manual y te acompañamos hasta que lo manejes sin depender de nadie."]
  ],
  "radiografia": {
    "oferta": "radiografia",
    "etiqueta": "Precio de lanzamiento",
    "condicion": "Pago único. Sales con un plan escrito, tuyo, lo hagas con nosotros o con quien quieras. Si contratas el siguiente servicio con nosotros, se te descuenta.",
    "lead": "Antes de gastar en página, logo o publicidad, mira dónde se te va el cliente. Revisamos tu negocio completo y te decimos qué falta y en qué orden."
  },
  "pasos": [
    ["Enfocar", "Hablamos de tu negocio: qué vendes, a quién y qué te está costando clientes."],
    ["Encuadrar", "Te proponemos qué hacer, en qué orden y cuánto cuesta. Por escrito."],
    ["Disparar", "Lo hacemos y te enseñamos avances para que corrijas a tiempo."],
    ["Revelar", "Te lo entregamos a tu nombre y te enseñamos a usarlo."]
  ],
  "metaMensual": 50000,
  "capacidad": 7,
  "reglasCobro": [
    ["Hasta RD$10,000", "100% antes de iniciar."],
    ["Proyecto de RD$10,000–40,000", "60% al inicio, 40% antes de la entrega final o la publicación."],
    ["Mensualidad", "Se paga al inicio del ciclo, no al final."],
    ["Costos de terceros", "Impresión, pauta, dominio y otros: 100% del cliente antes de comprarlos."]
  ],
  "cuentasPago": [],
  "paquetesCreditos": [
    { "precio": 300, "creditos": 500 },
    { "precio": 600, "creditos": 1100 },
    { "precio": 1500, "creditos": 2900 }
  ]
}$json$::jsonb)
on conflict (id) do nothing;

insert into public.vs_ofertas (id, nombre, categoria, resumen, incluye, precio_publico, unidad, publico, orden) values
  ('radiografia', 'Radiografía de negocio', 'diagnostico',
   'Revisamos tu negocio completo y te decimos qué falta y en qué orden.',
   array['Precios y servicios: qué deja dinero y qué no', 'Cómo atiendes y en qué punto se pierde la gente', 'Tus redes: qué comunican y qué deberían comunicar', 'Plan de mejoras ordenado por presupuesto'],
   2000, 'pago único', true, 10),
  ('apps-paginas', 'Apps y páginas', 'apps', 'Tu negocio en el teléfono de tus clientes.',
   array['Turnos y reservas por WhatsApp', 'Catálogo o menú', 'Página con tu dominio', 'Agenda y caja para ti'], null, 'pago único', true, 20),
  ('identidad', 'Identidad de marca', 'marca', 'Que tu negocio se vea como lo que es, desde cero o renovado.',
   array['Logo y versiones', 'Colores y letras', 'Reglas de uso', 'Auditoría de imagen'], null, 'pago único', true, 30),
  ('video-foto', 'Video y foto publicitaria', 'video', 'Piezas que le paran el dedo a la gente en Instagram y WhatsApp.',
   array['Reels y spots', 'Fotos de producto', 'Piezas para fechas', 'Contenido mensual'], null, 'por pieza', true, 40),
  ('software', 'Software a la medida', 'software', 'Lo que tu operación necesita y no venden hecho.',
   array['Sistemas internos', 'Automatizar tareas', 'Conectar tus herramientas', 'Mantenimiento'], null, 'pago único', true, 50),
  ('pieza-que-vende', 'Pieza que vende', 'video', 'Una pieza publicitaria con un solo mensaje y un solo llamado a la acción.',
   '{}', null, 'por pieza', false, 60),
  ('perfil-listo', 'Perfil listo para vender', 'marca', 'Instagram o Google ordenado para que se entienda qué vendes y cómo comprar.',
   '{}', null, 'pago único', false, 70),
  ('contenido-semilla', 'Contenido Semilla', 'contenido', 'Un primer paquete de contenido para arrancar con constancia.',
   '{}', null, 'pago único', false, 80),
  ('presencia-movimiento', 'Presencia en Movimiento', 'contenido', 'Contenido y video cada mes para mantener el negocio presente.',
   '{}', null, 'mensual', false, 90),
  ('pagina-signal', 'Página Signal', 'apps', 'Una página de una sola sección que lleva al cliente a escribir por WhatsApp.',
   '{}', null, 'pago único', false, 100),
  ('mantenimiento', 'Mantenimiento de app o página', 'apps', 'Que siga en línea, cambios de precios y horarios, arreglos y ayuda por WhatsApp.',
   array['Cambios de precios, horarios y servicios', 'Arreglar lo que se dañe', 'Ayuda por WhatsApp', 'Una revisión al mes'], null, 'mensual', false, 110)
on conflict (id) do nothing;

insert into public.vs_trabajos (id, tipo, cliente, obra, donde, titulo, resumen, hecho, cifras, vivo, nota_vivo, fondo_remoto, fondo_local, destacado, pantallas, orden) values
  ('gallery-app', 'app', 'Gallery Barber Studio', 'App de turnos y agenda del barbero', 'Santiago, 2026',
   'Una barbería que ya no pierde turnos.',
   'Gallery atendía por orden de llegada porque su sistema de citas anterior falló: la gente avisaba diez minutos antes que no venía. Le hicimos una app propia. El cliente aparta desde el teléfono, el turno le llega al barbero por WhatsApp y entra solo a su agenda.',
   array['Solo ofrece las horas libres y aparta sola la media hora de almuerzo', 'Regla del día antes: el que no confirma suelta el turno', 'Agenda, lista de espera, libreta de clientes y caja del día para el barbero', 'Manual para el cliente y manual para el barbero'],
   '[["4", "toques para apartar"], ["40–45", "clientes entre viernes y sábado"], ["24/7", "abierta para apartar"]]'::jsonb,
   'https://gallerybarberstudios.netlify.app',
   'Es la app real de la barbería: si envías un turno, le llega a Edwin por WhatsApp.',
   'https://d8j0ntlcm91z4.cloudfront.net/user_3Fy5zinm57MfSWOTmON75ozgJVz/hf_20261001_053017_175d8f4e-5861-4582-b026-2c86e96b4a35.mp4',
   '/videos/gallery-fachada.mp4', true,
   '[{"etiqueta": "La app", "vivo": true, "leyenda": "La app real, funcionando. Ábrela para probarla."},
     {"etiqueta": "El anuncio", "ver": "gallery-anuncio", "leyenda": "Anuncio de 15 segundos para estados e historias."},
     {"etiqueta": "Cómo se usa", "ver": "gallery-tutorial", "leyenda": "Instructivo de 37 segundos: instalarla y apartar."}]'::jsonb,
   10)
on conflict (id) do nothing;

insert into public.vs_trabajos (id, tipo, cliente, obra, donde, titulo, resumen, hecho, video_local, video_remoto, poster, sonido, en_destacado, lienzo, vivo, visible, orden) values
  ('gallery-anuncio', 'video', 'Gallery Barber Studio', 'Motion graphic publicitario', 'Santiago, 2026', 'Tu turno, en tu teléfono.',
   'Quince segundos para el estado de WhatsApp y las historias de la barbería: qué es la app, cómo se aparta y la tarjeta de sellos que viene.',
   array['Guion y textos con la voz de Gallery', 'Animación con su identidad: negro, oro y su tipografía', 'Pantallas reales de la app, no simuladas', 'Vertical 9:16 con sonido'],
   '/videos/gallery-promo.mp4', null, '/videos/gallery-promo.jpg', true, true, null, null, true, 20),
  ('gallery-tutorial', 'video', 'Gallery Barber Studio', 'Motion graphic instructivo', 'Santiago, 2026', 'Así se usa la app de Gallery.',
   'Un instructivo de 37 segundos que enseña a guardar la app en el teléfono, en iPhone y en Android, y a apartar el turno paso a paso. Lo que antes explicaba el barbero, ahora lo explica el video.',
   array['Guía para iPhone y para Android', 'Paso a paso de la reserva con pantallas reales', 'Pensado para mandarlo por WhatsApp a cada cliente nuevo'],
   '/videos/gallery-tutorial.mp4', null, '/videos/gallery-tutorial.jpg', true, true, null, null, true, 30),
  ('spot-tu-negocio', 'video', 'Vision Studios', 'Spot publicitario «Tu negocio»', 'Santiago, 2026', null,
   'Un camión de plátanos va torcido porque su dueño se durmió al volante. Lo enderezamos sin pararlo: así trabajamos con un negocio. Idea, guion, dirección y montaje hechos en casa.',
   array['Idea y guion plano a plano', 'Dirección de arte nocturna en la avenida del Monumento', 'Sonido y montaje vertical para Reels y estados'],
   '/videos/spot-tu-negocio.mp4', 'https://d8j0ntlcm91z4.cloudfront.net/user_3Fy5zinm57MfSWOTmON75ozgJVz/hf_20261002_020548_9d73d70d-3ce4-4ce1-8710-7ae7e6faec4f.mp4',
   null, true, false, null, null, true, 40),
  ('reel-lanzamiento', 'video', 'Vision Studios', 'Reel de lanzamiento', 'Santiago, 2026', null,
   'Santiago en 2004, en blanco y negro. Algo cae junto al Monumento y la ciudad pasa al color y a hoy, hasta llegar a los negocios. Incluye a Gallery como caso real.',
   array['Guion y storyboard', 'Previsualización en 3D de encuadres y tiempos', 'Montaje, voces y textos'],
   '/videos/reel-lanzamiento.mp4', 'https://d2ol7oe51mr4n9.cloudfront.net/user_3Fy5zinm57MfSWOTmON75ozgJVz/4c255887-9fd1-46d9-ae08-af9887ce682d.mp4',
   null, true, false, null, null, true, 50),
  ('identidad', 'marca', 'Vision Studios', 'Identidad de marca', 'Santiago, 2026', null,
   'Un ojo cuyo iris es un obturador de seis aspas: ver y capturar en una sola forma. Construida con geometría exacta para que nunca se deforme, con su paleta, su tipografía y sus reglas de uso.',
   array['Marca, logotipo y versiones horizontal y vertical', 'Paleta, tipografía y reglas de uso', 'Kit de archivos en SVG y PNG y presentación de identidad'],
   null, null, null, false, false, 'marca', null, true, 60),
  ('estudio', 'app', 'Estudio Vision', 'Plataforma web con cuentas y créditos', 'Santiago, 2026', null,
   'Una app propia para crear imágenes y video desde el navegador. Entras con Google, recargas créditos y pagas solo lo que generas. La usamos nosotros y la usan nuestros clientes.',
   array['Entrada de un toque con Google', 'Créditos prepagados y panel del dueño', 'Funciona en teléfono, tablet y computadora'],
   null, null, null, false, false, 'estudio', '/estudio', true, 70),
  ('vm-ingenieria', 'app', 'VM Ingeniería y Construcción', 'Página de marca personal', 'Santiago, 2026', null,
   'Página de presentación para una ingeniera civil: servicios, planes y un formulario que llega por WhatsApp y correo, con una identidad de obra en amarillo y negro.',
   array['Identidad de obra con cinta de precaución', 'Planes sin precios y formulario por WhatsApp y correo', 'Personaje de marca'],
   null, null, null, false, false, 'web', 'https://vanewoods.netlify.app', false, 80)
on conflict (id) do nothing;

-- Clientes, proyectos y cobros que ya existen.
with gallery as (
  insert into public.vs_clientes (nombre, contacto, telefono, sector, enlace, oferta, audiencia, objetivo, obstaculo, notas_internas)
  values ('Gallery Barber Studio', 'Edwin', '849-403-0940', 'Barbería / belleza', 'instagram.com/gb_gallery_barber_studio',
    'Cortes, barba, cejas, tintes y facial; corte de adulto RD$500, corte + barba RD$700.',
    'Hombres de Santiago; 40–45 clientes entre viernes y sábado.',
    'Recuperar las citas para trabajar ordenado y tener media hora para comer.',
    'El sistema de citas anterior falló: cancelaban a última hora y llegaban con acompañantes en un mismo turno.',
    'Montaje de lista RD$5,000, a Gallery RD$2,500 por ser el primer caso. Mensual RD$1,500 que se salda en especie (cortes hasta RD$1,000, grabar en el local, referir barberos). El montaje va en transferencia.')
  returning id
), gallery_proyecto as (
  insert into public.vs_proyectos (cliente_id, nombre, oferta_id, etapa, fecha_entrega, nota_cliente)
  select id, 'App de turnos y agenda del barbero', 'apps-paginas', 'entrega', date '2026-09-28',
    'Entregada. Funciones listas para encender después: sellos, referidos, Premium y la barra de café.'
  from gallery returning id, cliente_id
), gallery_cobros as (
  insert into public.vs_cobros (cliente_id, proyecto_id, oferta_id, concepto, tipo, precio, deposito, vencimiento, nota)
  select cliente_id, id, 'apps-paginas', 'Montaje del sistema de turnos', 'proyecto', 2500, 2500, date '2026-09-28',
    'Precio de lista RD$5,000. A Gallery, RD$2,500 por ser el primer caso.'
  from gallery_proyecto
  union all
  select cliente_id, id, 'mantenimiento', 'Mantenimiento octubre 2026', 'mensualidad', 1500, 1500, date '2026-10-05',
    'Se salda en especie: cortes del mes, grabación en el local y referidos. La diferencia va en efectivo.'
  from gallery_proyecto
  returning id
), gallery_entregables as (
  insert into public.vs_entregables (proyecto_id, titulo, enlace, descripcion, estado)
  select id, 'App de turnos (cliente y agenda del barbero)', 'https://gallerybarberstudios.netlify.app', 'La app en su dirección de Netlify.', 'aprobado' from gallery_proyecto
  union all
  select id, 'Motion graphic publicitario (15 s)', '/videos/gallery-promo.mp4', 'Para estados e historias.', 'revision' from gallery_proyecto
  union all
  select id, 'Motion graphic instructivo (37 s)', '/videos/gallery-tutorial.mp4', 'Para mandarlo a cada cliente nuevo.', 'revision' from gallery_proyecto
  returning id
), gallery_app as (
  insert into public.vs_apps (nombre, url, tipo, cliente_id, estado, hosting, mensualidad, notas, orden)
  select 'App de turnos de Gallery', 'https://gallerybarberstudios.netlify.app', 'app', id, 'activo', 'Netlify (gallerybarberstudios)', 1500,
    'Un solo archivo con la página del cliente y la Oficina del barbero. Funciones apagadas en el bloque FEATURES.', 10
  from gallery returning id
), vm as (
  insert into public.vs_clientes (nombre, contacto, telefono, email, sector, enlace, oferta, notas_internas)
  values ('VM Ingeniería y Construcción', 'Ing. Vanessa Madera', '849-374-2510', 'vanessamadera25@gmail.com', 'Servicio profesional',
    'instagram.com/ingvanessamadera', 'Construcción, inspección de inmuebles, remodelación, supervisión estructural, presupuestos y diseños.',
    'Primer cliente, de favor. Faltan fotos reales de obra y su visto bueno al texto de la portada.')
  returning id
), vm_proyecto as (
  insert into public.vs_proyectos (cliente_id, nombre, oferta_id, etapa, nota_cliente)
  select id, 'Página de marca personal', 'apps-paginas', 'aprobacion', 'Publicada en vanewoods.netlify.app; falta tu visto bueno al texto y las fotos de obra.' from vm
  returning id
)
insert into public.vs_apps (nombre, url, tipo, cliente_id, estado, hosting, notas, orden)
select 'Página de VM Ingeniería', 'https://vanewoods.netlify.app', 'pagina', id, 'pausa', 'Netlify (vanewoods)', 'En pausa hasta el visto bueno de Vanessa.', 20 from vm;

insert into public.vs_apps (nombre, url, tipo, estado, hosting, repo, notas, orden) values
  ('Página maestra de Vision Studios', 'https://402visionstudios.com', 'sistema', 'activo', 'Netlify', 'github.com/yooosh0228-ai/Visionstudios',
   'Vitrina, área de clientes, panel de control, Estudio y Agentes en una sola app.', 1),
  ('Marcador 402 (centro de llamadas)', 'https://claude.ai/artifact/J4CDoPkp1san4nvqUDLvPf', 'artifact', 'desarrollo', 'Oracle Cloud (servidor asterisk-402)', '',
   'Falta instalar la central Asterisk y pasar la app a JsSIP.', 30),
  ('Sala de Control de Santi', 'https://claude.ai/artifact/4j2ggbv6dEEPLG8wbW6YNy', 'artifact', 'pausa', 'Claude', '', 'Cola de publicaciones del influencer.', 40),
  ('Mesa de Tomas (storyboards)', 'https://claude.ai/artifact/AbLX4LwBeU5gcFX1YVtgJV', 'artifact', 'activo', 'Claude', '', 'Planear videos en cuadros antes de generarlos.', 50),
  ('Tablero de ventas', 'https://claude.ai/code/artifact/d9aa3be3-6a0a-4790-bc3f-55f342bd828c', 'artifact', 'archivado', 'Claude', '', 'Lo reemplaza Prospectos en el panel.', 60),
  ('Plan de ataque 90 días', 'https://claude.ai/code/artifact/927c8fbf-eb85-462f-b63d-4df67e5f8371', 'artifact', 'activo', 'Claude', '', 'Propuesta; precios marcados como propuesta.', 70),
  ('Tanteo (pádel)', '', 'app', 'desarrollo', 'Mac en la nube', '', 'Uso personal: Apple Watch + iPhone.', 80);

insert into public.vs_prospectos (negocio, contacto, telefono, instagram, sector, oferta_id, estado, proxima_accion, fecha_proxima, nota) values
  ('R&R AutoDetailing', 'El dueño (lo conoces)', '', 'rrautodetailingrd', 'Servicio profesional', 'video-foto', 'contactado',
   'Proponer el video del 3er aniversario (19 de dic, con Don Miguelo y DJ Adoni)', date '2026-10-15',
   'Marginal Sur #10, Autopista Duarte. Dentro opera Taste Factory (@tastefactoryrd). Fecha sugerida: ajústala.'),
  ('Inversiones Fana', '', '', 'inversionesfana', 'Servicio profesional', 'software', 'nuevo',
   'Visita física con la idea del sistema y los servicios', date '2026-10-14', 'Casa de cambio. Fecha sugerida: ajústala.'),
  ('Tenis de paca', '', '809-842-7361', 'tenisdeportivos_802', 'Comercio local', 'pieza-que-vende', 'contactado',
   'Mandar muestra de fotos publicitarias con sus propios tenis', date '2026-10-13',
   'Vende entre RD$2,000 y RD$4,500. Fotos realistas, con más luz, sin inventar detalles. Fecha sugerida: ajústala.'),
  ('Livera Comercial (Freemium Spaces)', '', '', '', 'Servicio profesional', 'video-foto', 'contactado',
   'Retomar con una pieza de muestra nueva', date '2026-10-20', 'Constructora. Descartó la primera versión mejorada del video. Fecha sugerida: ajústala.');

-- Archivos del catálogo (videos e imágenes que el dueño sube desde el panel).
-- Lectura pública para que la portada los muestre; solo el servidor firma subidas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vs-catalogo', 'vs-catalogo', true, 52428800, array['video/mp4', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
