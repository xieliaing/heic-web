---
title: Cómo convertir un vídeo de más de 1 GB sin subirlo a ningún sitio
description: Los conversores en línea te limitan a unos cientos de megabytes y quieren tu archivo en su servidor primero. Así convierte un navegador un vídeo de varios gigabytes en local, y por qué existía ese límite.
slug: convertir-video-grande-sin-subirlo
keywords: convertir vídeo grande sin subirlo, convertir vídeo de 1gb en el navegador, conversor de vídeo sin subir, conversor de vídeo archivos grandes, mov a webm navegador, conversión de vídeo webcodecs, convertir vídeo sin límite de tamaño
---

Tienes una grabación de pantalla de 3 GB, una toma de dron o cuarenta minutos de 4K grabados con el móvil, y lo necesitas en otro formato. Así que buscas un conversor de vídeo en línea, y todos los resultados te dicen alguna versión de lo mismo: **tamaño máximo 100 MB**. O 500 MB. O 2 GB si pagas una cuota mensual.

E incluso cuando un servicio acepta el archivo, ahora estás subiendo varios gigabytes por una conexión doméstica, esperando en una cola detrás de los archivos de otras personas y confiando material que quizá no quieras que se copie al servidor de un desconocido. Para muchas grabaciones —trabajo de cliente, registros médicos, cualquier cosa filmada dentro de una empresa— ese último punto no es un detalle menor.

Hay una forma de hacerlo que no implica ninguna subida. Y desde este mes funciona con archivos que superan con creces 1 GB.

## La respuesta corta

**Abre el [conversor de vídeo](/es/video) en tu navegador, arrastra un archivo MP4, M4V o MOV y elige WebM como formato de salida.** La conversión se ejecuta en tu propio equipo con los códecs de vídeo que tu navegador ya trae. No se sube nada, no hay cola, no hay cuenta y no hay límite de tamaño por nuestra parte: una grabación de varios gigabytes se convierte igual que una de 10 MB.

El resto de este artículo explica por qué precisamente esa combinación, y qué ocurre fuera de ella.

## Por qué los conversores en línea tienen límites de tamaño

Un límite no es pereza. Cuando un conversor se ejecuta en el servidor de alguien, tu archivo le cuesta tres cosas distintas: **ancho de banda** para recibirlo, **disco** para guardarlo mientras trabaja y **tiempo de CPU** para transcodificarlo. Una sola subida de 3 GB de un usuario gratuito es realmente cara, y no lleva ningún ingreso asociado. Limitar las subidas gratuitas a 100 MB es lo único que hace viable el plan gratuito.

La consecuencia para la privacidad sale de la misma arquitectura. Para convertir tu vídeo en su máquina, primero tienen que tener tu vídeo en su máquina. Las políticas de retención varían y la mayoría son honestas, pero el archivo se copió igualmente, estuvo en un disco que no controlas y pasó por una red que no es tuya.

Un conversor que se ejecuta en el navegador esquiva los tres costes a la vez, porque la máquina que hace el trabajo ya es la tuya. Ese es el diseño que HeicQuick usa tanto para fotos como para vídeo: el código de conversión se descarga a tu dispositivo y se ejecuta allí, y el archivo nunca viaja.

## Por qué los conversores de navegador también tenían un límite

Esta es la parte que casi todos los artículos se saltan. Trabajar en local elimina los límites del *servidor* e introduce de inmediato otro distinto.

Hasta hace poco, convertir vídeo en el navegador significaba **FFmpeg compilado a WebAssembly**: el FFmpeg de verdad, ejecutándose en el entorno aislado de la página. Es una pieza de ingeniería admirable y maneja casi cualquier formato jamás creado. Pero la compilación estándar es de **32 bits**, lo que significa que puede direccionar unos 2 GB de memoria en total y trabaja con el archivo entero de una vez: la entrada tiene que copiarse a su memoria, y la salida se construye al lado.

Dos copias bajo un techo de 2 GB dan un límite práctico de entrada de aproximadamente 1 GB, y a menudo mucho menos. Un clip 1080p recodificado a WebM puede agotar esa memoria bastante antes de que el archivo llegue a 1 GB, porque lo que consume memoria de verdad es la resolución y la duración, no los bytes en disco. Pasado ese punto aparece un error de memoria, y esa es una mala experiencia por muy bien que se redacte.

Es decir, el navegador había cambiado el límite de *política* de un servidor por el límite *físico* de un navegador. Mejor, pero seguía siendo un límite.

## Qué ha cambiado: transmitir por los códecs del propio navegador

Los navegadores modernos incluyen una interfaz llamada **WebCodecs**, que expone los mismos decodificadores y codificadores de vídeo por hardware que tu equipo ya usa para reproducir Netflix o grabar una videollamada. Esos códecs viven fuera del entorno aislado de WebAssembly, en código nativo, con acceso a tu GPU.

De ahí se siguen dos cosas, y la segunda es la interesante.

**Es rápido.** El trabajo corre sobre silicio de vídeo dedicado en lugar de un único núcleo de CPU dentro de un entorno aislado. Medido con un clip HEVC 1080p de 10 segundos con audio, convertir a WebM tarda unos **8 segundos** por WebCodecs frente a unos **142 segundos** por la vía WebAssembly. Eso es aproximadamente un orden de magnitud, y además se salta por completo la descarga única de 31 MB del motor.

