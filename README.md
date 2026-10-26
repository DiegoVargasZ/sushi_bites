# Sushi Bites

Web gastronómica en español, en negro, rojo y blanco. Seis páginas independientes, adaptables a móvil y escritorio, sin instalación de dependencias.

El logo oficial proporcionado por el propietario se conserva sin modificaciones en `dist/assets/logo-oficial.webp` y aparece en la cabecera y el pie de las seis páginas. El ícono de la pestaña, `dist/assets/favicon-sushi-bites.svg`, muestra únicamente la espiral roja del mismo archivo, con fondo transparente. El SVG incorpora la imagen original y limita su encuadre; no redibuja el símbolo ni necesita archivos externos.

## Abrir en local

Con Node.js 18 o superior:

```sh
npm run dev
```

Abre http://127.0.0.1:5173. También puedes abrir `dist/index.html` directamente.

## Carta completa

La navegación separa **Inicio**, **Menú**, **Ubicaciones**, **Nosotros**, **Preguntas** y **Colaboraciones**. La bolsa se conserva al cambiar de página y se sincroniza entre pestañas del mismo origen. Cada suma o resta se guarda como un registro independiente; dos pestañas no sobrescriben el pedido completo. Se recuperan las bolsas del formato anterior y se respeta el límite de 99 unidades. Si cambia la bolsa desde otra pestaña, se actualizan cantidades y subtotal y se invalida el mensaje preparado. Sin almacenamiento disponible, la bolsa funciona en memoria en esa página.

Todas las páginas funcionan también al abrir sus archivos HTML directamente; se recomienda el servidor local para la persistencia compartida y el portapapeles, ya que el comportamiento del almacenamiento entre archivos depende del navegador.

45 productos en siete categorías: Fusiones Nikkei (6), Rolls fritos (6), Ehomakis (6), Emperadores (6), Postres (3), Bebidas (12) y Salsas (6).

Nombres, precios e ingredientes se transcribieron de la imagen `www.sushibites.com.bo_2Fmenu.jpg` suministrada por el propietario. Esa imagen prevalece sobre versiones diferentes de la carta web: Sushi Bowl cuesta Bs 65. Las 45 fotografías se sustituyeron por los originales sin marca de agua que utiliza la web de Sushi Bites, descargados y optimizados en JPEG para servirlos localmente. Las URLs de procedencia están en `src/photo-sources.json`. Los ingredientes truncados por «Leer más» se resumieron sin completar las partes ocultas. Spicy y Niku Emperador conservan la descripción sin freír de la referencia.

El buscador filtra nombres, categorías e ingredientes e ignora tildes. La bolsa permite ajustar cantidades, añadir notas, conservar el pedido en el navegador y copiar su resumen. Las salsas mantienen sus precios decimales. No se inventaron números de piezas, promociones ni combos. Los alérgenos son orientativos y deben confirmarse con el restaurante.

## Pedidos por WhatsApp

La bolsa pide elegir **Delivery** o **Para recoger** y una sucursal. Para delivery muestra un mapa y exige marcar un punto, además de escribir la dirección; la referencia es opcional. Puedes seleccionar tocando el mapa, arrastrar el pin o pulsar **Usar mi ubicación** y autorizar al navegador. Con teclado, las flechas mueven el mapa y Enter selecciona el centro. El centro inicial del mapa no se toma como dirección de entrega. Para recojo se oculta el mapa, se muestra la dirección de la sucursal y se omiten dirección y coordenadas de delivery del mensaje.

El botón **Pedir por WhatsApp** abre el chat correspondiente con productos, cantidades, subtotal, modalidad, dirección, enlace al punto exacto en Google Maps o sucursal de recojo y notas. El visitante revisa y pulsa Enviar en WhatsApp. Los números están centralizados en `dist/order-data.js`:

- Central: +591 69447617.
- Hupermall: +591 75060007.
- Quillacollo: +591 62666889.

