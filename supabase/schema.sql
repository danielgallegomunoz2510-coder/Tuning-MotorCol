-- =============================================================================
--  TUNNING MOTORCOL — Esquema lógico (11 tablas, 3FN)
--  Alineado con el documento "Diseño Lógico de Base de Datos".
--  Ejecutar completo en el SQL Editor de Supabase (proyecto NUEVO o tras
--  respaldar datos). Luego ejecutar supabase/seed.sql.
-- =============================================================================

-- Limpieza del esquema anterior (legacy) -------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.solicitudes_cotizacion cascade;
drop table if exists public.configuraciones cascade;
drop function if exists public.handle_new_user() cascade;

-- 1. perfiles ----------------------------------------------------------------
create table if not exists public.perfiles (
  id_perfil              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo        varchar(120) not null,
  celular                varchar(20)  unique,
  ciudad                 varchar(80),
  departamento           varchar(80),
  autorizacion_comercial boolean      not null default false,
  creado_en              timestamptz  not null default now()
);

-- 2. categorias_vehiculo -----------------------------------------------------
create table if not exists public.categorias_vehiculo (
  id_categoria_vehiculo bigint generated always as identity primary key,
  nombre                varchar(60) not null unique,
  descripcion           text,
  activo                boolean not null default true
);

-- 3. vehiculos ---------------------------------------------------------------
create table if not exists public.vehiculos (
  id_vehiculo           uuid primary key default gen_random_uuid(),
  id_categoria_vehiculo bigint not null references public.categorias_vehiculo(id_categoria_vehiculo),
  codigo                varchar(40) not null unique,          -- id usado por el frontend ('brz', 'raptor', 'mustang', 'huracan')
  nombre                varchar(120) not null,
  fabricante            varchar(80) not null,
  descripcion           text,
  precio_base           numeric(14,2) not null check (precio_base >= 0),
  especificaciones      jsonb not null default '{}'::jsonb,
  modelo_3d_url         text,
  miniatura_url         text,
  activo                boolean not null default true
);

-- 4. categorias_pieza --------------------------------------------------------
create table if not exists public.categorias_pieza (
  id_categoria_pieza bigint generated always as identity primary key,
  nombre             varchar(60) not null unique,
  orden_visual       smallint not null default 0
);

-- 5. piezas ------------------------------------------------------------------
create table if not exists public.piezas (
  id_pieza            uuid primary key default gen_random_uuid(),
  id_categoria_pieza  bigint not null references public.categorias_pieza(id_categoria_pieza),
  codigo              varchar(40) not null unique,            -- = id de control o código PART_LIBRARY
  nombre              varchar(120) not null,
  descripcion         text,
  precio_adicional    numeric(14,2) not null default 0 check (precio_adicional >= 0),
  tipo_control        varchar(20) not null
                      check (tipo_control in ('palette','toggle','range','select','segmented')),
  valor_configuracion jsonb not null default '{}'::jsonb,
  recurso_3d_url      text,                                   -- GLB TMC v1 (public/models/parts/...)
  activo              boolean not null default true
);

-- 6. compatibilidades (N:M vehiculos-piezas) ---------------------------------
create table if not exists public.compatibilidades (
  id_vehiculo  uuid not null references public.vehiculos(id_vehiculo) on delete cascade,
  id_pieza     uuid not null references public.piezas(id_pieza) on delete cascade,
  disponible   boolean not null default true,
  observacion  text,
  primary key (id_vehiculo, id_pieza)
);

-- 7. configuraciones ---------------------------------------------------------
create table if not exists public.configuraciones (
  id_configuracion     uuid primary key default gen_random_uuid(),
  id_perfil            uuid not null references public.perfiles(id_perfil) on delete cascade,
  id_vehiculo          uuid not null references public.vehiculos(id_vehiculo),
  nombre               varchar(120) not null,
  precio_base_aplicado numeric(14,2) not null check (precio_base_aplicado >= 0),
  precio_total         numeric(14,2) not null check (precio_total >= 0),
  estado               varchar(12) not null default 'guardada'
                       check (estado in ('borrador','guardada','enviada')),
  -- Instantánea del documento de configuración del visor 3D (para reabrirla tal cual).
  -- Las piezas elegidas quedan normalizadas en configuracion_detalles.
  config_snapshot      jsonb not null default '{}'::jsonb,
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now()
);
create index if not exists idx_config_perfil on public.configuraciones(id_perfil);

-- 8. configuracion_detalles --------------------------------------------------
create table if not exists public.configuracion_detalles (
  id_detalle         uuid primary key default gen_random_uuid(),
  id_configuracion   uuid not null references public.configuraciones(id_configuracion) on delete cascade,
  id_pieza           uuid not null references public.piezas(id_pieza),
  valor_seleccionado jsonb not null default '{}'::jsonb,
  precio_aplicado    numeric(14,2) not null default 0 check (precio_aplicado >= 0),
  unique (id_configuracion, id_pieza)
);

-- 10. estados_solicitud (catálogo; se crea antes por la FK) ------------------
create table if not exists public.estados_solicitud (
  id_estado_solicitud smallint primary key,
  nombre              varchar(40) not null unique,
  descripcion         text,
  orden               smallint not null
);

