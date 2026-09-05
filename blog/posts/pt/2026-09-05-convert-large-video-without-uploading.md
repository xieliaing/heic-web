---
title: Como converter um vídeo com mais de 1 GB sem enviá-lo para lugar nenhum
description: Conversores online limitam você a algumas centenas de megabytes e querem seu arquivo no servidor deles primeiro. Veja como um navegador converte um vídeo de vários gigabytes localmente, e por que esse limite existia.
slug: converter-video-grande-sem-enviar
keywords: converter vídeo grande sem enviar, converter vídeo de 1gb no navegador, conversor de vídeo sem upload, conversor de vídeo arquivos grandes, mov para webm navegador, conversão de vídeo webcodecs, converter vídeo sem limite de tamanho
---

Você tem uma gravação de tela de 3 GB, um clipe de drone ou quarenta minutos de 4K filmados no celular, e precisa disso em outro formato. Então procura um conversor de vídeo online, e todos os resultados dizem alguma versão da mesma coisa: **tamanho máximo 100 MB**. Ou 500 MB. Ou 2 GB se você pagar uma mensalidade.

E mesmo quando algum serviço aceita o arquivo, agora você está enviando vários gigabytes por uma conexão doméstica, esperando numa fila atrás dos arquivos de outras pessoas e confiando ao servidor de um estranho um material do qual talvez não queira cópia nenhuma. Para muitas gravações — trabalho de cliente, registros médicos, qualquer coisa filmada dentro de uma empresa — esse último ponto não é um detalhe pequeno.

Existe um jeito de fazer isso que não envolve envio algum. E, a partir deste mês, ele funciona com arquivos bem acima de 1 GB.

## A resposta curta

**Abra o [conversor de vídeo](/pt/video) no navegador, arraste um arquivo MP4, M4V ou MOV e escolha WebM como formato de saída.** A conversão roda na sua própria máquina, usando os codecs de vídeo que o navegador já traz. Nada é enviado, não há fila, não há conta e não há limite de tamanho da nossa parte — uma gravação de vários gigabytes é convertida do mesmo jeito que uma de 10 MB.

O resto deste texto explica por que exatamente essa combinação, e o que acontece fora dela.

## Por que conversores online têm limite de tamanho

Um limite não é preguiça. Quando um conversor roda no servidor de alguém, seu arquivo custa a essa pessoa três coisas distintas: **banda** para recebê-lo, **disco** para guardá-lo enquanto o trabalho acontece e **tempo de CPU** para transcodificar. Um único envio de 3 GB de um usuário gratuito é realmente caro, e não há receita associada a ele. Limitar envios gratuitos a 100 MB é a única coisa que torna o plano gratuito sustentável.

A consequência para a privacidade vem da mesma arquitetura. Para converter seu vídeo na máquina deles, seu vídeo precisa primeiro estar na máquina deles. As políticas de retenção variam e a maioria é honesta, mas o arquivo ainda assim foi copiado, ficou num disco que você não controla e passou por uma rede que não é sua.

Um conversor que roda no navegador contorna os três custos de uma vez, porque a máquina que faz o trabalho já é a sua. É esse o desenho que o HeicQuick usa para fotos e para vídeo: o código de conversão é baixado para o seu dispositivo e executado ali, e o arquivo nunca viaja.

## Por que conversores de navegador também tinham um limite

Esta é a parte que a maioria dos artigos pula. Rodar localmente elimina os limites do *servidor* e imediatamente introduz outro.

Até pouco tempo atrás, converter vídeo no navegador significava **FFmpeg compilado para WebAssembly** — o FFmpeg de verdade, rodando dentro da sandbox da página. É uma engenharia impressionante e dá conta de praticamente qualquer formato já criado. Mas a build padrão é de **32 bits**, ou seja, endereça cerca de 2 GB de memória no total e trabalha com o arquivo inteiro de uma vez: a entrada precisa ser copiada para a memória dela, e a saída é construída ao lado.

Duas cópias sob um teto de 2 GB dão um limite prático de entrada de cerca de 1 GB, e muitas vezes bem menos. Um clipe 1080p recodificado para WebM pode esgotar essa memória bem antes de o arquivo em si chegar a 1 GB, porque o que realmente consome memória é resolução e duração, não bytes em disco. Passado esse ponto, aparece um erro de memória — e isso é uma experiência ruim por mais bem redigida que seja.

Ou seja, o navegador tinha trocado o limite de *política* de um servidor pelo limite *físico* de um navegador. Melhor, mas ainda um limite.

## O que mudou: transmitir pelos codecs do próprio navegador

Navegadores modernos trazem uma API chamada **WebCodecs**, que expõe os mesmos decodificadores e codificadores de vídeo por hardware que sua máquina já usa para tocar Netflix ou gravar uma chamada de vídeo. Esses codecs vivem fora da sandbox do WebAssembly, em código nativo, com acesso à sua GPU.

Daí decorrem duas coisas, e a segunda é a interessante.

