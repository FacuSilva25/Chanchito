# Chanchito: app instalable (PWA)

Es la misma app de siempre, preparada para publicarla en internet. Cualquiera entra al link, se crea su cuenta con email y contraseña, y la instala en Android, iPhone o la PC como una app más.

## Qué hay en la carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app |
| `config.js` | Los datos de tu proyecto de Supabase (paso 1) |
| `supabase.sql` | Crea la base de datos y las reglas de privacidad (paso 1) |
| `sw.js` | Hace que la app sea instalable, funcione sin conexión y se actualice con un botón |
| `manifest.webmanifest`, `icons/` | Nombre e ícono de la app instalada |
| `js/backend.js`, `vendor/` | Login, conexión con la base y gráficos |

## 1. Base de datos y cuentas (Supabase, gratis)

1. Entrá a https://supabase.com, creá una cuenta y un proyecto nuevo (región: São Paulo).
2. Abrí **SQL Editor**, pegá todo el contenido de `supabase.sql` y tocá **Run**.
3. Copiá el **Project URL** (botón **Connect**, o Project Settings > Data API) y la **publishable key** (`sb_publishable_...`, en Project Settings > API Keys; en proyectos viejos se llama *anon public key*). Pegalos en `config.js` o mandámelos y lo hago yo. Esa clave está hecha para ser pública: lo que protege los datos son las reglas de `supabase.sql`. **Nunca** uses la *secret key* ni la *service_role*.
4. En **Authentication > Sign In / Providers > Email**:
   - Si querés que la gente entre apenas se registra, apagá **Confirm email**.
   - Si lo dejás prendido, cada persona tiene que confirmar su email antes de entrar.
5. En **Authentication > URL Configuration**, poné el link de la app (paso 2) en **Site URL**. Así funcionan los mails de "Olvidé mi contraseña".

> El plan gratis de Supabase pausa el proyecto si nadie lo usa durante 7 días seguidos. Se reactiva desde el panel de Supabase con un clic.

## 2. Publicarla (GitHub Pages, gratis)

1. Creá un repositorio **público** en GitHub, por ejemplo `chanchito`.
2. Subí el contenido de esta carpeta a la raíz del repo (o pedime que lo suba yo).
3. En el repo, andá a **Settings > Pages > Source: Deploy from a branch**, elegí `main` y la carpeta `/ (root)`.
4. En un minuto queda en `https://<tu-usuario>.github.io/chanchito/` (la de Facundo: https://facusilva25.github.io/Chanchito/). Ese es el link que le pasás a la gente.

Sirve cualquier hosting que use https: Netlify, Vercel, Cloudflare Pages, etc.

## 3. Instalarla

- **Android (Chrome):** abrí el link y tocá **Instalar app** (o Menú ⋮ > Instalar app).
- **PC (Chrome o Edge):** abrí el link y tocá el ícono de instalar en la barra de direcciones, o **Configuración > Instalar Chanchito** dentro de la app.
- **iPhone (Safari):** Compartir > **Agregar a inicio**.

## Publicar una versión nueva

1. Cambiá lo que haga falta en `index.html` (u otros archivos).
2. En `sw.js`, subí el número de `VERSION` (por ejemplo `1.0.0` a `1.1.0`) y escribí en `NOTES` qué hay de nuevo.
3. Subí los cambios a GitHub.

Cada usuario ve arriba el aviso "Hay una versión nueva de Chanchito" con el botón **Actualizar**. El mismo botón está en **Configuración > Actualizaciones**. Sus datos no se tocan, porque están en la nube.

**Ojo:** si no subís el número de `VERSION`, los usuarios siguen viendo la versión anterior. Eso incluye cambios en `config.js`.

## Sin Supabase

Si `config.js` queda vacío, la app igual funciona: no pide login y guarda los datos solo en ese dispositivo. En la pantalla de login también está la opción "Usar sin cuenta".

## Qué cambia respecto de la versión de claude.ai

- Hay login propio (email y contraseña) en lugar de la cuenta de Claude.
- Las cuentas compartidas funcionan igual: la otra persona se crea una cuenta y entra con el código de 6 letras.
- Los "Consejos personalizados" con IA no aparecen, porque necesitan una clave de API paga. Las recomendaciones automáticas del Informe siguen estando.
- Las notificaciones de vencimientos llegan al abrir la app, una vez por día. Para que lleguen con la app cerrada hace falta un servidor de notificaciones push; se puede agregar más adelante.
- Los datos que cargaste en la versión de claude.ai no se pasan solos. Si los querés, te los migro.

## Pasar tus datos de una planilla (Excel o CSV)

En **Configuración > Tus datos > Importar planilla (Excel o CSV)** elegís un `.xlsx` o `.csv` y la app te muestra qué encontró antes de importar.

- Busca en cada pestaña una fila de títulos con **Fecha** y **Monto** (o Importe). También usa **Descripción** o **Concepto**, **Categoría**, **Subcategoría**, **Tipo** (Gasto, Ingreso o Fijo) y **Cuotas** / **Monto cuota**.
- Una pestaña que se llama **Ingresos** se carga como ingresos. Una pestaña de **Tarjeta** reparte cada compra en cuotas, una por mes.
- Una tabla con **Crédito**, **Valor cuota** y **Cuotas restantes** (o **Fecha finalización**) se carga como gasto fijo hasta la última cuota.
- Las categorías que no existen en la app se crean solas. Si hay compras con tarjeta, los "Pago tarjeta" se saltean para no contar dos veces.
- Importar el mismo archivo otra vez no duplica nada: solo suma las filas nuevas.

Desde Google Sheets: **Archivo > Descargar > Microsoft Excel (.xlsx)**. En Configuración también hay una **planilla modelo** para descargar.
