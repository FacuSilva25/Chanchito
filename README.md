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

## Entrar con huella

En **Configuración > Seguridad > Entrar con huella** cada persona puede activar el desbloqueo con la huella (o el reconocimiento facial / PIN del celu). Usa el lector del propio dispositivo (WebAuthn), así que no hay que configurar nada en Supabase y la huella nunca sale del celu. Se activa en cada dispositivo por separado y la sesión con email y contraseña sigue igual: si el lector falla, "Entrar con mi contraseña" cierra la sesión para volver a ingresar.

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

## Centavos y otras monedas

- Los montos se guardan y se muestran con centavos (si un número es redondo, se ve sin decimales).
- Al cargar un movimiento podés elegir la moneda debajo del monto. La app busca la cotización de la fecha del movimiento y guarda el monto convertido, el original y la cotización usada. Si no hay conexión, la escribís a mano.
- Los gastos mensuales en otra moneda (por ejemplo, una suscripción en dólares) se recalculan cada mes con la cotización de ese mes.
- En **Moneda** elegís qué dólar se usa para los pesos: Blue (por defecto), Oficial, MEP o Tarjeta.
- Si cambiás la moneda de la app, te ofrece convertir todos tus movimientos y metas con la cotización del día de cada uno. Como el monto original queda guardado, volver a la moneda anterior recupera los números exactos. También podés cambiar solo el símbolo, sin convertir.
- Cotizaciones: [dolarapi.com](https://dolarapi.com) (dólar hoy), [argentinadatos.com](https://argentinadatos.com) (historia del dólar) y [currency-api](https://github.com/fawazahmed0/exchange-api) (el resto de las monedas). Son gratis y no necesitan clave.

## Tarjetas y cuotas

- En **Tarjetas** (debajo de Movimientos) cargás tus tarjetas: Visa, Mastercard u otra; de crédito, débito o prepaga; los últimos 4 números (opcional); el día de vencimiento y, si querés, el día de cierre.
- Al cargar un gasto variable activás **En cuotas con tarjeta**, elegís la tarjeta y 1, 3, 6, 12, 18 o 24 cuotas (o cualquier otra cantidad con **Otra**), en qué cuota vas si la compra ya venía de antes, y si es con interés, cuánto (en %). La app divide el monto y pone cada cuota en el resumen de su mes. Si la tarjeta tiene día de cierre, lo que comprás después del cierre va al resumen siguiente.
- Las cuotas **no se descuentan** de tu disponible. Se descuenta el pago: en Tarjetas tocás **Pagar** y elegís el total u otro monto. El pago queda como un gasto (categoría Tarjeta) en la cuenta que elijas. Si pagás menos, lo que falta pasa al resumen del mes siguiente.
- Cada tarjeta muestra lo que hay que pagar ese mes, y arriba está el total de todas. El vencimiento de un mes puntual se cambia tocando la fecha.
- Cada cuota muestra en cuál vas (por ejemplo 3/12), cuántas quedan y cuánto suman las que quedan.
- Las fechas se eligen con el calendario de la app y se ven como día/mes/año.
- Al importar una planilla con compras con tarjeta, podés mandarlas directo a una tarjeta. Las cuotas de meses anteriores se marcan como pagadas.