La página conserva modalidad, sucursal, coordenadas y datos de entrega durante la sesión de esa pestaña para navegar entre páginas sin volver a escribirlos. Se puede copiar el resumen si no se abre WhatsApp. La bolsa se mantiene al abrir el chat. El costo de delivery y el total final los confirma la sucursal.

El mapa utiliza **MapLibre GL JS 5.24.0**, incluido localmente en `dist/vendor/maplibre/`, y mapas vectoriales de **OpenFreeMap**. Su JavaScript (1,06 MB) y su CSS se descargan al abrir una bolsa con productos y elegir delivery. Navegar por las seis páginas o preparar un recojo no descarga la biblioteca. Se reutiliza la carga dentro de la página y se ofrece reintento si falla. Se sustituyó el acceso directo a `tile.openstreetmap.org` que mostraba el bloqueo 403. La instancia pública de OpenFreeMap permite uso comercial sin registro ni clave y responde con CORS compatible con el origen de los archivos locales; ver https://openfreemap.org/quick_start/.

Las calles requieren Internet y el navegador debe admitir WebGL. La geolocalización requiere permiso y un contexto seguro (HTTPS o localhost); si se deniega, se mantiene la selección manual. Mientras carga el mapa se muestra un indicador; si falla se muestra un aviso y un botón para volver a cargarlo. No se permite marcar a ciegas sobre un mapa que no haya cargado. La elección manual posterior tiene prioridad sobre una respuesta GPS tardía.

La comprobación visual reproduce respuestas reales sin modificar de OpenFreeMap (estilo, vectores de Cochabamba, tipografías e iconos), obtenidas con `Origin: null` y respuesta CORS `*`. Se verificó el dibujo de calles y nombres reales tanto por HTTP local como abriendo el HTML directamente, además del pin, arrastre, GPS, móvil, WhatsApp y recuperación tras un error HTTP. El transporte se reprodujo localmente porque el ejecutor restringe la red; no se enviaron mensajes reales.

## Ubicaciones y colaboraciones

La página de Ubicaciones incorpora Central, Hupermall y Quillacollo, con fotos locales, direcciones, teléfonos, enlaces de WhatsApp y Google Maps. La información procede de https://www.sushibites.com.bo/sucursales, consultada el 25 de octubre de 2026. Seleccionar una sucursal actualiza el mapa. El mapa y los enlaces externos requieren conexión; consulta los horarios con cada sucursal.

El formulario de Colaboraciones reproduce los campos de la referencia: nombre, correo, teléfono, ciudad y país, plataformas, links y propuesta. Valida los campos obligatorios y el correo, prepara una vista previa y permite abrir la aplicación de correo con destinatario `collabs@sushibitesbolivia.com`, asunto y cuerpo completos. El visitante envía el mensaje desde su correo. También puede copiar la propuesta. La página no registra datos en un servidor ni declara envíos completados; no se enviaron mensajes durante las pruebas.

## Sushi interactivo

Escena 3D interactiva en WebGL 2, con texturas de materiales creadas con Imagegen: vetas de salmón, fibras de nori, pulpa de palta y arroz. El arroz tiene granos individuales con distribución irregular; los cortes del relleno tienen contornos suavizados y el nori tiene pliegues y un borde fino. Incluye reflejos GGX, brillo húmedo, iluminación de estudio, sombras proyectadas con penumbra variable y plato cerámico curvo. El acabado crocante añade 2.300 migas de panko y solo se dibuja al seleccionarlo.

El giro automático es lento y conserva el sushi armado. Arrastra para girarlo; con ratón también puedes inclinar la vista arrastrando verticalmente. Las cuatro flechas permiten girar e inclinar con teclado. El control de armado separa las capas y pausa la reproducción; al reanudar se arma suavemente y continúa girando sin saltar de orientación. Respeta movimiento reducido y se detiene fuera de pantalla. Muestra una foto alternativa si no hay WebGL o se pierde el contexto gráfico.

