---
title: HEIF y HEVC explicados — la tecnología tras las fotos de tu iPhone
description: HEIF es el contenedor, HEVC la compresión. Cómo trabajan juntos para reducir a la mitad el tamaño de tus fotos, en lenguaje llano y sin ser ingeniero.
slug: heif-y-hevc-explicados
keywords: formato heif, compresion hevc, h.265, heic vs heif, como funciona la compresion heic, heif explicado, hevc vs jpeg
---

Cada foto HEIC de tu iPhone es el producto de dos invenciones distintas que trabajan juntas: un **contenedor**, que decide cómo se organiza el archivo, y un **códec**, que decide cómo se comprimen los píxeles. El contenedor es **HEIF**. El códec suele ser **HEVC**.

La mayoría de las explicaciones se quedan en «ocupa menos que un JPG». Es cierto, pero no te dice *por qué*, ni por qué esa misma tecnología hace que a veces tu foto se niegue a abrirse en el portátil de un amigo. Esto es lo que ocurre realmente dentro del archivo.

## HEIF, HEVC, HEIC — aclarando los nombres

Estas tres siglas se usan indistintamente, y ahí está la principal fuente de confusión. No son lo mismo.

- **HEIF** — *High Efficiency Image File Format*. El **contenedor**. Es la caja: cómo se ordenan imágenes, miniaturas, metadatos y pistas adicionales dentro de un mismo archivo. Estandarizado por MPEG en 2015 como parte de ISO/IEC 23008-12.
- **HEVC** — *High Efficiency Video Coding*, también llamado **H.265**. El **códec**. Son las matemáticas de compresión que convierten los datos de píxeles en un pequeño flujo de bits. Estandarizado en 2013.
- **HEIC** — la extensión concreta que Apple usa para un contenedor HEIF cuyas imágenes están comprimidas con HEVC.

Una analogía útil: HEIF es como un archivo `.zip`, HEVC como el algoritmo de compresión que lleva dentro, y HEIC es la combinación concreta que distribuye Apple. En principio, un contenedor HEIF puede alojar imágenes codificadas con *algo distinto* de HEVC — las imágenes codificadas con AV1 en un contenedor de tipo HEIF se llaman AVIF, un pariente cercano. En la práctica, cuando ves `.heic` estás viendo HEVC dentro de HEIF.

## Por qué un códec de vídeo comprime tu foto fija

Esta es la parte genuinamente ingeniosa. HEVC se diseñó para comprimir vídeo 4K, y los códecs de vídeo llevan treinta años volviéndose extremadamente buenos en una sola cosa: **predecir píxeles en lugar de almacenarlos**.

JPEG, diseñado en 1992, hace algo comparativamente sencillo. Trocea la imagen en bloques de 8 × 8 píxeles, convierte cada bloque en información de frecuencia y descarta el detalle de alta frecuencia que peor percibe el ojo. Es elegante y funciona, pero cada bloque se trata más o menos por su cuenta, con un tamaño fijo y un juego de herramientas fijo.

HEVC aporta décadas de trucos adicionales al mismo trabajo:

- **Tamaños de bloque variables.** En lugar de una rejilla rígida de 8 × 8, HEVC divide la imagen en unidades de árbol de codificación de hasta 64 × 64 píxeles y luego las subdivide de forma adaptativa. Un cielo azul uniforme ocupa un solo bloque grande, cuya descripción casi no cuesta nada. Una cara se trocea en bloques pequeños, allí donde el detalle sí importa. JPEG tiene que gastar la misma rejilla en ambos casos.
- **Predicción intra.** Antes de guardar un bloque, HEVC lo *adivina* a partir de los píxeles ya decodificados a su izquierda y encima, eligiendo entre 35 modos de predicción direccional. Después solo guarda la **diferencia** entre la suposición y la realidad. Cuando la suposición es buena — y en fotos reales suele serlo — esa diferencia es casi nula, y los datos casi nulos se comprimen hasta casi nada.
- **Mejores transformadas y codificación entrópica.** La diferencia residual pasa por transformadas más flexibles, y el empaquetado final de bits (CABAC) es un codificador aritmético más afinado que las tablas de Huffman de JPEG.
- **Filtrado dentro del bucle.** El desbloqueo y una etapa llamada *sample adaptive offset* suavizan las fronteras entre bloques, y por eso las imágenes HEVC se degradan con más elegancia que la conocida papilla cuadriculada del JPEG.

Súmalo todo y obtienes el resultado de titular: **más o menos la misma calidad visual con aproximadamente la mitad del tamaño**. Esa es toda la razón por la que en tu iPhone caben el doble de fotos de las que cabrían de otro modo.

Para ver en la práctica qué ocurre cuando sacas una foto de este formato, consulta [si convertir HEIC a JPG reduce la calidad](/es/blog/convertir-heic-a-jpg-pierde-calidad).

## Qué añade el contenedor HEIF por encima

Incluso con un gran códec, sigue haciendo falta un sitio donde poner el resultado, y es el diseño de HEIF lo que hace posibles funciones del iPhone como las Live Photos.

