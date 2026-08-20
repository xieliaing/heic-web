---
title: HEIF e HEVC explicados — a tecnologia por trás das fotos do seu iPhone
description: HEIF é o contêiner, HEVC é a compressão. Como os dois se combinam para reduzir pela metade o tamanho das suas fotos, em linguagem simples.
slug: heif-e-hevc-explicados
keywords: formato heif, compressao hevc, h.265, heic vs heif, como funciona a compressao heic, heif explicado, hevc vs jpeg
---

Cada foto HEIC no seu iPhone é o produto de duas invenções distintas trabalhando juntas: um **contêiner**, que decide como o arquivo é organizado, e um **códec**, que decide como os pixels são comprimidos. O contêiner é o **HEIF**. O códec costuma ser o **HEVC**.

A maioria das explicações para em "é menor que JPG". É verdade, mas não diz *por quê* — nem por que a mesma tecnologia às vezes faz sua foto se recusar a abrir no notebook de um amigo. Veja o que realmente acontece dentro do arquivo.

## HEIF, HEVC, HEIC — organizando os nomes

Essas três siglas são usadas como sinônimos, e é daí que vem a maior parte da confusão. Elas não são a mesma coisa.

- **HEIF** — *High Efficiency Image File Format*. O **contêiner**. É a caixa: como imagens, miniaturas, metadados e trilhas extras são organizados dentro de um único arquivo. Padronizado pelo MPEG em 2015 como parte da ISO/IEC 23008-12.
- **HEVC** — *High Efficiency Video Coding*, também chamado de **H.265**. O **códec**. É a matemática de compressão que transforma dados de pixels num pequeno fluxo de bits. Padronizado em 2013.
- **HEIC** — a extensão específica que a Apple usa para um contêiner HEIF cujas imagens estão comprimidas com HEVC.

Uma analogia útil: HEIF é como um arquivo `.zip`, HEVC é como o algoritmo de compressão dentro dele, e HEIC é a combinação específica que a Apple entrega. Em princípio, um contêiner HEIF pode guardar imagens codificadas com *algo diferente* de HEVC — imagens codificadas em AV1 num contêiner do tipo HEIF chamam-se AVIF, um primo próximo. Na prática, quando você vê `.heic`, está vendo HEVC dentro de HEIF.

## Por que um códec de vídeo comprime sua foto parada

Esta é a parte genuinamente engenhosa. O HEVC foi projetado para comprimir vídeo 4K, e os códecs de vídeo passaram trinta anos ficando extremamente bons numa coisa só: **prever pixels em vez de armazená-los**.

O JPEG, projetado em 1992, faz algo comparativamente simples. Ele corta a imagem em blocos de 8 × 8 pixels, converte cada bloco em informação de frequência e joga fora os detalhes de alta frequência que o olho percebe pior. É elegante e funciona — mas cada bloco é tratado mais ou menos por conta própria, num tamanho fixo, com um conjunto fixo de ferramentas.

O HEVC traz décadas de truques adicionais para o mesmo trabalho:

- **Tamanhos de bloco variáveis.** Em vez de uma grade rígida de 8 × 8, o HEVC divide a imagem em unidades de árvore de codificação de até 64 × 64 pixels e depois as subdivide de forma adaptativa. Um céu azul uniforme ganha um único bloco grande, que quase não custa nada para descrever. Um rosto é recortado em blocos pequenos, onde o detalhe realmente importa. O JPEG precisa gastar a mesma grade nos dois casos.
- **Predição intra.** Antes de armazenar um bloco, o HEVC o *adivinha* a partir dos pixels já decodificados à sua esquerda e acima, escolhendo entre 35 modos de predição direcional. Depois armazena apenas a **diferença** entre o palpite e a realidade. Quando o palpite é bom — e em fotos reais ele quase sempre é — essa diferença fica perto de zero, e dados perto de zero comprimem para quase nada.
- **Transformadas e codificação entrópica melhores.** A diferença residual passa por transformadas mais flexíveis, e a etapa final de empacotamento de bits (CABAC) é um codificador aritmético mais afiado que as tabelas de Huffman do JPEG.
- **Filtragem dentro do laço.** O deblocking e uma etapa chamada *sample adaptive offset* suavizam as fronteiras entre blocos, e é por isso que imagens HEVC se degradam com mais elegância do que a conhecida papa quadriculada do JPEG.

Junte tudo isso e você chega ao resultado de manchete: **mais ou menos a mesma qualidade visual com cerca de metade do tamanho**. É toda a razão pela qual cabem no seu iPhone o dobro de fotos do que caberia de outro jeito.

Para uma visão prática do que acontece quando você tira uma foto desse formato, veja [se converter HEIC para JPG reduz a qualidade](/pt/blog/converter-heic-para-jpg-perde-qualidade).

## O que o contêiner HEIF acrescenta por cima

Mesmo com um ótimo códec, ainda é preciso ter onde colocar o resultado — e é o desenho do HEIF que torna possíveis recursos do iPhone como as Live Photos.