**É rápido.** O trabalho roda em silício dedicado a vídeo em vez de um único núcleo de CPU dentro de uma sandbox. Medido num clipe HEVC 1080p de 10 segundos com áudio, converter para WebM leva cerca de **8 segundos** via WebCodecs contra cerca de **142 segundos** pelo caminho WebAssembly. Isso é aproximadamente uma ordem de grandeza — e ainda dispensa por completo o download único de 31 MB do motor.

**Ele transmite em fluxo.** É isso que remove o limite de tamanho. Em vez de carregar o vídeo inteiro na memória, o conversor analisa apenas os metadados do arquivo — o índice que diz onde está cada quadro — e então lê a gravação **em lotes de poucas amostras**: cada pedaço vai para o decodificador, depois para o codificador, é escrito e liberado. Em nenhum momento o arquivo completo existe na memória. Um vídeo de 5 GB e um de 50 MB usam quase a mesma quantidade de RAM; o de 5 GB apenas demora mais.

O teto prático deixa de ser sua memória e passa a ser seu espaço livre em disco.

## A combinação exata que funciona

Transmitir em fluxo exige conseguir localizar os quadros sem ler tudo, o que exige um contêiner indexado. Na prática:

- **Entrada:** MP4, M4V ou MOV — os formatos ISO base media, que é o que iPhones, Macs, drones e a maioria dos gravadores de tela produzem.
- **Saída:** WebM.
- **Requer:** um navegador com WebCodecs — Chrome, Edge, Opera e Safari 16.4 ou mais recente.

Dentro dessa combinação, o conversor consulta seu hardware pelo melhor codificador disponível: **AV1** primeiro, depois **VP9**, depois **VP8**, com VP8 por software como reserva caso sua máquina não tenha codificador WebM em hardware. O áudio sai em Opus. O selo na linha do arquivo mostra qual codificador rodou e se foi GPU ou CPU.

Todo o resto — AVI, MKV, TS, WMV, FLV e qualquer saída que não seja WebM — continua rodando no motor WebAssembly, com o limite de entrada de 1 GB descrito acima. Se o caminho rápido não se aplicar, ou falhar por qualquer motivo, a conversão volta automaticamente para esse motor, então você nunca perde uma conversão por causa de uma otimização que não deu certo.

## Por que WebM, e ele vai tocar?

WebM é um contêiner feito exatamente para isso: codecs livres de royalties, sem licenciamento de patentes e com suporte nativo em todos os motores de navegador. Ele toca no Chrome, Firefox, Edge, Safari, no Android e no VLC, e sobe sem problemas para YouTube, Discord e a maioria das plataformas web.

Onde ele não é a resposta certa: TVs mais antigas, alguns programas de edição e o PowerPoint preferem MP4/H.264. Se você precisa de MP4 e o arquivo passa de 1 GB, as opções honestas são converter em resolução menor, dividir a gravação em partes mais curtas ou usar um programa de desktop. Preferimos dizer isso com clareza a deixar você esbarrar num erro de memória vinte minutos depois.

## Passo a passo

1. Abra o [conversor de vídeo](/pt/video). Nada a instalar, sem conta.
2. Arraste seu arquivo para a página, ou clique para procurar. Vários de uma vez tudo bem.
3. Escolha **WebM** como formato de saída.
4. Deixe a resolução em *Original*, ou baixe para 720p se também quiser um arquivo menor.
5. Clique em **Converter**. A linha mostra o progresso ao vivo e o codificador em uso.
6. Baixe. Vários arquivos vêm juntos como ZIP.

Você pode desconectar da internet antes do passo 5 e mesmo assim vai funcionar.

## O que isso significa de fato para a privacidade

Vale ser preciso, porque "não guardamos seus arquivos" é uma frase que todo conversor usa e que aqui significa outra coisa.

Não existe etapa de envio em que confiar. Não há conversão no servidor, nem armazenamento temporário, nem janela de retenção, nem política de exclusão para ler — porque o arquivo não chega a lugar nenhum. Seu vídeo é lido do seu disco por código que roda na sua própria aba do navegador, e a saída é escrita de volta no seu próprio disco. A única coisa que cruza a rede é a página em si.

Para quem converte material sob acordo de confidencialidade, gravações médicas ou jurídicas, ou trabalho não publicado, isso não é uma distinção de marketing. É a razão inteira de usar um conversor local.

## Conclusão

Conversores online limitam o tamanho do seu arquivo porque o seu arquivo custa dinheiro a eles, e porque eles precisam dele no servidor para sequer fazer o trabalho. Um conversor que roda no seu navegador não tem nenhum desses dois problemas — e agora que MP4/MOV para WebM é transmitido pelos codecs de hardware da sua própria máquina, ele também não tem teto de memória.

Gravações de vários gigabytes são convertidas em segundos em vez de minutos, sem que um único byte saia do seu dispositivo.

Teste com aquele arquivo que foi recusado em outro lugar: [converter vídeo no navegador](/pt/video). Dúvidas sobre formatos, velocidade ou o que ainda tem limite estão respondidas nas [perguntas frequentes](/pt/faq). E se forem fotos em vez de vídeo, a mesma abordagem sem upload converte [HEIC para JPG](/heic-to-jpg) — o contexto sobre esse formato está em [o que é um arquivo HEIC](/pt/blog/o-que-e-um-arquivo-heic).
