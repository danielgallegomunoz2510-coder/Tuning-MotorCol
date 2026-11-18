-- seed.sql — datos iniciales (generado desde src/data/catalog.js y vehicles.js)
-- Ejecutar después de schema.sql. Idempotente (on conflict do nothing/update).

insert into public.estados_solicitud (id_estado_solicitud, nombre, descripcion, orden) values
 (1,'Pendiente','Recibida, sin revisar',1),(2,'En revisión','El fabricante la está evaluando',2),(3,'Requiere ajustes','El cliente debe modificar la configuración',3),(4,'Confirmada','Cotización aprobada',4)
on conflict do nothing;

insert into public.categorias_vehiculo (nombre) values ('Deportivo'),('Pickup') on conflict (nombre) do nothing;

insert into public.vehiculos (codigo, id_categoria_vehiculo, nombre, fabricante, descripcion, precio_base, especificaciones, modelo_3d_url, miniatura_url)
select 'brz', id_categoria_vehiculo, 'Subaru BRZ', 'Subaru', 'Coupé deportivo de tracción trasera. Modelo preparado con piezas intercambiables (alerón, parachoques, capó, espejos, ruedas) y puntos de anclaje.', 145000000, '{"motor":"2.0 Bóxer","potencia":"200 hp","traccion":"Trasera","0-100":"7.6 s"}'::jsonb, 'models/brz/brz.glb', 'thumbnails/brz.jpg'
from public.categorias_vehiculo where nombre = 'Deportivo'
on conflict (codigo) do update set modelo_3d_url = excluded.modelo_3d_url, precio_base = excluded.precio_base;
insert into public.vehiculos (codigo, id_categoria_vehiculo, nombre, fabricante, descripcion, precio_base, especificaciones, modelo_3d_url, miniatura_url)
select 'raptor', id_categoria_vehiculo, 'Ford F-150 Raptor', 'Ford', 'Pickup de alto desempeño todoterreno. Rines beadlock con llantas AT, levante de suspensión, bumper con winche, barra LED, rack con repuesto, snorkel y kit Dakar.', 390000000, '{"motor":"3.5 V6 EcoBoost","potencia":"450 hp","traccion":"4x4","0-100":"5.8 s"}'::jsonb, 'models/raptor/raptor.glb', 'thumbnails/raptor.jpg'
from public.categorias_vehiculo where nombre = 'Pickup'
on conflict (codigo) do update set modelo_3d_url = excluded.modelo_3d_url, precio_base = excluded.precio_base;
insert into public.vehiculos (codigo, id_categoria_vehiculo, nombre, fabricante, descripcion, precio_base, especificaciones, modelo_3d_url, miniatura_url)
select 'mustang', id_categoria_vehiculo, 'Ford Mustang GT', 'Ford', 'Muscle car V8. Rines torque-thrust y deep-dish, capó con toma o shaker, ducktail o ala drag, kit muscle con escape cuádruple y franjas rally.', 330000000, '{"motor":"5.0 V8 Coyote","potencia":"480 hp","traccion":"Trasera","0-100":"4.3 s"}'::jsonb, 'models/mustang/mustang.glb', 'thumbnails/mustang.jpg'
from public.categorias_vehiculo where nombre = 'Deportivo'
on conflict (codigo) do update set modelo_3d_url = excluded.modelo_3d_url, precio_base = excluded.precio_base;
insert into public.vehiculos (codigo, id_categoria_vehiculo, nombre, fabricante, descripcion, precio_base, especificaciones, modelo_3d_url, miniatura_url)
select 'huracan', id_categoria_vehiculo, 'Lamborghini Huracán', 'Lamborghini', 'Superdeportivo V10. Ala cuello de cisne, kit GT3 widebody con splitter y canards, capó ventilado, aleta de tiburón y rines center-lock.', 1250000000, '{"motor":"5.2 V10","potencia":"640 hp","traccion":"AWD","0-100":"2.9 s"}'::jsonb, 'models/huracan/huracan.glb', 'thumbnails/huracan.jpg'
from public.categorias_vehiculo where nombre = 'Deportivo'
on conflict (codigo) do update set modelo_3d_url = excluded.modelo_3d_url, precio_base = excluded.precio_base;