O HEIF é construído sobre o mesmo ISO Base Media File Format que sustenta o MP4. Isso significa que ele pensa em termos de **itens e trilhas**, e não de "uma imagem, um arquivo". Um único arquivo HEIF pode conter:

- **Várias imagens.** Sequências em rajada, bracketing de exposição e coleções de imagens ficam todas num arquivo só.
- **Uma imagem mais uma trilha de vídeo.** É exatamente isso que uma Live Photo é — um quadro parado ao lado de um curto clipe em movimento.
- **Camadas auxiliares.** Mapas de profundidade e canais alfa (transparência) viajam como itens separados; é assim que o modo Retrato guarda os dados do desfoque de fundo.
- **Edições não destrutivas.** Cortes, rotações e sobreposições podem ser registrados como *instruções* aplicadas à imagem original, em vez de ficarem gravados nela.
- **Miniaturas e ladrilhamento.** Imagens grandes podem ser guardadas como uma grade de ladrilhos, de modo que o visualizador decodifica apenas a região que você está olhando.
- **Cor mais rica.** O HEIF suporta profundidade de 10 bits ou mais, contra os 8 bits por canal do JPEG — degradês visivelmente mais suaves em céus e sombras, e muito mais margem na edição.

Nada disso cabe num arquivo JPEG. O JPEG guarda uma imagem, 8 bits por canal, sem transparência, e a história acaba aí.

## Então por que não abre em todo lugar?

Duas razões, e a segunda é menos óbvia que a primeira.

**É mais novo.** O JPEG teve três décadas para se enraizar em cada câmera, impressora, navegador, formulário de upload e software corporativo esquecido do planeta. O HEIF mal tem dez anos.

**O HEVC é onerado por patentes.** Diferentemente do JPEG, o HEVC é coberto por patentes distribuídas em vários consórcios de licenciamento, e decodificadores geralmente exigem pagamento de royalties. Isso deixou alguns fabricantes de plataformas e navegadores relutantes em incluir suporte nativo, e é boa parte da razão pela qual a indústria vem se reunindo em torno de alternativas livres de royalties como AV1 e AVIF para a web. Não é que o HEVC seja tecnicamente insuficiente — é que o licenciamento tornou lenta a adoção universal.

A conclusão prática: sua foto está ótima. O arquivo está bem formado e a imagem dentro dele tem alta qualidade. O aparelho que tenta abri-la é que pode simplesmente não ter um decodificador HEVC licenciado disponível.

## O que isso significa para você na prática

Conhecer as entranhas leva a algumas regras concretas.

**Continue fotografando em Alta Eficiência.** A economia de espaço é real e a qualidade é genuinamente igual ou melhor que a do JPG. Deixe *Ajustes → Câmera → Formatos* em **Alta Eficiência** e converta cópias apenas quando precisar enviá-las para algum lugar.

**Converta na fronteira, não em massa.** Como HEVC e JPEG são ambos com perdas, cada recodificação é uma nova geração de compressão. Converta as fotos específicas que você vai compartilhar, guarde seus originais HEIC e não fique levando e trazendo o mesmo arquivo.

**Escolha o formato de destino pelo destino.** [HEIC para JPG](/heic-to-jpg) é a escolha universal que abre em qualquer lugar. [HEIC para PNG](/heic-to-png) é sem perdas, então a etapa de conversão não acrescenta nenhuma compressão nova — ideal quando você ainda vai editar. [HEIC para WebP](/heic-to-webp) toma emprestadas muitas das mesmas ideias modernas de compressão do HEVC e é a opção mais leve quando a foto vai para um site.

**Espere perder os extras.** Uma Live Photo convertida para JPG vira um quadro parado. Mapas de profundidade, canais alfa e instruções de edição também não sobrevivem à viagem, porque o formato de destino não tem onde colocá-los. Se isso importa, guarde o original HEIC ao lado da cópia convertida.

> **Observação:** a conversão neste site acontece **inteiramente dentro do seu navegador** — suas fotos são decodificadas e recodificadas no seu próprio aparelho, e nada é enviado a um servidor. Isso vale mesmo sendo a decodificação HEVC a parte mais pesada do trabalho.

## Resumindo

HEIF é um contêiner moderno construído com a lógica dos formatos de vídeo: várias imagens, dados de profundidade, transparência e edições, tudo num arquivo. HEVC é um códec de vídeo cuja compressão preditiva com blocos de tamanho variável acaba funcionando muito bem em fotos paradas, cortando o tamanho dos arquivos praticamente pela metade com qualidade igual. HEIC é o que sai quando a Apple junta os dois.

É um formato genuinamente melhor que o JPEG em quase todos os eixos técnicos. Sua única fraqueza real é que o resto do mundo ainda não terminou de acompanhar — o que leva cerca de cinco segundos para contornar. Solte seus arquivos no [conversor HEIC gratuito](/pt/) e escolha o formato que o destino entende. Se quiser primeiro o contexto sobre o formato em si, comece por [o que é um arquivo HEIC](/pt/blog/o-que-e-um-arquivo-heic).
