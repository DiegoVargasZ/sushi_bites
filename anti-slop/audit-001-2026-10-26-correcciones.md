# Informe de correcciones, auditoría 001

- **Fecha:** 2026-10-26
- **Aprobado por el dueño:** hallazgos **1, 2 y 3** (los tres de prioridad ALTA / Hard Gate)
- **No tocado:** hallazgos 4 a 12. Siguen abiertos en `audit-001-2026-10-26.md`.
- **Método:** ediciones directas al código fuente. No se usó ningún script de reemplazo sobre el CSS (R-33); los scripts auxiliares solo midieron y planificaron, nunca escribieron.

---

## Hallazgo 1 (R-02): em dash eliminado — HECHO

| Archivo | Antes | Ahora |
|---|---|---|
| `src/layout.html` ×3 | `{{title}} — Sushi Bites` | `{{title}} · Sushi Bites` |
| `dist/app.js` | `… (${serving}) — ${money}` | `… (${serving}) · ${money}` |
| `dist/collaborations.js` | `Propuesta de colaboración — ${name}` | `Propuesta de colaboración: ${name}` |
| `dist/sushi-3d.js` | `/* Sushi Bites — textured… */` | `/* Sushi Bites: textured… */` |

**Separador elegido:** `·`, no por capricho sino porque ya era el idioma del proyecto (38 usos previos: pie, direcciones de sucursal, metadatos). El punto no servía: cuatro de los seis títulos ya terminan en punto. Para el asunto del correo se usó dos puntos, que es lo que recomienda R-02 y lo que encaja en una línea de asunto.

**Verificado:** 0 em dashes en código propio. `dist/vendor/maplibre` conserva el suyo, es de terceros y queda fuera de alcance.

## Hallazgo 2 (R-03): objetivos táctiles a 44px — HECHO, y más amplio de lo listado

Los 9 controles del informe original, corregidos. **Pero la auditoría se quedó corta**: mi escaneo inicial solo detectaba alturas declaradas explícitamente, así que no vio los controles dimensionados solo por padding o por su contenido. Al rehacerlo aparecieron **13 más**, incluido `.add-button` (el "Añadir" de cada tarjeta de producto), que solo recibía 44px bajo `max-width:480px` y únicamente en la página de menú; en el resto medía ~28px.

**Del informe original (9):** `.quantity-control button` 26→44, `.roll-finishes button` 30/34→44, `.mobile-toggle` 36/40→44, `.icon-button` 38→44, `.cart-toggle` 40→44, `.location-map-button` 40→44, `.maplibregl-ctrl-group button` 40→44, `.copy-order-button` 42→44, `.button-small` y `.empty-cart .button` 43→44.

**Encontrados después (13):** `.add-button` ~28→44, `.ingredient-button` ~22→44, `.menu-tabs>button` ~38→44, `#roll-play` 28→44, `#clear-search` 36→44, `#locate-delivery` 40→44, `#clear-delivery-point` 35→44, `.retry-delivery-map` 42→44, `#delivery-point-link` ~32→44, `.text-link` ~19→44, `.back-top` ~25→44, `.mobile-nav a` 43→44, `.footer-bottom nav a` 18→44, `.scroll-link` 29→44, `.location-phone` 21→44.

Los tres últimos solo salieron al medir en el navegador, no en el CSS: dependían del contenido renderizado.

**Excepción documentada:** el enlace "web de Sushi Bites" dentro del párrafo de fuentes en `ubicaciones.html` se queda a 14px de alto. Es un enlace en línea dentro de un bloque de texto, que WCAG 2.5.8 exime expresamente, y agrandarlo rompería el flujo de la frase.

## Hallazgo 3 (R-03 + R-06): suelo tipográfico de 11px — HECHO

**Decisión del dueño:** suelo de 11px (entre las opciones de 10, 11 y 12px). Razón en una línea, para R-31: *ningún texto baja de 11px porque por debajo deja de ser legible en un teléfono, y 11px conserva un escalón de micro-etiqueta por debajo del cuerpo de 15px.*

- **142 declaraciones** subidas a 11px, una por una.
- Escala baja resultante: `11px` (187), `12px` (43), `13px` (17). Cuerpo a 15px y botones a 13px, sin cambios.
- Desaparecen los 6px (`.hero-photo-caption`, `.product-badge`, `.roll-ground-label`) y los 7px (pie, `.back-top`, `.scroll-link`, `.product-meta`, anotaciones del sushi 3D).

No se tocó `ART-DIRECTION.md`: la identidad (paleta, tipografías, fotografía, sellos) queda intacta; solo cambia el tamaño mínimo.

---

## Verificación (R-35)

`npm run build` limpio: 6 páginas generadas, 71 anclas válidas, 45 productos, 8 tests en verde.

Recorrido real en navegador a **390px de ancho**, con las media queries de móvil activas:

| Comprobación | Resultado |
|---|---|
| Desbordamiento horizontal, las 6 páginas | **0px** en todas |
| Elementos fuera del viewport | ninguno |
| Texto por debajo de 11px computado | **0** en las 6 páginas |
| Controles por debajo de 44px | **0**, con el menú móvil desplegado |
| Errores de consola | ninguno |

Interacciones ejercidas una a una: añadir dos productos desde la carta, abrir la bolsa (diálogo abre, `0` de desbordamiento interno), botones de cantidad medidos a **44×44** reales, cerrar diálogo, desplegar y plegar el menú móvil, y recorrido hasta el pie. El pie, que era el mayor riesgo del cambio tipográfico, mantiene los cinco enlaces en una fila sin solaparse.

**Lo que no se verificó:** no se probó en un dispositivo físico ni con lector de pantalla, ni se ejercitó el envío real por WhatsApp o el correo de colaboraciones (abren aplicaciones externas). El mapa de entrega se cargó, pero no se probó con la red caída para ver su estado de error.

## Pendiente

Los hallazgos 4 a 12 siguen sin tocar, como pediste. Los de prioridad MEDIA (4 a 7: icono sparkle, flechas en todos los CTA, mayúsculas con tracking, tarjetas idénticas) son los que más acercarían el sitio al "si cambias el logo, ¿sigue teniendo carácter propio?" de antislop.