insert into public.categorias_pieza (nombre, orden_visual) values ('pintura', 1) on conflict (nombre) do nothing;
insert into public.categorias_pieza (nombre, orden_visual) values ('ruedas', 2) on conflict (nombre) do nothing;
insert into public.categorias_pieza (nombre, orden_visual) values ('frenos', 3) on conflict (nombre) do nothing;
insert into public.categorias_pieza (nombre, orden_visual) values ('cristales', 4) on conflict (nombre) do nothing;
insert into public.categorias_pieza (nombre, orden_visual) values ('postura', 5) on conflict (nombre) do nothing;
insert into public.categorias_pieza (nombre, orden_visual) values ('interior', 6) on conflict (nombre) do nothing;
insert into public.categorias_pieza (nombre, orden_visual) values ('carroceria', 7) on conflict (nombre) do nothing;

insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'paint.color', 'Color de carrocería', 0, 'palette', '{"path":["paint","color"],"options":[]}'::jsonb, null from public.categorias_pieza where nombre = 'pintura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'paint.finish', 'Tipo de pintura', 0, 'segmented', '{"path":["paint","finish"],"options":[{"value":"solid","label":"Sólida","price":0},{"value":"metallic","label":"Metalizada","price":4500000},{"value":"matte","label":"Mate","price":6500000}]}'::jsonb, null from public.categorias_pieza where nombre = 'pintura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rims.design', 'Diseño de rin', 0, 'select', '{"path":["rims","design"],"options":[{"value":"pulido","label":"De serie · pulido","price":0},{"value":"turbofan","label":"De serie · turbofan mate","price":2200000}]}'::jsonb, null from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rim_cinco', 'Diseño de rin: Forjado 5 radios cóncavo', 3900000, 'select', '{"path":["rims","design"],"value":"cinco","slot":"rims","replaces":[]}'::jsonb, 'models/parts/rim-cinco.glb' from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rim_multirayo', 'Diseño de rin: Multirayo direccional (20)', 4600000, 'select', '{"path":["rims","design"],"value":"multirayo","slot":"rims","replaces":[]}'::jsonb, 'models/parts/rim-multirayo.glb' from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rim_malla', 'Diseño de rin: Malla cruzada competición', 5200000, 'select', '{"path":["rims","design"],"value":"malla","slot":"rims","replaces":[]}'::jsonb, 'models/parts/rim-malla.glb' from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rim_beadlock', 'Diseño de rin: Beadlock off-road + llanta AT 35"', 9800000, 'select', '{"path":["rims","design"],"value":"beadlock","slot":"rims","replaces":[],"lift":0.032}'::jsonb, 'models/parts/rim-beadlock-raptor.glb' from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rim_torque', 'Diseño de rin: Torque-thrust clásico (muscle)', 4400000, 'select', '{"path":["rims","design"],"value":"torque","slot":"rims","replaces":[]}'::jsonb, 'models/parts/rim-torque-mustang.glb' from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rim_deepdish', 'Diseño de rin: Deep-dish cromado', 5100000, 'select', '{"path":["rims","design"],"value":"deepdish","slot":"rims","replaces":[]}'::jsonb, 'models/parts/rim-deepdish-mustang.glb' from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rim_centerlock', 'Diseño de rin: Center-lock GT3 (tuerca central)', 7900000, 'select', '{"path":["rims","design"],"value":"centerlock","slot":"rims","replaces":[]}'::jsonb, 'models/parts/rim-centerlock-huracan.glb' from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rims.size', 'Tamaño de rin', 0, 'segmented', '{"path":["rims","size"],"options":[{"value":19,"label":"19\"","price":0},{"value":20,"label":"20\"","price":3500000},{"value":22,"label":"22\"","price":6800000}]}'::jsonb, null from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rims.color', 'Color de rin', 0, 'palette', '{"path":["rims","color"],"options":[]}'::jsonb, null from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'tires', 'Cambiar neumáticos (deportivos semi-slick)', 3200000, 'toggle', '{"path":["extras","tires"],"options":[]}'::jsonb, null from public.categorias_pieza where nombre = 'ruedas'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'calipers.painted', 'Pinzas de freno pintadas', 1500000, 'toggle', '{"path":["calipers","painted"],"options":[]}'::jsonb, null from public.categorias_pieza where nombre = 'frenos'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'calipers.color', 'Color de pinzas', 0, 'palette', '{"path":["calipers","color"],"options":[]}'::jsonb, null from public.categorias_pieza where nombre = 'frenos'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'tint.level', 'Polarizado', 0, 'range', '{"path":["tint","level"],"options":[],"min":0,"max":5}'::jsonb, null from public.categorias_pieza where nombre = 'cristales'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'lights.tinted', 'Luces ahumadas (dark)', 1800000, 'toggle', '{"path":["lights","tinted"],"options":[]}'::jsonb, null from public.categorias_pieza where nombre = 'cristales'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'suspension.drop', 'Suspensión (altura)', 0, 'range', '{"path":["suspension","drop"],"options":[],"min":0,"max":4}'::jsonb, null from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'suspension.lift', 'Levante de suspensión (off-road)', 0, 'range', '{"path":["suspension","lift"],"options":[],"min":0,"max":3}'::jsonb, null from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'spoiler.type', 'Alerón', 0, 'segmented', '{"path":["spoiler","type"],"options":[{"value":"serie","label":"De serie","price":0}]}'::jsonb, null from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'spoiler_lip', 'Alerón: Lip carbono', 1900000, 'segmented', '{"path":["spoiler","type"],"value":"lip","slot":"spoiler","replaces":["spoiler"]}'::jsonb, 'models/parts/spoiler-lip.glb' from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'spoiler_ducktail', 'Alerón: Ducktail', 3800000, 'segmented', '{"path":["spoiler","type"],"value":"ducktail","slot":"spoiler","replaces":["spoiler"]}'::jsonb, 'models/parts/spoiler-ducktail.glb' from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'spoiler_gt', 'Alerón: Ala GT', 5400000, 'segmented', '{"path":["spoiler","type"],"value":"gt","slot":"spoiler","replaces":["spoiler"]}'::jsonb, 'models/parts/spoiler-gt.glb' from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'spoiler_mducktail', 'Alerón: Ducktail muscle', 3600000, 'segmented', '{"path":["spoiler","type"],"value":"mducktail","slot":"spoiler","replaces":["spoiler"]}'::jsonb, 'models/parts/spoiler-ducktail-mustang.glb' from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'spoiler_dragwing', 'Alerón: Ala drag alta', 4900000, 'segmented', '{"path":["spoiler","type"],"value":"dragwing","slot":"spoiler","replaces":["spoiler"]}'::jsonb, 'models/parts/spoiler-dragwing-mustang.glb' from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'spoiler_gt3', 'Alerón: Ala GT3 cuello de cisne', 11500000, 'segmented', '{"path":["spoiler","type"],"value":"gt3","slot":"spoiler","replaces":[]}'::jsonb, 'models/parts/spoiler-gt3-huracan.glb' from public.categorias_pieza where nombre = 'postura'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'interior.trim', 'Tapizado', 0, 'select', '{"path":["interior","trim"],"options":[{"value":"estandar","label":"Estándar (tela técnica)","price":0},{"value":"cuero-negro","label":"Cuero premium negro","price":8500000},{"value":"cuero-rojo","label":"Cuero rojo deportivo","price":9500000},{"value":"cuero-cognac","label":"Cuero cognac","price":9000000}]}'::jsonb, null from public.categorias_pieza where nombre = 'interior'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'extras.bodykit', 'Body kit', 0, 'segmented', '{"path":["extras","bodykit"],"options":[{"value":"serie","label":"De serie","price":0}]}'::jsonb, null from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'bodykit_street', 'Body kit: Street (lip, faldones, difusor)', 8500000, 'segmented', '{"path":["extras","bodykit"],"value":"street","slot":"bodykit","replaces":[]}'::jsonb, 'models/parts/bodykit-street.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'bodykit_track', 'Body kit: Track (parachoques + aero)', 14500000, 'segmented', '{"path":["extras","bodykit"],"value":"track","slot":"bodykit","replaces":["bumper_front","bumper_rear"]}'::jsonb, 'models/parts/bodykit-track.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'bodykit_dakar', 'Body kit: Dakar (guardabarros, skid plate, estribos)', 12500000, 'segmented', '{"path":["extras","bodykit"],"value":"dakar","slot":"bodykit","replaces":[]}'::jsonb, 'models/parts/bodykit-dakar-raptor.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'bodykit_muscle', 'Body kit: Muscle (splitter, flares, difusor, escape ×4)', 11800000, 'segmented', '{"path":["extras","bodykit"],"value":"muscle","slot":"bodykit","replaces":[]}'::jsonb, 'models/parts/bodykit-muscle-mustang.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'bodykit_gt3', 'Body kit: GT3 widebody (splitter, canards, difusor)', 24000000, 'segmented', '{"path":["extras","bodykit"],"value":"gt3","slot":"bodykit","replaces":[]}'::jsonb, 'models/parts/bodykit-gt3-huracan.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'extras.hood', 'Capó', 0, 'segmented', '{"path":["extras","hood"],"options":[{"value":"serie","label":"De serie","price":0}]}'::jsonb, null from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'hood_vented', 'Capó: Carbono con tomas de aire', 7800000, 'segmented', '{"path":["extras","hood"],"value":"vented","slot":"hood","replaces":["hood"]}'::jsonb, 'models/parts/hood-vented.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'hood_scoop', 'Capó: Con toma de aire (scoop)', 5200000, 'segmented', '{"path":["extras","hood"],"value":"scoop","slot":"hood","replaces":["hood"]}'::jsonb, 'models/parts/hood-scoop-mustang.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'hood_shaker', 'Capó: Shaker', 6900000, 'segmented', '{"path":["extras","hood"],"value":"shaker","slot":"hood","replaces":["hood"]}'::jsonb, 'models/parts/hood-shaker-mustang.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'hood_gt3', 'Capó: GT3 con extractores', 9500000, 'segmented', '{"path":["extras","hood"],"value":"gt3","slot":"hood","replaces":["hood"]}'::jsonb, 'models/parts/hood-gt3-huracan.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'mirrors_aero', 'Espejos aerodinámicos', 2100000, 'toggle', '{"path":["extras","mirrors"],"value":true,"slot":"mirrors","replaces":["mirrors"]}'::jsonb, 'models/parts/mirrors-aero.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'extras.frontbumper', 'Bumper delantero', 0, 'segmented', '{"path":["extras","frontbumper"],"options":[{"value":"serie","label":"De serie","price":0}]}'::jsonb, null from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'bumper_winch', 'Bumper delantero: Acero con winche', 8900000, 'segmented', '{"path":["extras","frontbumper"],"value":"winch","slot":"frontbumper","replaces":["bumper_front"]}'::jsonb, 'models/parts/bumper-winch-raptor.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'lightbar_led', 'Barra LED de techo', 2800000, 'toggle', '{"path":["extras","lightbar"],"value":true,"slot":"lightbar","replaces":[]}'::jsonb, 'models/parts/lightbar-raptor.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'rack_spare', 'Rack de platón con llanta de repuesto', 6400000, 'toggle', '{"path":["extras","rack"],"value":true,"slot":"rack","replaces":[]}'::jsonb, 'models/parts/rack-spare-raptor.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'snorkel', 'Snorkel', 2300000, 'toggle', '{"path":["extras","snorkel"],"value":true,"slot":"snorkel","replaces":[]}'::jsonb, 'models/parts/snorkel-raptor.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'stripes_rally', 'Franjas rally (racing stripes)', 2600000, 'toggle', '{"path":["extras","stripes"],"value":true,"slot":"stripes","replaces":[]}'::jsonb, 'models/parts/stripes-mustang.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'sharkfin', 'Aleta de tiburón (shark fin)', 3400000, 'toggle', '{"path":["extras","sharkfin"],"value":true,"slot":"sharkfin","replaces":[]}'::jsonb, 'models/parts/sharkfin-huracan.glb' from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;
insert into public.piezas (id_categoria_pieza, codigo, nombre, precio_adicional, tipo_control, valor_configuracion, recurso_3d_url)
select id_categoria_pieza, 'vinyl', 'Vinilos / gráficos', 3600000, 'toggle', '{"path":["extras","vinyl"],"options":[]}'::jsonb, null from public.categorias_pieza where nombre = 'carroceria'
on conflict (codigo) do update set recurso_3d_url = excluded.recurso_3d_url, precio_adicional = excluded.precio_adicional, valor_configuracion = excluded.valor_configuracion;

