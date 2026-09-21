/*
 * iPhone Live Photo splitter.
 *
 * A Live Photo exported in "original" form is a matching HEIC/HEIF still and
 * MOV clip. This tool does not transcode either component: it keeps both files
 * byte-for-byte intact and makes the two parts easy to download separately.
 */
(function () {
  'use strict';

  const COPY = {
    en: {
      title: '📸 Live Photo Splitter',
      intro: 'Choose the matching .HEIC and .MOV files from an iPhone Live Photo. They stay on your device and are separated without conversion.',
      drop: 'Drag & drop Live Photo files here', browse: 'or click to browse',
      zip: '⬇ Download matched pairs (.zip)', clear: 'Clear',
      ready: 'Ready — original HEIC + MOV', missingImage: 'Missing .HEIC image', missingMov: 'Missing .MOV video',
      image: '⬇ Image (.HEIC)', video: '⬇ Video (.MOV)', packaging: 'Packaging…', zipError: 'Could not create the ZIP: ',
    },
    ja: {
      title: '📸 Live Photo 分離', intro: 'iPhone Live Photo の対応する .HEIC と .MOV を選択します。変換せず、端末内だけで分離します。',
      drop: 'Live Photo ファイルをここにドラッグ＆ドロップ', browse: 'またはクリックして選択', zip: '⬇ 対応ペアを ZIP でダウンロード', clear: 'クリア',
      ready: '準備完了 — 元の HEIC + MOV', missingImage: '.HEIC 画像がありません', missingMov: '.MOV 動画がありません', image: '⬇ 画像 (.HEIC)', video: '⬇ 動画 (.MOV)', packaging: '作成中…', zipError: 'ZIP を作成できませんでした: ',
    },
    'zh-cn': {
      title: '📸 Live Photo 拆分', intro: '选择 iPhone Live Photo 对应的 .HEIC 和 .MOV 文件。文件不会离开设备，并会在不转换的情况下拆分。',
      drop: '将 Live Photo 文件拖放到此处', browse: '或点击选择文件', zip: '⬇ 下载匹配文件对（.zip）', clear: '清除',
      ready: '已就绪 — 原始 HEIC + MOV', missingImage: '缺少 .HEIC 图片', missingMov: '缺少 .MOV 视频', image: '⬇ 图片 (.HEIC)', video: '⬇ 视频 (.MOV)', packaging: '正在打包…', zipError: '无法创建 ZIP：',
    },
    'zh-tw': {
      title: '📸 Live Photo 拆分', intro: '選擇 iPhone Live Photo 對應的 .HEIC 與 .MOV 檔案。檔案不會離開裝置，並會在不轉檔的情況下拆分。',
      drop: '將 Live Photo 檔案拖放到此處', browse: '或點擊選擇檔案', zip: '⬇ 下載配對檔案（.zip）', clear: '清除',
      ready: '已就緒 — 原始 HEIC + MOV', missingImage: '缺少 .HEIC 圖片', missingMov: '缺少 .MOV 影片', image: '⬇ 圖片 (.HEIC)', video: '⬇ 影片 (.MOV)', packaging: '正在打包…', zipError: '無法建立 ZIP：',
    },
    ko: {
      title: '📸 Live Photo 분리', intro: 'iPhone Live Photo에 대응하는 .HEIC와 .MOV 파일을 선택하세요. 변환 없이 기기 안에서 분리합니다.',
      drop: 'Live Photo 파일을 여기로 끌어다 놓으세요', browse: '또는 클릭하여 선택', zip: '⬇ 연결된 쌍 ZIP 다운로드', clear: '지우기',
      ready: '준비됨 — 원본 HEIC + MOV', missingImage: '.HEIC 이미지가 없습니다', missingMov: '.MOV 비디오가 없습니다', image: '⬇ 이미지 (.HEIC)', video: '⬇ 비디오 (.MOV)', packaging: '압축 중…', zipError: 'ZIP을 만들 수 없습니다: ',
    },
    de: {
      title: '📸 Live-Photo-Trenner', intro: 'Wählen Sie die zusammengehörenden .HEIC- und .MOV-Dateien eines iPhone Live Photos. Sie bleiben auf Ihrem Gerät und werden ohne Umwandlung getrennt.',
      drop: 'Live-Photo-Dateien hierher ziehen', browse: 'oder klicken zum Auswählen', zip: '⬇ Passende Paare als ZIP herunterladen', clear: 'Leeren',
      ready: 'Bereit — originales HEIC + MOV', missingImage: '.HEIC-Bild fehlt', missingMov: '.MOV-Video fehlt', image: '⬇ Bild (.HEIC)', video: '⬇ Video (.MOV)', packaging: 'Wird gepackt…', zipError: 'ZIP konnte nicht erstellt werden: ',
    },
    fr: {
      title: '📸 Séparateur de Live Photo', intro: 'Choisissez les fichiers .HEIC et .MOV correspondants d’une Live Photo iPhone. Ils restent sur votre appareil et sont séparés sans conversion.',
      drop: 'Glissez les fichiers Live Photo ici', browse: 'ou cliquez pour choisir', zip: '⬇ Télécharger les paires correspondantes (.zip)', clear: 'Effacer',
      ready: 'Prêt — HEIC + MOV d’origine', missingImage: 'Image .HEIC manquante', missingMov: 'Vidéo .MOV manquante', image: '⬇ Image (.HEIC)', video: '⬇ Vidéo (.MOV)', packaging: 'Création…', zipError: 'Impossible de créer le ZIP : ',
    },
    es: {
      title: '📸 Separador de Live Photo', intro: 'Elige los archivos .HEIC y .MOV correspondientes de una Live Photo del iPhone. Se quedan en tu dispositivo y se separan sin convertirlos.',
      drop: 'Arrastra aquí los archivos de Live Photo', browse: 'o haz clic para elegir', zip: '⬇ Descargar pares coincidentes (.zip)', clear: 'Limpiar',
      ready: 'Listo — HEIC + MOV originales', missingImage: 'Falta la imagen .HEIC', missingMov: 'Falta el vídeo .MOV', image: '⬇ Imagen (.HEIC)', video: '⬇ Vídeo (.MOV)', packaging: 'Empaquetando…', zipError: 'No se pudo crear el ZIP: ',
    },
    pt: {
      title: '📸 Separador de Live Photo', intro: 'Escolha os arquivos .HEIC e .MOV correspondentes de uma Live Photo do iPhone. Eles ficam no seu dispositivo e são separados sem conversão.',
      drop: 'Arraste os arquivos da Live Photo aqui', browse: 'ou clique para escolher', zip: '⬇ Baixar pares correspondentes (.zip)', clear: 'Limpar',
      ready: 'Pronto — HEIC + MOV originais', missingImage: 'Falta a imagem .HEIC', missingMov: 'Falta o vídeo .MOV', image: '⬇ Imagem (.HEIC)', video: '⬇ Vídeo (.MOV)', packaging: 'Preparando…', zipError: 'Não foi possível criar o ZIP: ',
    },
  };

  const language = (document.documentElement.lang || 'en').toLowerCase();
  const T = COPY[language] || COPY[language.split('-')[0]] || COPY.en;
  const componentFiles = [];

  function extension(file) {
    const match = file.name.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  function stem(file) {
    return file.name.replace(/\.[^.]+$/, '').toLocaleLowerCase();
  }

  function isComponent(file) {
    return ['heic', 'heif', 'mov'].includes(extension(file));
  }

  function pairs() {
    const grouped = new Map();
    for (const file of componentFiles) {
      if (!isComponent(file)) continue;
      const key = stem(file);
      const pair = grouped.get(key) || { name: file.name.replace(/\.[^.]+$/, ''), image: null, video: null };
      if (extension(file) === 'mov' && !pair.video) pair.video = file;
      if (['heic', 'heif'].includes(extension(file)) && !pair.image) pair.image = file;
      grouped.set(key, pair);
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function download(file) {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function button(text, onClick) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = text;
    element.addEventListener('click', onClick);
    return element;
  }

  function install() {
    const heicSection = document.getElementById('heic');
    if (!heicSection || document.getElementById('livePhoto')) return;

    const section = document.createElement('section');
    section.id = 'livePhoto';
    section.innerHTML = `
      <h2 class="section-title">${T.title}</h2>
      <p class="section-intro">${T.intro}</p>
      <div class="card">
        <div class="drop-zone" data-live-drop>
          <p><strong>${T.drop}</strong></p>
          <p>${T.browse}</p>
          <input type="file" accept=".heic,.heif,.mov,image/heic,image/heif,video/quicktime" multiple hidden>
        </div>
        <div class="controls">
          <button type="button" data-live-zip disabled>${T.zip}</button>
          <button type="button" data-live-clear style="background:#6b7280;">${T.clear}</button>
        </div>
        <ul data-live-list></ul>
      </div>`;

    const divider = heicSection.nextElementSibling;
    if (divider && divider.matches('.section-divider')) {
      const liveDivider = document.createElement('hr');
      liveDivider.className = 'section-divider';
      divider.before(liveDivider, section);
    } else {
      heicSection.after(section);
    }

    const dropZone = section.querySelector('[data-live-drop]');
    const input = section.querySelector('input[type="file"]');
    const list = section.querySelector('[data-live-list]');
    const zipButton = section.querySelector('[data-live-zip]');
    const clearButton = section.querySelector('[data-live-clear]');

    function render() {
      const foundPairs = pairs();
      list.innerHTML = '';
      for (const pair of foundPairs) {
        const item = document.createElement('li');
        const left = document.createElement('span');
        left.className = 'file-name';
        left.textContent = pair.name;
        const right = document.createElement('span');
        if (pair.image && pair.video) {
          right.append(button(T.image, () => download(pair.image)), button(T.video, () => download(pair.video)));
          const ready = document.createElement('span');
          ready.className = 'status ok';
          ready.textContent = T.ready;
          right.append(' ', ready);
        } else {
          const missing = document.createElement('span');
          missing.className = 'status warn';
          missing.textContent = pair.image ? T.missingMov : T.missingImage;
          right.append(missing);
        }
        item.append(left, right);
        list.append(item);
      }
      zipButton.disabled = !foundPairs.some(pair => pair.image && pair.video);
    }

    function add(files) {
      for (const file of files) {
        if (isComponent(file)) componentFiles.push(file);
      }
      render();
    }

    dropZone.addEventListener('click', () => input.click());
    dropZone.addEventListener('dragover', event => { event.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', event => {
      event.preventDefault();
      dropZone.classList.remove('dragover');
      add(event.dataTransfer.files);
    });
    input.addEventListener('change', event => { add(event.target.files); input.value = ''; });
    clearButton.addEventListener('click', () => { componentFiles.length = 0; render(); });

    zipButton.addEventListener('click', async () => {
      if (!window.JSZip) {
        alert(T.zipError + 'ZIP library is unavailable.');
        return;
      }
      zipButton.disabled = true;
      const originalText = zipButton.textContent;
      zipButton.textContent = T.packaging;
      try {
        const zip = new window.JSZip();
        for (const pair of pairs()) {
          if (!pair.image || !pair.video) continue;
          zip.file(pair.image.name, pair.image);
          zip.file(pair.video.name, pair.video);
        }
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        download(new File([blob], 'live-photo-components.zip', { type: 'application/zip' }));
      } catch (error) {
        alert(T.zipError + (error && error.message ? error.message : 'unknown error'));
      } finally {
        zipButton.textContent = originalText;
        render();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
}());