-- 9. solicitudes_cotizacion --------------------------------------------------
create sequence if not exists public.seq_codigo_solicitud;
create table if not exists public.solicitudes_cotizacion (
  id_solicitud         uuid primary key default gen_random_uuid(),
  codigo               varchar(12) not null unique
                       default ('AM-' || lpad(nextval('public.seq_codigo_solicitud')::text, 6, '0')),
  id_configuracion     uuid not null references public.configuraciones(id_configuracion) on delete cascade,
  id_estado_solicitud  smallint not null default 1 references public.estados_solicitud(id_estado_solicitud),
  mensaje_cliente      text,
  respuesta_fabricante text,
  total_cotizado       numeric(14,2) not null check (total_cotizado >= 0),
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now()
);

-- 11. historial_solicitud ----------------------------------------------------
create table if not exists public.historial_solicitud (
  id_historial        uuid primary key default gen_random_uuid(),
  id_solicitud        uuid not null references public.solicitudes_cotizacion(id_solicitud) on delete cascade,
  id_estado_solicitud smallint not null references public.estados_solicitud(id_estado_solicitud),
  cambiado_por        uuid references auth.users(id),
  observacion         text,
  creado_en           timestamptz not null default now()
);

-- =============================================================================
--  Triggers y reglas de negocio
-- =============================================================================

-- Perfil automático al registrarse (metadatos enviados por signUp).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id_perfil, nombre_completo, celular, ciudad, departamento, autorizacion_comercial)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre_completo', new.email),
    nullif(new.raw_user_meta_data->>'celular', ''),
    new.raw_user_meta_data->>'ciudad',
    new.raw_user_meta_data->>'departamento',
    coalesce((new.raw_user_meta_data->>'autorizacion_comercial')::boolean, false)
  ) on conflict (id_perfil) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- actualizado_en
create or replace function public.tg_touch() returns trigger language plpgsql as $$
begin new.actualizado_en := now(); return new; end $$;
drop trigger if exists touch_config on public.configuraciones;
create trigger touch_config before update on public.configuraciones
  for each row execute function public.tg_touch();
drop trigger if exists touch_solicitud on public.solicitudes_cotizacion;
create trigger touch_solicitud before update on public.solicitudes_cotizacion
  for each row execute function public.tg_touch();

-- Una pieza solo puede usarse en un vehículo con el que sea compatible.
create or replace function public.tg_check_compatibilidad()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.compatibilidades c
    join public.configuraciones cf on cf.id_vehiculo = c.id_vehiculo
    where cf.id_configuracion = new.id_configuracion
      and c.id_pieza = new.id_pieza and c.disponible
  ) then
    raise exception 'La pieza % no es compatible con el vehículo de la configuración', new.id_pieza
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists check_compat on public.configuracion_detalles;
create trigger check_compat before insert or update on public.configuracion_detalles
  for each row execute function public.tg_check_compatibilidad();

-- Historial automático de cambios de estado.
create or replace function public.tg_historial_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.id_estado_solicitud is distinct from old.id_estado_solicitud then
    insert into public.historial_solicitud (id_solicitud, id_estado_solicitud, cambiado_por, observacion)
    values (new.id_solicitud, new.id_estado_solicitud, auth.uid(),
            case when tg_op = 'INSERT' then 'Solicitud creada' else new.respuesta_fabricante end);
  end if;
  return new;
end $$;
drop trigger if exists historial_solicitud on public.solicitudes_cotizacion;
create trigger historial_solicitud after insert or update on public.solicitudes_cotizacion
  for each row execute function public.tg_historial_solicitud();

-- =============================================================================
--  Funciones seguras (RPC) usadas por el frontend
-- =============================================================================

