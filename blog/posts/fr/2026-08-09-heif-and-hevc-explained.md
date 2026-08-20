---
title: HEIF et HEVC expliqués — la technologie derrière vos photos iPhone
description: HEIF est le conteneur, HEVC la compression. Voici comment ils divisent par deux le poids de vos photos, expliqué simplement, sans diplôme d'ingénieur.
slug: heif-et-hevc-expliques
keywords: format heif, compression hevc, h.265, heic vs heif, comment fonctionne la compression heic, heif expliqué, hevc vs jpeg
---

Chaque photo HEIC de votre iPhone est le produit de deux inventions distinctes qui travaillent ensemble : un **conteneur**, qui décide de la façon dont le fichier est organisé, et un **codec**, qui décide de la façon dont les pixels sont comprimés. Le conteneur, c'est **HEIF**. Le codec, c'est en général **HEVC**.

La plupart des explications s'arrêtent à « c'est plus léger qu'un JPG ». C'est vrai, mais cela ne dit pas *pourquoi* — ni pourquoi cette même technologie fait parfois qu'une photo refuse de s'ouvrir sur l'ordinateur portable d'un ami. Voici ce qui se passe réellement à l'intérieur du fichier.

## HEIF, HEVC, HEIC — démêler les noms

Ces trois sigles sont employés indifféremment, et c'est là la principale source de confusion. Ils ne désignent pourtant pas la même chose.

- **HEIF** — *High Efficiency Image File Format*. Le **conteneur**. C'est la boîte : la manière dont les images, les vignettes, les métadonnées et les pistes supplémentaires sont agencées dans un même fichier. Normalisé par le MPEG en 2015 dans la partie ISO/IEC 23008-12.
- **HEVC** — *High Efficiency Video Coding*, aussi appelé **H.265**. Le **codec**. Ce sont les mathématiques de compression qui transforment les données de pixels en un petit flux de bits. Normalisé en 2013.
- **HEIC** — l'extension de fichier précise qu'Apple utilise pour un conteneur HEIF dont les images sont compressées en HEVC.

Une analogie utile : HEIF est comme un fichier `.zip`, HEVC comme l'algorithme de compression qu'il contient, et HEIC est la combinaison particulière que livre Apple. En principe, un conteneur HEIF peut abriter des images encodées avec *autre chose* que HEVC — des images encodées en AV1 dans un conteneur de type HEIF s'appellent AVIF, un proche cousin. En pratique, quand vous voyez `.heic`, vous avez affaire à du HEVC dans du HEIF.

## Pourquoi un codec vidéo compresse-t-il votre photo fixe ?

C'est la partie véritablement astucieuse. HEVC a été conçu pour compresser de la vidéo 4K, et les codecs vidéo ont passé trente ans à devenir extrêmement bons à une chose : **prédire les pixels au lieu de les stocker**.

Le JPEG, conçu en 1992, fait quelque chose de comparativement simple. Il découpe l'image en blocs de 8 × 8 pixels, convertit chaque bloc en informations de fréquence, puis jette les détails de haute fréquence que l'œil remarque le moins. C'est élégant et cela fonctionne — mais chaque bloc est traité plus ou moins isolément, à une taille fixe, avec une boîte à outils fixe.

HEVC apporte au même travail des décennies d'astuces supplémentaires :

- **Des tailles de blocs variables.** Au lieu d'une grille rigide de 8 × 8, HEVC découpe l'image en unités d'arbre de codage allant jusqu'à 64 × 64 pixels, puis les subdivise de manière adaptative. Un ciel bleu uniforme occupe un seul grand bloc, presque gratuit à décrire. Un visage est découpé en petits blocs, là où le détail compte vraiment. Le JPEG, lui, doit dépenser la même grille dans les deux cas.
- **La prédiction intra-image.** Avant de stocker un bloc, HEVC le *devine* à partir des pixels déjà décodés à sa gauche et au-dessus, en choisissant parmi 35 modes de prédiction directionnelle. Il ne stocke ensuite que la **différence** entre la supposition et la réalité. Quand la supposition est bonne — et sur des photos réelles elle l'est presque toujours — cette différence est quasi nulle, et des données quasi nulles se compressent en presque rien.
- **De meilleures transformées et un meilleur codage entropique.** La différence résiduelle passe par des transformées plus souples, et l'étape finale d'empaquetage des bits (CABAC) est un codeur arithmétique plus fin que les tables de Huffman du JPEG.
- **Un filtrage dans la boucle.** Le déblocage et une étape appelée *sample adaptive offset* adoucissent les frontières entre les blocs, ce qui explique pourquoi les images HEVC se dégradent plus élégamment que la fameuse bouillie en damier du JPEG.

Cumulez tout cela et vous obtenez le résultat annoncé : **à peu près la même qualité visuelle pour environ la moitié du poids**. C'est toute la raison pour laquelle votre iPhone peut contenir deux fois plus de photos qu'autrement.

Pour un regard pratique sur ce qui se produit lorsque vous faites ressortir une photo de ce format, lisez [convertir un HEIC en JPG fait-il perdre de la qualité](/fr/blog/convertir-heic-en-jpg-perte-de-qualite).

## Ce que le conteneur HEIF ajoute par-dessus

Même avec un excellent codec, il faut encore un endroit où ranger le résultat — et c'est la conception de HEIF qui rend possibles des fonctions d'iPhone comme les Live Photos.

