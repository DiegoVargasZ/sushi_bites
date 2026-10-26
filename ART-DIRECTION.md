# Dirección de arte

Negro `#111111`, rojo `#f34343` y blanco `#fafafa`, tipografía DM Sans con Instrument Serif en cursiva. Fotografías cenitales, sellos gráficos, amplios espacios y pequeños detalles inspirados en la cultura gastronómica japonesa. Las tipografías tienen alternativas locales si Google Fonts no está disponible.

La identidad usa el logo oficial facilitado por el propietario, con lettering blanco y espiral roja, en la cabecera y el pie de todas las páginas. Se conserva el WebP original con transparencia y proporciones intactas. Para el ícono del navegador se encuadra exclusivamente la espiral original mediante un SVG autónomo, sin redibujarla. El logo se adapta a móvil y escritorio.

## Portada

La portada se apoya en la fotografía cenital `hero-sushi.webp`, acompañada de la caligrafía vertical ひとくちの幸せ y del rótulo «HECHO A MANO. HASTA EL ÚLTIMO GRANO.». La composición mantiene el encuadre amplio y el fondo casi negro de la dirección general.

Entre octubre de 2026 y el 26 de octubre de 2026 este espacio lo ocupó una escena 3D en WebGL con un atlas de materiales propio. Se retiró a petición del propietario: la fotografía editorial ya transmitía la misma idea sin costar unos 400 KB de JavaScript en la primera carga. La fotografía que ahora se ve es la misma que la escena usaba como alternativa cuando no había WebGL.

## Imágenes

La carta utiliza las 45 fotografías originales sin marca de agua de la web de Sushi Bites, guardadas en `dist/assets/menu/`. Se sustituyeron todos los recortes con marcas de la referencia. No se regeneraron los platos ni se utilizó IA para borrar marcas: se recuperaron los originales y se optimizaron a JPEG de hasta 560 píxeles. Los seis Emperadores comparten la misma foto, como en la fuente original. `src/photo-sources.json` documenta la procedencia de cada imagen. Las tres fotos de sucursales también se sirven localmente desde `dist/assets/locations/`.

La web se divide en seis páginas. Colaboraciones conserva los campos de la captura aportada, adaptados a una composición oscura con formulario de alto contraste, acentos rojos y texto editorial. Los campos disponen de etiquetas visibles, la tipografía de entrada móvil evita el zoom automático y los errores se validan antes de preparar el correo.

El selector de entrega usa MapLibre GL JS 5.24.0 y OpenFreeMap con el estilo Liberty. Mantiene calles y nombres legibles en una superficie clara, pin rojo y controles de zoom accesibles sobre el panel oscuro. La atribución de OpenFreeMap, OpenMapTiles y OpenStreetMap permanece visible. Se reemplazó el proveedor de imágenes que respondía 403. La comprobación visual reproduce datos vectoriales reales de Cochabamba, incluidas sus calles y nombres, tanto con servidor local como abriendo el archivo HTML.

Las tres imágenes de la propuesta inicial fueron generadas con la herramienta integrada **Imagegen**, sin API externa ni CLI. La fotografía de portada ocupa la portada y la de preparación permanece en la sección de marca; son ilustrativas. La antigua cuadrícula de cuatro platos ya no se usa en las tarjetas. Se conservan sus prompts originales abajo.

### `dist/assets/hero-sushi.png`

Prompt final:

> Use case: ads-marketing. Asset type: photograph asset for a premium contemporary Japanese sushi restaurant website, no lettering. Create a photorealistic editorial food photograph, landscape 3:2 framing. Centerpiece: a huge round handmade black matte ceramic plate filled with a gorgeous refined assortment of 18 sushi pieces: salmon nigiri with luminous orange salmon, tuna nigiri, vibrant salmon uramaki rolls topped with spicy mayo and small sliced green jalapeños, avocado maki. Carefully composed, authentic, deeply appetizing, individual glossy rice grains visible, small mound of fresh green wasabi and thin pink pickled ginger at edge. A pair of matte black chopsticks enters diagonally from upper right. All placed on a seamless near-black charcoal background #141614. View from directly overhead, luxurious studio food photography with soft directional top left light, crisp highlights and rich contrast, subtle natural shadows. Entire round plate fully in frame, centered with modest empty margin around plate. Accents of bright natural green herbs. No words, no logos, no frames, no collages, no graphic UI. Premium high-end food magazine quality.

### `dist/assets/menu-sushi.png`

Prompt final:

> Use case: product-mockup. Asset type: four food photographs in a seamless 2x2 grid contact sheet for sushi restaurant product cards. Landscape image ratio 3:2. Each quadrant must be a separate overhead food photograph against identical seamless solid charcoal black background #1b1d19. TOP LEFT: a cluster of 8 exquisite salmon avocado uramaki sushi rolls, orange salmon draped on top, sesame seeds, on a small black round plate centered within top left quadrant. TOP RIGHT: 8 crispy deep fried panko sushi rolls cut in slices showing salmon cream cheese, drizzled spicy mayo, on a small black plate centered in top right quadrant. BOTTOM LEFT: 6 beautiful salmon nigiri, luminous orange fish on rice on a small round black ceramic plate centered within bottom left quadrant. BOTTOM RIGHT: 8 green vegan avocado cucumber maki rolls with vibrant thin avocado wrap and sesame, on small round black plate centered within bottom right quadrant. Each food subject must fit completely inside its own quadrant with generous charcoal negative space around it. Entire black dishes fully visible. Sharp professional studio food photography, top down, delicious realistic rice grains, warm dramatic light. No text, no watermarks, no utensils, no labels, no borders, no divider lines. Background same smooth charcoal in all four quadrants.

### `dist/assets/sushi-craft.png`

Prompt final:

> Use case: photorealistic-natural. Asset type: editorial photograph for a contemporary Japanese sushi restaurant about section, landscape 3:2. Tight intimate closeup of an artisan sushi chef's hands carefully placing fresh vibrant salmon slices on uramaki sushi rolls on a dark wooden preparation board in an authentic modern Japanese kitchen. Only torso in dark charcoal apron and hands visible, no face. Extremely appetizing sushi in foreground, fresh salmon rice green avocado, handmade pottery softly blurred in background. Low key warm cinematic side lighting, deep charcoal shadows, a subtle soft light from upper left, tactile and natural, premium magazine documentary food photography, selective focus, fine real film grain. No text, no logos, no watermarks.