HEIF se construye sobre el mismo ISO Base Media File Format que sustenta el MP4. Eso significa que piensa en términos de **elementos y pistas**, no de «una imagen, un archivo». Un solo archivo HEIF puede contener:

- **Varias imágenes.** Secuencias en ráfaga, horquillado de exposición y colecciones de imágenes viven todos en un mismo archivo.
- **Una imagen más una pista de vídeo.** Esto es exactamente una Live Photo: un fotograma fijo junto a un breve clip en movimiento.
- **Capas auxiliares.** Los mapas de profundidad y los canales alfa (transparencia) viajan como elementos separados; así guarda el modo Retrato los datos del desenfoque de fondo.
- **Ediciones no destructivas.** Recortes, rotaciones y superposiciones pueden registrarse como *instrucciones* aplicadas a la imagen original, en vez de quedar incrustadas.
- **Miniaturas y mosaico.** Las imágenes grandes pueden almacenarse como una rejilla de teselas, de modo que un visor decodifica solo la región que estás mirando.
- **Color más rico.** HEIF admite profundidades de 10 bits y superiores, frente a los 8 bits por canal de JPEG: degradados visiblemente más suaves en cielos y sombras, y mucho más margen al editar.

Nada de eso cabe en un archivo JPEG. JPEG guarda una imagen, 8 bits por canal, sin transparencia, y ahí acaba la historia.

## Entonces, ¿por qué no se abre en todas partes?

Dos razones, y la segunda es menos evidente que la primera.

**Es más nuevo.** JPEG ha tenido tres décadas para incrustarse en cada cámara, impresora, navegador, formulario de subida y programa empresarial olvidado del planeta. HEIF apenas tiene diez años.

**HEVC está sujeto a patentes.** A diferencia de JPEG, HEVC está cubierto por patentes repartidas entre varios consorcios de licencias, y los decodificadores suelen exigir el pago de regalías. Eso ha hecho que algunos fabricantes de plataformas y navegadores se resistan a incluir compatibilidad nativa, y explica en buena medida por qué la industria se ha ido agrupando en torno a alternativas libres de regalías como AV1 y AVIF para la web. No es que HEVC sea técnicamente insuficiente: es que las licencias ralentizaron su adopción universal.

La conclusión práctica: tu foto está bien. El archivo está correctamente formado y la imagen que contiene es de alta calidad. Simplemente, puede que el dispositivo que intenta abrirla no disponga de un decodificador HEVC con licencia.

## Qué significa esto para ti en la práctica

Conocer las tripas lleva a unas cuantas reglas concretas.

**Sigue disparando en Alta eficiencia.** El ahorro de espacio es real y la calidad es genuinamente igual o mejor que la del JPG. Deja *Ajustes → Cámara → Formatos* en **Alta eficiencia** y convierte copias solo cuando tengas que enviarlas a algún sitio.

**Convierte en la frontera, no en masa.** Como HEVC y JPEG son ambos con pérdida, cada recodificación es una nueva generación de compresión. Convierte las fotos concretas que vayas a compartir, conserva tus originales HEIC y no hagas ir y venir el mismo archivo una y otra vez.

**Elige el formato de destino según adónde va.** [HEIC a JPG](/heic-to-jpg) es la opción universal que se abre en cualquier parte. [HEIC a PNG](/heic-to-png) es sin pérdidas, así que el paso de conversión no añade ninguna compresión nueva: ideal si vas a seguir editando. [HEIC a WebP](/heic-to-webp) toma prestadas muchas de las mismas ideas modernas de compresión que HEVC y es la opción más ligera cuando la foto va destinada a una web.

**Cuenta con perder los extras.** Una Live Photo convertida a JPG se queda en un fotograma fijo. Los mapas de profundidad, los canales alfa y las instrucciones de edición tampoco sobreviven al viaje, porque el formato de destino no tiene dónde ponerlos. Si eso te importa, conserva el original HEIC junto a la copia convertida.

> **Nota:** la conversión en este sitio ocurre **enteramente dentro de tu navegador**: tus fotos se decodifican y recodifican en tu propio dispositivo, y no se sube nada a ningún servidor. Y eso es así aunque decodificar HEVC sea la parte más pesada del trabajo.

## En resumen

HEIF es un contenedor moderno construido con mentalidad de formato de vídeo: varias imágenes, datos de profundidad, transparencia y ediciones, todo en un archivo. HEVC es un códec de vídeo cuya compresión predictiva con bloques de tamaño variable resulta funcionar extremadamente bien con fotos fijas, recortando el tamaño aproximadamente a la mitad con igual calidad. HEIC es lo que obtienes cuando Apple junta ambos.

Es un formato genuinamente mejor que JPEG en casi todos los ejes técnicos. Su única debilidad real es que el resto del mundo todavía no ha terminado de ponerse al día, algo que se sortea en unos cinco segundos. Suelta tus archivos en el [conversor HEIC gratuito](/es/) y elige el formato que entienda tu destino. Si primero quieres los fundamentos del formato en sí, empieza por [qué es un archivo HEIC](/es/blog/que-es-un-archivo-heic).