El atlas optimizado de 1024 × 1024 está incluido en `dist/assets/sushi-material-atlas.js` como WebP embebido (aproximadamente 361 KB), para que las texturas funcionen también al abrir el HTML directamente y sin conexión. El original y el prompt exacto se conservan en `src/assets/sushi-material-atlas.png` y `src/assets/sushi-material-atlas.md`. La escena no descarga modelos ni bibliotecas 3D externas. Las texturas son ilustrativas; las fotografías de la carta siguen siendo las originales del restaurante.

## Archivos

- `dist/menu-data.js`: catálogo, categorías, precios y fotos.
- `dist/app.js`: búsqueda, filtros, detalles y pedido.
- `dist/cart-store.js`: persistencia de cantidades y sincronización entre pestañas.
- `dist/order-data.js`: sucursales, direcciones y números de WhatsApp para pedidos.
- `dist/delivery-map.js`: selección de punto de entrega y geolocalización.
- `dist/vendor/maplibre/`: biblioteca activa del mapa, estilos y licencia BSD.
- `dist/sushi-3d.js`: geometría, materiales y animación.
- `dist/assets/sushi-material-atlas.js`: texturas locales del sushi 3D, compatibles con archivos HTML abiertos directamente.
- `src/assets/sushi-material-atlas.png` y `.md`: atlas original y prompt de Imagegen.
- `dist/index.html` y `dist/styles.css`: contenido y presentación.
- `dist/menu.html`, `ubicaciones.html`, `nosotros.html`, `preguntas.html` y `colaboraciones.html`: páginas independientes.
- `dist/collaborations.js`: validación y preparación de propuestas por correo.
- `src/layout.html` y `src/pages/`: plantilla común y contenido editable de las seis páginas.
- `src/photo-sources.json`: fuentes originales de las fotografías.
- `scripts/build-pages.mjs`: genera las seis páginas a partir de `src/`.
- `site.config.json`: dominio público utilizado para los metadatos de producción.

## Imágenes y publicación

Las tres imágenes de presentación se sirven en WebP. La portada pesa 186 KB en su tamaño original y tiene una variante de 59 KB a 768 píxeles, seleccionada por el navegador según pantalla y densidad. Antes pesaba 2,43 MB. Las imágenes del mosaico y del chef pesan 177 KB y 132 KB. Los PNG originales se conservan en `src/assets/`; no se distribuyen en `dist/`.

Para preparar la publicación, establece `siteUrl` en `site.config.json` con el dominio HTTPS definitivo y ejecuta:

```sh
npm run build:production
```

También puedes proporcionar el dominio mediante la variable de entorno `SITE_URL`. La compilación genera URLs canónicas distintas, Open Graph y Twitter con imágenes absolutas, `robots.txt` y un sitemap de las seis páginas. Los datos estructurados `Restaurant` reutilizan las direcciones y teléfonos de las tres sucursales del pedido, con enlaces al menú. No se añaden horarios ni coordenadas sin confirmar. Referencias: [Restaurant de Schema.org](https://schema.org/Restaurant) y [negocios locales de Google](https://developers.google.com/search/docs/appearance/structured-data/local-business).

Con `siteUrl` vacío, `npm run build` genera una vista previa con `noindex` y sin URLs de dominio inventadas. `build:production` exige configurar ese valor. Publica el contenido de `dist/` después de compilar para el dominio final.

## Verificación

```sh
npm run check
```

Para regenerar las páginas tras editar `src/`:

```sh
npm run build
```

Comprueba sintaxis, identificadores, enlaces entre páginas, navegación activa, integridad del catálogo, productos destacados, fotos, etiqueta del buscador, carga diferida del mapa y datos estructurados. Incluye pruebas de bolsas existentes, concurrencia entre pestañas, límite de cantidades, registros dañados, almacenamiento bloqueado y metadatos de producción. La tipografía externa tiene alternativas locales.

El pedido se prepara y se abre en el WhatsApp de la sucursal elegida. El visitante pulsa Enviar allí. La web no procesa pagos; disponibilidad, costo de delivery y total final se confirman directamente con la sucursal.