HEIF repose sur le même ISO Base Media File Format que celui qui sous-tend le MP4. Autrement dit, il raisonne en **éléments et en pistes** plutôt qu'en « une image, un fichier ». Un seul fichier HEIF peut contenir :

- **Plusieurs images.** Les rafales, les expositions en bracketing et les collections d'images tiennent dans un même fichier.
- **Une image accompagnée d'une piste vidéo.** C'est exactement ce qu'est une Live Photo : une image fixe accompagnée d'un court extrait animé.
- **Des couches auxiliaires.** Les cartes de profondeur et les canaux alpha (transparence) voyagent comme des éléments distincts ; c'est ainsi que le mode Portrait stocke les données de flou d'arrière-plan.
- **Des retouches non destructives.** Recadrages, rotations et incrustations peuvent être enregistrés comme des *instructions* appliquées à l'image d'origine, plutôt que d'y être gravés.
- **Des vignettes et un pavage.** Les grandes images peuvent être stockées sous forme de grille de tuiles, si bien qu'une visionneuse ne décode que la zone que vous regardez.
- **Des couleurs plus riches.** HEIF prend en charge une profondeur de 10 bits et plus, contre 8 bits par canal pour le JPEG — des dégradés visiblement plus doux dans les ciels et les ombres, et beaucoup plus de marge pour retoucher.

Rien de tout cela ne tient dans un fichier JPEG. Le JPEG stocke une image, 8 bits par canal, pas de transparence, et c'est toute l'histoire.

## Alors pourquoi ne s'ouvre-t-il pas partout ?

Deux raisons, et la seconde est moins évidente que la première.

**C'est plus récent.** Le JPEG a eu trois décennies pour s'installer dans chaque appareil photo, imprimante, navigateur, formulaire d'envoi et logiciel d'entreprise oublié de la planète. HEIF a à peine dix ans.

**HEVC est grevé de brevets.** Contrairement au JPEG, HEVC est couvert par des brevets répartis entre plusieurs pools de licences, et les décodeurs exigent généralement le versement de redevances. Cela a rendu certains éditeurs de plateformes et de navigateurs réticents à intégrer une prise en charge native, et cela explique en grande partie pourquoi l'industrie converge vers des solutions libres de redevances comme AV1 et AVIF pour le web. Ce n'est pas que HEVC soit techniquement insuffisant : c'est que les licences ont ralenti son adoption universelle.

Conséquence pratique : votre photo va très bien. Le fichier est correctement formé et l'image qu'il contient est de grande qualité. C'est simplement que l'appareil qui tente de l'ouvrir ne dispose peut-être pas d'un décodeur HEVC sous licence.

## Ce que cela signifie concrètement pour vous

Connaître les rouages mène à quelques règles concrètes.

**Continuez à photographier en Haute efficacité.** Le gain de stockage est réel et la qualité est réellement égale ou supérieure à celle du JPG. Laissez *Réglages → Appareil photo → Formats* sur **Haute efficacité** et ne convertissez des copies que lorsque vous devez les envoyer quelque part.

**Convertissez à la frontière, pas en masse.** Comme HEVC et JPEG sont tous deux des formats avec perte, chaque réencodage est une nouvelle génération de compression. Convertissez les photos précises que vous partagez, conservez vos originaux HEIC, et ne faites pas faire des allers-retours au même fichier.

**Choisissez le format cible selon la destination.** [HEIC en JPG](/heic-to-jpg) est le choix universel qui s'ouvre partout. [HEIC en PNG](/heic-to-png) est sans perte : l'étape de conversion n'ajoute donc aucune compression nouvelle — idéal si vous comptez retoucher ensuite. [HEIC en WebP](/heic-to-webp) emprunte beaucoup des mêmes idées modernes de compression que HEVC et constitue l'option la plus légère quand la photo est destinée à un site web.

**Attendez-vous à perdre les extras.** Une Live Photo convertie en JPG devient une image fixe. Les cartes de profondeur, les canaux alpha et les instructions de retouche ne survivent pas non plus au voyage, car le format de destination n'a nulle part où les mettre. Si ces éléments comptent, conservez l'original HEIC à côté de la copie convertie.

> **À noter :** sur ce site, la conversion se déroule **entièrement dans votre navigateur** — vos photos sont décodées et réencodées sur votre propre appareil, et rien n'est envoyé vers un serveur. C'est vrai même si le décodage HEVC est la partie la plus lourde du travail.

## En résumé

HEIF est un conteneur moderne bâti sur une logique de format vidéo : plusieurs images, données de profondeur, transparence et retouches, le tout dans un seul fichier. HEVC est un codec vidéo dont la compression prédictive à taille de blocs variable se trouve fonctionner remarquablement bien sur des photos fixes, divisant le poids des fichiers par deux environ à qualité égale. Le HEIC, c'est ce que l'on obtient quand Apple assemble les deux.

C'est un format véritablement meilleur que le JPEG sur presque tous les plans techniques. Sa seule vraie faiblesse est que le reste du monde n'a pas fini de le rattraper — un obstacle qui se contourne en cinq secondes. Déposez vos fichiers sur le [convertisseur HEIC gratuit](/fr/) et choisissez le format que votre destinataire comprend. Si vous voulez d'abord des bases sur le format lui-même, commencez par [qu'est-ce qu'un fichier HEIC](/fr/blog/qu-est-ce-qu-un-fichier-heic).