**Va en flujo.** Esto es lo que elimina el límite de tamaño. En lugar de cargar todo el vídeo en memoria, el conversor analiza solo los metadatos del archivo —el índice que dice dónde está cada fotograma— y luego lee la grabación **en tandas de unas pocas muestras**: cada bloque pasa al decodificador, después al codificador, se escribe y se libera. En ningún momento existe el archivo completo en memoria. Un vídeo de 5 GB y uno de 50 MB usan casi la misma cantidad de RAM; el de 5 GB simplemente tarda más.

El techo práctico deja de ser tu memoria y pasa a ser tu espacio libre en disco.

## La combinación exacta que funciona

Transmitir en flujo exige poder localizar los fotogramas sin leerlo todo, y eso exige un contenedor indexado. En la práctica:

- **Entrada:** MP4, M4V o MOV — los formatos ISO base media, que es lo que producen los iPhone, los Mac, los drones y la mayoría de grabadores de pantalla.
- **Salida:** WebM.
- **Requiere:** un navegador con WebCodecs — Chrome, Edge, Opera y Safari 16.4 o posterior.

Dentro de esa combinación, el conversor consulta tu hardware para usar el mejor codificador disponible: primero **AV1**, luego **VP9**, luego **VP8**, con VP8 por software como respaldo si tu equipo no tiene codificador WebM por hardware. El audio sale en Opus. La etiqueta en la fila del archivo indica qué codificador se usó y si fue GPU o CPU.

Todo lo demás —AVI, MKV, TS, WMV, FLV y cualquier salida que no sea WebM— sigue ejecutándose en el motor WebAssembly, con el límite de entrada de 1 GB descrito arriba. Si la vía rápida no es aplicable, o falla por cualquier motivo, la conversión recae automáticamente en ese motor, así que nunca pierdes una conversión por una optimización fallida.

## Por qué WebM, ¿y se podrá reproducir?

WebM es un contenedor pensado justo para esto: códecs libres de regalías, sin licencias de patentes y con soporte nativo en todos los motores de navegador. Se reproduce en Chrome, Firefox, Edge, Safari, en Android y en VLC, y se sube sin problemas a YouTube, Discord y la mayoría de plataformas web.

Dónde no es la respuesta correcta: televisores antiguos, algunos programas de edición y PowerPoint prefieren MP4/H.264. Si necesitas MP4 y el archivo supera 1 GB, las opciones honestas son convertir a menor resolución, dividir la grabación en fragmentos más cortos o usar una herramienta de escritorio. Preferimos decirlo claramente antes que dejar que choques con un error de memoria a los veinte minutos.

## Paso a paso

1. Abre el [conversor de vídeo](/es/video). Nada que instalar, sin cuenta.
2. Arrastra tu archivo a la página, o haz clic para buscarlo. Varios a la vez está bien.
3. Elige **WebM** como formato de salida.
4. Deja la resolución en *Original*, o bájala a 720p si además quieres un archivo más pequeño.
5. Pulsa **Convertir**. La fila muestra el progreso en vivo y el codificador en uso.
6. Descarga. Varios archivos bajan juntos como ZIP.

Puedes desconectarte de internet antes del paso 5 y aun así funcionará.

## Qué significa esto de verdad para la privacidad

Conviene ser preciso, porque «no guardamos tus archivos» es una frase que dice todo conversor y aquí significa algo distinto.

No hay ningún paso de subida en el que confiar. No hay conversión en servidor, ni almacenamiento temporal, ni ventana de retención, ni política de borrado que leer, porque el archivo no llega a ninguna parte. Tu vídeo lo lee de tu disco código que se ejecuta en tu propia pestaña, y la salida se escribe de vuelta en tu propio disco. Lo único que cruza la red es la página misma.

Para quien convierte material bajo acuerdo de confidencialidad, grabaciones médicas o jurídicas, u obra inédita, esa no es una distinción de marketing. Es la razón entera para usar un conversor local.

## En resumen

Los conversores en línea limitan el tamaño de tu archivo porque tu archivo les cuesta dinero, y porque necesitan tenerlo en su servidor para hacer el trabajo siquiera. Un conversor que se ejecuta en tu navegador no tiene ninguno de esos dos problemas, y ahora que MP4/MOV a WebM se transmite por los códecs de hardware de tu propia máquina, tampoco tiene techo de memoria.

Grabaciones de varios gigabytes se convierten en segundos en lugar de minutos, sin que un solo byte salga de tu dispositivo.

Pruébalo con el archivo que te rechazaron en otro sitio: [convertir vídeo en tu navegador](/es/video). Las dudas sobre formatos, velocidad o qué sigue teniendo límite están respondidas en las [preguntas frecuentes](/es/faq). Y si son fotos en vez de vídeo, el mismo enfoque sin subidas convierte [HEIC a JPG](/heic-to-jpg) — el contexto sobre ese formato está en [qué es un archivo HEIC](/es/blog/que-es-un-archivo-heic).
