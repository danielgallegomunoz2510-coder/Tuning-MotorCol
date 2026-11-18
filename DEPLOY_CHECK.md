# Verificación de despliegue

Fecha de verificación: 18 de noviembre de 2026.

- `npm ci`: correcto.
- `npm run build`: correcto con Vite 5.4.21.
- Salida de producción: `dist/` generada durante la prueba.
- Auditoría de dependencias de producción: 0 vulnerabilidades.
- Ningún archivo individual del proyecto supera 25 MB.
- No se incluye un archivo `.env` real, `node_modules/` ni `dist/`.

Antes de publicar:

1. Subir el contenido extraído a la raíz de un repositorio de GitHub.
2. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY` como secretos de
   GitHub Actions.
3. Seleccionar GitHub Actions como fuente en `Settings > Pages`.
4. Ejecutar primero `supabase/schema.sql` y después `supabase/seed.sql` en
   Supabase.
5. Agregar la URL final de GitHub Pages a las URL permitidas de Supabase Auth.
