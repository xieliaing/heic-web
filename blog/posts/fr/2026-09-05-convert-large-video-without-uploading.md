---
title: Convertir une vidéo de plus de 1 Go sans l'envoyer nulle part
description: Les convertisseurs en ligne vous plafonnent à quelques centaines de mégaoctets et veulent d'abord votre fichier sur leur serveur. Voici comment un navigateur convertit une vidéo de plusieurs gigaoctets en local, et pourquoi cette limite existait.
slug: convertir-grande-video-sans-televerser
keywords: convertir une grande vidéo sans la téléverser, convertir une vidéo de 1 go dans le navigateur, convertisseur vidéo sans envoi, convertisseur vidéo gros fichiers, mov en webm navigateur, conversion vidéo webcodecs, convertir vidéo sans limite de taille
---

Vous avez une capture d'écran de 3 Go, une séquence de drone ou quarante minutes de 4K filmées au téléphone, et il vous la faut dans un autre format. Vous cherchez donc un convertisseur vidéo en ligne, et chaque résultat vous répète la même chose sous une forme ou une autre : **taille maximale 100 Mo**. Ou 500 Mo. Ou 2 Go si vous payez un abonnement mensuel.

Et même quand un service accepte le fichier, vous voilà en train de téléverser plusieurs gigaoctets depuis une connexion domestique, d'attendre derrière les fichiers des autres, et de confier à un serveur inconnu des images dont vous ne voulez peut-être aucune copie. Pour beaucoup d'enregistrements — travail client, documents médicaux, tout ce qui a été filmé à l'intérieur d'une entreprise — ce dernier point n'est pas un détail.

Il existe une façon de faire qui ne comporte aucun envoi. Et depuis ce mois-ci, elle fonctionne sur des fichiers bien au-delà de 1 Go.

## La réponse courte

**Ouvrez le [convertisseur vidéo](/fr/video) dans votre navigateur, déposez un fichier MP4, M4V ou MOV, et choisissez WebM comme format de sortie.** La conversion s'exécute sur votre propre machine, avec les codecs vidéo que votre navigateur possède déjà. Rien n'est envoyé, il n'y a pas de file d'attente, pas de compte et aucun plafond de taille de notre part — un enregistrement de plusieurs gigaoctets se convertit exactement comme un fichier de 10 Mo.

Le reste de cet article explique pourquoi cette combinaison précisément, et ce qui se passe en dehors d'elle.

## Pourquoi les convertisseurs en ligne imposent des limites de taille

Un plafond n'est pas de la paresse. Quand un convertisseur tourne sur le serveur de quelqu'un, votre fichier lui coûte trois choses distinctes : de la **bande passante** pour le recevoir, du **disque** pour le garder pendant le traitement, et du **temps processeur** pour le transcoder. Un seul envoi de 3 Go par un utilisateur gratuit coûte réellement cher, et aucun revenu n'y est attaché. Plafonner les envois gratuits à 100 Mo est la seule chose qui rende l'offre gratuite viable.

La conséquence sur la vie privée découle de la même architecture. Pour convertir votre vidéo sur leur machine, il faut d'abord que votre vidéo soit sur leur machine. Les politiques de conservation varient et la plupart sont honnêtes, mais le fichier a tout de même été copié, il a séjourné sur un disque que vous ne contrôlez pas, et il a traversé un réseau qui ne vous appartient pas.

Un convertisseur côté navigateur contourne ces trois coûts d'un coup, parce que la machine qui travaille est déjà la vôtre. C'est la conception que HeicQuick applique aux photos comme à la vidéo : le code de conversion est téléchargé sur votre appareil et s'y exécute, et le fichier, lui, ne bouge jamais.

## Pourquoi les convertisseurs navigateur avaient eux aussi une limite

Voici la partie que la plupart des articles sautent. Travailler en local supprime les limites du *serveur* et en introduit aussitôt une autre.

Jusqu'à récemment, convertir de la vidéo dans un navigateur voulait dire **FFmpeg compilé en WebAssembly** — le vrai FFmpeg, exécuté dans le bac à sable de la page. C'est une belle pièce d'ingénierie, capable de traiter presque tous les formats jamais créés. Mais la version standard est en **32 bits** : elle n'adresse qu'environ 2 Go de mémoire au total, et elle travaille sur le fichier entier d'un seul tenant — l'entrée doit être copiée dans sa mémoire, et la sortie se construit à côté.

Deux copies sous un plafond de 2 Go, cela donne une limite d'entrée pratique d'environ 1 Go, et souvent bien moins. Un clip 1080p réencodé en WebM peut épuiser cette mémoire bien avant que le fichier lui-même n'atteigne 1 Go, parce que ce qui consomme réellement de la mémoire, c'est la résolution et la durée, pas les octets sur le disque. Au-delà, vous obtenez une erreur de mémoire, et c'est une mauvaise expérience quelle que soit la formulation.

Le navigateur avait donc échangé la limite de *politique* d'un serveur contre la limite *physique* d'un navigateur. Mieux, mais toujours une limite.

## Ce qui a changé : passer en flux par les codecs du navigateur

Les navigateurs modernes proposent une interface appelée **WebCodecs**, qui expose les décodeurs et encodeurs vidéo matériels que votre machine utilise déjà pour lire Netflix ou enregistrer un appel vidéo. Ces codecs vivent hors du bac à sable WebAssembly, en code natif, avec accès à votre GPU.

Deux conséquences en découlent, et c'est la seconde qui est intéressante.

**C'est rapide.** Le travail tourne sur du silicium vidéo dédié plutôt que sur un unique cœur de processeur dans un bac à sable. Mesuré sur un clip HEVC 1080p de 10 secondes avec son, la conversion en WebM prend environ **8 secondes** via WebCodecs contre environ **142 secondes** par la voie WebAssembly. C'est à peu près un ordre de grandeur — et cela évite entièrement le téléchargement unique de 31 Mo du moteur.