-- Compatibilidades por vehículo (campo `vehicles` de catalog.js). Cada kit es específico
-- de su modelo TMC v1 (BRZ, Raptor, Mustang, Huracán).
insert into public.compatibilidades (id_vehiculo, id_pieza, disponible, observacion)
select v.id_vehiculo, p.id_pieza, x.disponible, x.observacion
from (values
  ('brz', 'paint.color', true, null),
  ('raptor', 'paint.color', true, null),
  ('mustang', 'paint.color', true, null),
  ('huracan', 'paint.color', true, null),
  ('brz', 'paint.finish', true, null),
  ('raptor', 'paint.finish', true, null),
  ('mustang', 'paint.finish', true, null),
  ('huracan', 'paint.finish', true, null),
  ('brz', 'rims.design', true, null),
  ('raptor', 'rims.design', true, null),
  ('mustang', 'rims.design', true, null),
  ('huracan', 'rims.design', true, null),
  ('brz', 'rim_cinco', true, null),
  ('raptor', 'rim_cinco', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'rim_cinco', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'rim_cinco', false, 'Pieza específica de otro vehículo'),
  ('brz', 'rim_multirayo', true, null),
  ('raptor', 'rim_multirayo', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'rim_multirayo', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'rim_multirayo', false, 'Pieza específica de otro vehículo'),
  ('brz', 'rim_malla', true, null),
  ('raptor', 'rim_malla', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'rim_malla', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'rim_malla', false, 'Pieza específica de otro vehículo'),
  ('brz', 'rim_beadlock', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'rim_beadlock', true, null),
  ('mustang', 'rim_beadlock', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'rim_beadlock', false, 'Pieza específica de otro vehículo'),
  ('brz', 'rim_torque', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'rim_torque', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'rim_torque', true, null),
  ('huracan', 'rim_torque', false, 'Pieza específica de otro vehículo'),
  ('brz', 'rim_deepdish', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'rim_deepdish', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'rim_deepdish', true, null),
  ('huracan', 'rim_deepdish', false, 'Pieza específica de otro vehículo'),
  ('brz', 'rim_centerlock', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'rim_centerlock', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'rim_centerlock', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'rim_centerlock', true, null),
  ('brz', 'rims.size', true, null),
  ('raptor', 'rims.size', true, null),
  ('mustang', 'rims.size', true, null),
  ('huracan', 'rims.size', true, null),
  ('brz', 'rims.color', true, null),
  ('raptor', 'rims.color', true, null),
  ('mustang', 'rims.color', true, null),
  ('huracan', 'rims.color', true, null),
  ('brz', 'tires', true, null),
  ('raptor', 'tires', true, null),
  ('mustang', 'tires', true, null),
  ('huracan', 'tires', true, null),
  ('brz', 'calipers.painted', true, null),
  ('raptor', 'calipers.painted', true, null),
  ('mustang', 'calipers.painted', true, null),
  ('huracan', 'calipers.painted', true, null),
  ('brz', 'calipers.color', true, null),
  ('raptor', 'calipers.color', true, null),
  ('mustang', 'calipers.color', true, null),
  ('huracan', 'calipers.color', true, null),
  ('brz', 'tint.level', true, null),
  ('raptor', 'tint.level', true, null),
  ('mustang', 'tint.level', true, null),
  ('huracan', 'tint.level', true, null),
  ('brz', 'lights.tinted', true, null),
  ('raptor', 'lights.tinted', true, null),
  ('mustang', 'lights.tinted', true, null),
  ('huracan', 'lights.tinted', true, null),
  ('brz', 'suspension.drop', true, null),
  ('raptor', 'suspension.drop', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'suspension.drop', true, null),
  ('huracan', 'suspension.drop', true, null),
  ('brz', 'suspension.lift', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'suspension.lift', true, null),
  ('mustang', 'suspension.lift', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'suspension.lift', false, 'Pieza específica de otro vehículo'),
  ('brz', 'spoiler.type', true, null),
  ('raptor', 'spoiler.type', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'spoiler.type', true, null),
  ('huracan', 'spoiler.type', true, null),
  ('brz', 'spoiler_lip', true, null),
  ('raptor', 'spoiler_lip', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'spoiler_lip', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'spoiler_lip', false, 'Pieza específica de otro vehículo'),
  ('brz', 'spoiler_ducktail', true, null),
  ('raptor', 'spoiler_ducktail', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'spoiler_ducktail', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'spoiler_ducktail', false, 'Pieza específica de otro vehículo'),
  ('brz', 'spoiler_gt', true, null),
  ('raptor', 'spoiler_gt', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'spoiler_gt', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'spoiler_gt', false, 'Pieza específica de otro vehículo'),
  ('brz', 'spoiler_mducktail', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'spoiler_mducktail', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'spoiler_mducktail', true, null),
  ('huracan', 'spoiler_mducktail', false, 'Pieza específica de otro vehículo'),
  ('brz', 'spoiler_dragwing', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'spoiler_dragwing', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'spoiler_dragwing', true, null),
  ('huracan', 'spoiler_dragwing', false, 'Pieza específica de otro vehículo'),
  ('brz', 'spoiler_gt3', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'spoiler_gt3', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'spoiler_gt3', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'spoiler_gt3', true, null),
  ('brz', 'interior.trim', true, null),
  ('raptor', 'interior.trim', true, null),
  ('mustang', 'interior.trim', true, null),
  ('huracan', 'interior.trim', true, null),
  ('brz', 'extras.bodykit', true, null),
  ('raptor', 'extras.bodykit', true, null),
  ('mustang', 'extras.bodykit', true, null),
  ('huracan', 'extras.bodykit', true, null),
  ('brz', 'bodykit_street', true, null),
  ('raptor', 'bodykit_street', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'bodykit_street', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'bodykit_street', false, 'Pieza específica de otro vehículo'),
  ('brz', 'bodykit_track', true, null),
  ('raptor', 'bodykit_track', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'bodykit_track', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'bodykit_track', false, 'Pieza específica de otro vehículo'),
  ('brz', 'bodykit_dakar', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'bodykit_dakar', true, null),
  ('mustang', 'bodykit_dakar', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'bodykit_dakar', false, 'Pieza específica de otro vehículo'),
  ('brz', 'bodykit_muscle', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'bodykit_muscle', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'bodykit_muscle', true, null),
  ('huracan', 'bodykit_muscle', false, 'Pieza específica de otro vehículo'),
  ('brz', 'bodykit_gt3', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'bodykit_gt3', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'bodykit_gt3', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'bodykit_gt3', true, null),
  ('brz', 'extras.hood', true, null),
  ('raptor', 'extras.hood', true, null),
  ('mustang', 'extras.hood', true, null),
  ('huracan', 'extras.hood', true, null),
  ('brz', 'hood_vented', true, null),
  ('raptor', 'hood_vented', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'hood_vented', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'hood_vented', false, 'Pieza específica de otro vehículo'),
  ('brz', 'hood_scoop', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'hood_scoop', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'hood_scoop', true, null),
  ('huracan', 'hood_scoop', false, 'Pieza específica de otro vehículo'),
  ('brz', 'hood_shaker', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'hood_shaker', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'hood_shaker', true, null),
  ('huracan', 'hood_shaker', false, 'Pieza específica de otro vehículo'),
  ('brz', 'hood_gt3', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'hood_gt3', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'hood_gt3', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'hood_gt3', true, null),
  ('brz', 'mirrors_aero', true, null),
  ('raptor', 'mirrors_aero', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'mirrors_aero', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'mirrors_aero', false, 'Pieza específica de otro vehículo'),
  ('brz', 'extras.frontbumper', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'extras.frontbumper', true, null),
  ('mustang', 'extras.frontbumper', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'extras.frontbumper', false, 'Pieza específica de otro vehículo'),
  ('brz', 'bumper_winch', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'bumper_winch', true, null),
  ('mustang', 'bumper_winch', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'bumper_winch', false, 'Pieza específica de otro vehículo'),
  ('brz', 'lightbar_led', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'lightbar_led', true, null),
  ('mustang', 'lightbar_led', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'lightbar_led', false, 'Pieza específica de otro vehículo'),
  ('brz', 'rack_spare', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'rack_spare', true, null),
  ('mustang', 'rack_spare', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'rack_spare', false, 'Pieza específica de otro vehículo'),
  ('brz', 'snorkel', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'snorkel', true, null),
  ('mustang', 'snorkel', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'snorkel', false, 'Pieza específica de otro vehículo'),
  ('brz', 'stripes_rally', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'stripes_rally', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'stripes_rally', true, null),
  ('huracan', 'stripes_rally', false, 'Pieza específica de otro vehículo'),
  ('brz', 'sharkfin', false, 'Pieza específica de otro vehículo'),
  ('raptor', 'sharkfin', false, 'Pieza específica de otro vehículo'),
  ('mustang', 'sharkfin', false, 'Pieza específica de otro vehículo'),
  ('huracan', 'sharkfin', true, null),
  ('brz', 'vinyl', true, null),
  ('raptor', 'vinyl', true, null),
  ('mustang', 'vinyl', true, null),
  ('huracan', 'vinyl', true, null),
) as x(vcod, pcod, disponible, observacion)
join public.vehiculos v on v.codigo = x.vcod
join public.piezas p on p.codigo = x.pcod
on conflict do nothing;
