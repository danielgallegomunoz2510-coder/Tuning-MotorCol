# Tuning MotorCol

Aplicación web para explorar y personalizar vehículos en 3D, guardar
configuraciones y solicitar cotizaciones.

## Tecnologías reales

- Frontend: HTML5, CSS3, JavaScript modular, Vite y Three.js.
- Servicios: Supabase Auth, REST, RPC y Row Level Security.
- Base de datos: Supabase PostgreSQL.
- Modelos 3D: GLB y Draco.

El proyecto no usa React, Vue, Angular ni un backend Node.js propio. Node.js se
utiliza únicamente para instalar dependencias y ejecutar Vite durante el build.

## Probar localmente

Requiere Node.js 18 o superior.

```bash
npm ci
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

Para verificar la compilación de producción:

```bash
npm run build
npm run preview
```

## Configurar Supabase

1. Crear o abrir un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` completo en el SQL Editor.
3. Ejecutar después `supabase/seed.sql`.
4. Configurar Email Auth y las URL de redirección.
5. Usar únicamente la clave `anon` o `publishable`; nunca `service_role`.

Variables disponibles:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_KEY=sb_publishable_o_anon_public_key
```

El archivo `.env` está excluido de Git. Para trabajar localmente, copiar
`.env.example` como `.env` y completar los valores.

## Publicar en GitHub Pages

El repositorio incluye `.github/workflows/deploy-pages.yml`.

1. Crear un repositorio vacío en GitHub.
2. Subir **el contenido de esta carpeta** a la raíz del repositorio. No subir el
   ZIP como un único archivo.
3. En `Settings > Secrets and variables > Actions`, crear:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`
4. En `Settings > Pages`, seleccionar `GitHub Actions` como fuente.
5. Hacer push a la rama `main` o ejecutar manualmente el workflow
   `Deploy to GitHub Pages`.
6. Agregar la URL final `https://USUARIO.github.io/REPOSITORIO/` en Supabase:
   `Authentication > URL Configuration`.

La aplicación usa rutas con hash y `base: './'`, por lo que funciona desde una
subruta de GitHub Pages.

## Alternativas

También se incluyen `netlify.toml` y `vercel.json`. En ambos servicios:

- Build command: `npm run build`
- Publish/output directory: `dist`
- Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY`

## Archivos importantes

- `src/`: aplicación web.
- `public/models/`: vehículos, piezas y garaje 3D.
- `supabase/schema.sql`: estructura, RLS, triggers y funciones.
- `supabase/seed.sql`: datos iniciales.
- `docs/pendon/`: pendón informativo corregido.
- `INSTRUCCIONES_DEPLOY_CODEX.txt`: guía extensa de despliegue.

No se incluyen `node_modules` ni `dist`; el flujo de despliegue los genera.