-- Guarda una configuración y sus detalles en una sola transacción.
-- p_detalles: [{ "codigo": "rim_malla", "valor": {...}, "precio": 5200000 }, ...]
create or replace function public.guardar_configuracion(
  p_vehiculo_codigo text, p_nombre text, p_config jsonb,
  p_precio_total numeric, p_detalles jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_veh public.vehiculos; v_id uuid; d jsonb;
begin
  if auth.uid() is null then raise exception 'No hay sesión activa'; end if;
  select * into v_veh from vehiculos where codigo = p_vehiculo_codigo and activo;
  if not found then raise exception 'Vehículo % no existe', p_vehiculo_codigo; end if;

  insert into configuraciones (id_perfil, id_vehiculo, nombre, precio_base_aplicado, precio_total, estado, config_snapshot)
  values (auth.uid(), v_veh.id_vehiculo, left(p_nombre, 120), v_veh.precio_base, p_precio_total, 'guardada', coalesce(p_config, '{}'))
  returning id_configuracion into v_id;

  for d in select * from jsonb_array_elements(coalesce(p_detalles, '[]'::jsonb)) loop
    insert into configuracion_detalles (id_configuracion, id_pieza, valor_seleccionado, precio_aplicado)
    select v_id, p.id_pieza, coalesce(d->'valor', '{}'), coalesce((d->>'precio')::numeric, 0)
    from piezas p where p.codigo = d->>'codigo' and p.activo
    on conflict (id_configuracion, id_pieza) do nothing;
  end loop;
  return v_id;
end $$;

-- Crea la solicitud de cotización de una configuración propia.
create or replace function public.crear_solicitud(p_id_configuracion uuid, p_mensaje text default '')
returns public.solicitudes_cotizacion language plpgsql security definer set search_path = public as $$
declare v_cfg public.configuraciones; v_sol public.solicitudes_cotizacion;
begin
  select * into v_cfg from configuraciones
   where id_configuracion = p_id_configuracion and id_perfil = auth.uid();
  if not found then raise exception 'Configuración no encontrada'; end if;
  update configuraciones set estado = 'enviada' where id_configuracion = v_cfg.id_configuracion;
  insert into solicitudes_cotizacion (id_configuracion, mensaje_cliente, total_cotizado)
  values (v_cfg.id_configuracion, p_mensaje, v_cfg.precio_total)
  returning * into v_sol;
  return v_sol;
end $$;

-- Cambio de estado (solo personal del fabricante: service_role / panel admin).
create or replace function public.cambiar_estado_solicitud(
  p_id_solicitud uuid, p_id_estado smallint, p_respuesta text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update solicitudes_cotizacion
     set id_estado_solicitud = p_id_estado,
         respuesta_fabricante = coalesce(p_respuesta, respuesta_fabricante)
   where id_solicitud = p_id_solicitud;
end $$;
revoke all on function public.cambiar_estado_solicitud(uuid, smallint, text) from public, anon, authenticated;

-- =============================================================================
--  Row Level Security
-- =============================================================================
alter table public.perfiles               enable row level security;
alter table public.categorias_vehiculo    enable row level security;
alter table public.vehiculos              enable row level security;
alter table public.categorias_pieza       enable row level security;
alter table public.piezas                 enable row level security;
alter table public.compatibilidades       enable row level security;
alter table public.configuraciones        enable row level security;
alter table public.configuracion_detalles enable row level security;
alter table public.solicitudes_cotizacion enable row level security;
alter table public.estados_solicitud      enable row level security;
alter table public.historial_solicitud    enable row level security;

-- Catálogo: lectura pública de lo activo; escritura solo service_role.
create policy cat_veh_read  on public.categorias_vehiculo for select using (activo);
create policy veh_read      on public.vehiculos           for select using (activo);
create policy cat_pz_read   on public.categorias_pieza    for select using (true);
create policy piezas_read   on public.piezas              for select using (activo);
create policy compat_read   on public.compatibilidades    for select using (true);
create policy estados_read  on public.estados_solicitud   for select using (true);

-- Perfil: cada usuario el suyo.
create policy perfil_select on public.perfiles for select using (id_perfil = auth.uid());
create policy perfil_update on public.perfiles for update using (id_perfil = auth.uid()) with check (id_perfil = auth.uid());

-- Configuraciones del dueño (la inserción va por guardar_configuracion).
create policy cfg_select on public.configuraciones for select using (id_perfil = auth.uid());
create policy cfg_update on public.configuraciones for update using (id_perfil = auth.uid()) with check (id_perfil = auth.uid());
create policy cfg_delete on public.configuraciones for delete using (id_perfil = auth.uid() and estado <> 'enviada');

create policy det_select on public.configuracion_detalles for select using (
  exists (select 1 from public.configuraciones c where c.id_configuracion = configuracion_detalles.id_configuracion and c.id_perfil = auth.uid()));

-- Solicitudes: lectura del dueño; creación vía crear_solicitud; estado solo vía función segura.
create policy sol_select on public.solicitudes_cotizacion for select using (
  exists (select 1 from public.configuraciones c where c.id_configuracion = solicitudes_cotizacion.id_configuracion and c.id_perfil = auth.uid()));
create policy sol_delete on public.solicitudes_cotizacion for delete using (
  id_estado_solicitud = 1 and exists (select 1 from public.configuraciones c
    where c.id_configuracion = solicitudes_cotizacion.id_configuracion and c.id_perfil = auth.uid()));

create policy hist_select on public.historial_solicitud for select using (
  exists (select 1 from public.solicitudes_cotizacion s join public.configuraciones c using (id_configuracion)
          where s.id_solicitud = historial_solicitud.id_solicitud and c.id_perfil = auth.uid()));

-- Vista de apoyo para el frontend (respeta RLS de las tablas base).
create or replace view public.v_mis_solicitudes with (security_invoker = true) as
select s.id_solicitud, s.codigo, s.mensaje_cliente, s.respuesta_fabricante, s.total_cotizado,
       s.creado_en, e.nombre as estado, e.id_estado_solicitud,
       v.codigo as vehiculo_codigo, v.nombre as vehiculo_nombre, c.config_snapshot, c.nombre as configuracion
from public.solicitudes_cotizacion s
join public.estados_solicitud e using (id_estado_solicitud)
join public.configuraciones c using (id_configuracion)
join public.vehiculos v on v.id_vehiculo = c.id_vehiculo;