**C'est du flux.** C'est cela qui supprime la limite de taille. Au lieu de charger toute la vidéo en mémoire, le convertisseur n'analyse que les métadonnées du fichier — l'index qui indique où se trouve chaque image — puis lit l'enregistrement **par petits paquets de quelques échantillons** : chaque bloc passe au décodeur, puis à l'encodeur, est écrit, puis relâché. À aucun moment le fichier complet n'existe en mémoire. Une vidéo de 5 Go et une vidéo de 50 Mo consomment presque autant de mémoire vive ; celle de 5 Go prend simplement plus de temps.

Le plafond pratique cesse d'être votre mémoire vive et devient votre espace disque libre.

## La combinaison qui fonctionne

Le traitement en flux suppose de pouvoir retrouver les images sans tout lire, ce qui suppose un conteneur indexé. Concrètement :

- **Entrée :** MP4, M4V ou MOV — les formats ISO base media, c'est-à-dire ce que produisent les iPhone, les Mac, les drones et la plupart des enregistreurs d'écran.
- **Sortie :** WebM.
- **Nécessite :** un navigateur doté de WebCodecs — Chrome, Edge, Opera et Safari 16.4 ou plus récent.

Dans cette combinaison, le convertisseur interroge votre matériel pour choisir le meilleur encodeur disponible : **AV1** d'abord, puis **VP9**, puis **VP8**, avec un repli sur VP8 logiciel si votre machine n'a pas d'encodeur WebM matériel. Le son sort en Opus. Le badge affiché sur la ligne du fichier indique quel encodeur a servi et s'il s'agissait du GPU ou du CPU.

Tout le reste — AVI, MKV, TS, WMV, FLV, ainsi que toute sortie autre que WebM — passe toujours par le moteur WebAssembly, avec la limite d'entrée de 1 Go décrite plus haut. Si la voie rapide ne s'applique pas, ou échoue pour une raison quelconque, la conversion bascule automatiquement sur ce moteur : une optimisation ratée ne vous coûte jamais la conversion elle-même.

## Pourquoi WebM, et est-ce que ça se lit ?

WebM est un conteneur conçu exactement pour cela : des codecs libres de redevances, aucune licence de brevet, et une prise en charge native dans tous les moteurs de navigateur. Il se lit dans Chrome, Firefox, Edge, Safari, sur Android, dans VLC, et se téléverse sans problème sur YouTube, Discord et la plupart des plateformes web.

Là où ce n'est pas la bonne réponse : les téléviseurs anciens, certains logiciels de montage et PowerPoint préfèrent le MP4/H.264. S'il vous faut du MP4 et que le fichier dépasse 1 Go, les options honnêtes sont de convertir à une résolution plus basse, de découper l'enregistrement en morceaux plus courts, ou d'utiliser un logiciel de bureau. Nous préférons le dire franchement plutôt que de vous laisser buter sur une erreur de mémoire après vingt minutes.

## Pas à pas

1. Ouvrez le [convertisseur vidéo](/fr/video). Rien à installer, pas de compte.
2. Glissez votre fichier sur la page, ou cliquez pour parcourir. Plusieurs fichiers à la fois, c'est possible.
3. Choisissez **WebM** comme format de sortie.
4. Laissez la résolution sur *Originale*, ou descendez à 720p si vous voulez aussi un fichier plus léger.
5. Appuyez sur **Convertir**. La ligne affiche la progression en direct et l'encodeur utilisé.
6. Téléchargez. Plusieurs fichiers arrivent ensemble dans un ZIP.

Vous pouvez couper Internet avant l'étape 5 : cela fonctionnera quand même.

## Ce que cela signifie vraiment pour la vie privée

Il vaut la peine d'être précis, parce que « nous ne conservons pas vos fichiers » est une promesse que fait chaque convertisseur, et qu'ici elle veut dire autre chose.

Il n'y a aucune étape d'envoi à laquelle faire confiance. Pas de conversion côté serveur, pas de stockage temporaire, pas de durée de conservation, pas de politique de suppression à lire — parce que le fichier n'arrive nulle part. Votre vidéo est lue depuis votre disque par du code qui s'exécute dans votre propre onglet, et le résultat est réécrit sur votre propre disque. La seule chose qui traverse le réseau, c'est la page elle-même.

Pour qui convertit des images sous accord de confidentialité, des enregistrements médicaux ou juridiques, ou un travail non publié, ce n'est pas une nuance marketing. C'est toute la raison d'utiliser un convertisseur local.

## En résumé

Les convertisseurs en ligne plafonnent la taille de vos fichiers parce que votre fichier leur coûte de l'argent, et parce qu'il leur faut ce fichier sur leur serveur pour faire le travail. Un convertisseur qui tourne dans votre navigateur n'a ni l'un ni l'autre de ces problèmes — et maintenant que MP4/MOV vers WebM passe en flux par les codecs matériels de votre propre machine, il n'a plus non plus de plafond mémoire.

Des enregistrements de plusieurs gigaoctets se convertissent en secondes plutôt qu'en minutes, sans qu'un seul octet quitte votre appareil.

Essayez avec le fichier qu'on a refusé ailleurs : [convertir une vidéo dans votre navigateur](/fr/video). Les questions sur les formats, la vitesse, ou ce qui reste limité trouvent leur réponse dans la [FAQ](/fr/faq). Et s'il s'agit de photos plutôt que de vidéo, la même approche sans envoi convertit [HEIC en JPG](/heic-to-jpg) — les bases du format sont dans [qu'est-ce qu'un fichier HEIC](/fr/blog/qu-est-ce-qu-un-fichier-heic).
