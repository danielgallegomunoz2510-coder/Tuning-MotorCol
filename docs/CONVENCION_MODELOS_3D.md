# Convención de modelos 3D — TMC v1

Ruta: `public/models/<vehiculo_id>/<vehiculo_id>.glb` (un GLB, escala en metros, Y arriba, frente +Z, izquierda +X).
La raíz lleva extras `tmc_convention: "v1"`.

## Materiales (los que usa MaterialManager / catalog.js)
Paint (carrocería pintable) · Wheel1A (rin) · CaliperAZone (caliper) · Tire · BrakeDisc ·
GlassMtl (vidrios, polarizado) · GlassRed / GlassAmber / GlassLightBlue (micas) · LightA (carcasa de faros) ·
InteriorColour1A / InteriorColour2A / InteriorA (tapizado).

## Nodos
```
<ROOT>
├─ BODY
│  ├─ PART_body_paint  PART_body_trim  PART_bumper_front  PART_bumper_rear
│  ├─ PART_hood  PART_spoiler  PART_mirrors  PART_skirts (opcional)
│  └─ PART_interior  PART_lights  PART_glass  PART_chassis  PART_engine  PART_badges
├─ WHEEL_FL | WHEEL_FR | WHEEL_RL | WHEEL_RR   (pivote = centro de la rueda)
│  └─ WHEEL_xx_rim  WHEEL_xx_tire  WHEEL_xx_brake
└─ ANCHORS
   └─ ANCHOR_wheel_FL/FR/RL/RR  ANCHOR_spoiler  ANCHOR_bumper_front/rear  ANCHOR_hood
      ANCHOR_mirror_L/R  ANCHOR_skirt_L/R  ANCHOR_exhaust  ANCHOR_roof
```
- `PART_<slot>`: pieza de serie; se oculta cuando se monta una pieza del catálogo en ese slot.
- `ANCHOR_<slot>`: empty donde se monta la pieza de reemplazo (origen = punto de montaje).
- Piezas de catálogo (p. ej. `public/models/parts/spoiler-gt.glb`) se modelan con su origen en el punto de montaje y misma orientación.
- En BD (diseño del PDF): `piezas.slot` = `<slot>`, `piezas.recurso_3d_url` = GLB de la pieza.

El código (VehicleParts.getAnchor/getPart) usa estos nodos si existen; si no, cae al modo legado (por material).

## Piezas intercambiables (GLB de pieza, TMC v1)

Ubicación: `public/models/parts/<codigo>.glb`, registradas en `PART_LIBRARY` (src/data/catalog.js)
y en la tabla `piezas` (`recurso_3d_url`, mismo `codigo`).

- Nodo raíz `TMC_PART` con extras `slot`, `codigo`, `replaces`.
- Uno o más vacíos `AT_<slot>` (p. ej. `AT_spoiler`, `AT_bumper_front`, `AT_skirt_L`). Su contenido se clona
  y se cuelga del `ANCHOR_<slot>` del vehículo con posición local 0 (la geometría ya viene modelada en el
  espacio del coche respecto al ancla).
- `AT_wheel`: rin centrado en el origen con la cara exterior hacia +X (lado izquierdo); el configurador lo
  rota π en Y para las ruedas derechas y oculta `WHEEL_xx_rim` de fábrica.
- Materiales: `Paint` y `Wheel1A` se sustituyen por los del coche (heredan color); `TMC_Carbon`,
  `TMC_GlossBlack`, `TMC_MirrorGlass` son propios de la pieza.
- `replaces`: lista de `PART_<slot>` de fábrica que se ocultan al montar la pieza (y se restauran al quitarla).
- Las piezas se publican como GLB en `public/models/parts/` y el configurador (JavaScript) las monta en los anclajes.

## Extensiones v1.1 (Raptor, Mustang, Huracán)

- **Escala real**: si algún nodo trae `extras.tmc_convention`, el configurador NO reescala el modelo (metros reales); la cámara se encuadra según el largo/alto.
- **Draco**: los GLB van comprimidos con Draco; el decodificador está en `public/draco/`.
- **Ruedas por eje**: una pieza de rin puede traer `AT_wheel` (las 4), o `AT_wheel_front` / `AT_wheel_rear` (anchos distintos por eje). Cara exterior hacia +X; en las ruedas derechas se rota 180°.
- `PART_LIBRARY[x].hideTire: true` oculta `WHEEL_*_tire` (la pieza trae su propia llanta, p. ej. AT).
- `PART_LIBRARY[x].lift` (m) eleva ruedas y carrocería cuando la llanta es de mayor diámetro.
- **Compatibilidad**: los controles y opciones del catálogo admiten `vehicles: [...]`; lo incompatible se oculta en el panel y se marca como `disponible=false` en `compatibilidades` (seed.sql).
- Anclajes nuevos: `ANCHOR_body` (origen, piezas con coordenadas absolutas), `ANCHOR_bed`, `ANCHOR_snorkel_R`.
