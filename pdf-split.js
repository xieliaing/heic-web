/*
 * PDF page splitting.
 *
 * Two jobs, both done entirely inside the page:
 *   1. split a multi-page PDF into one PDF per page — pdf-lib copies the page
 *      objects across, so text, vectors and fonts stay intact;
 *   2. split a multi-page PDF into one JPEG per page — pdf.js rasterises each
 *      page onto a canvas, which the browser then encodes.
 *
 * Both engines are imported from the CDN on first use rather than at page
 * load: the home page already ships the HEIC and video engines, and a visitor
 * who never touches a PDF should not pay for these.
 *
 * Like /live-photo-split.js, this file owns its own markup and injects a
 * <section id="pdf"> into whatever page includes it, so the generated regions
 * of index.html (see tools/build-video-sections.mjs) stay untouched. On the
 * standalone /pdf page it renders into [data-pdf-mount] instead.
 */
(function () {
  'use strict';

  const PDFJS_VERSION = '4.10.38';
  const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VERSION + '/build/pdf.min.mjs';
  const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VERSION + '/build/pdf.worker.min.mjs';
  const PDF_LIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm';

  // US Letter at 300 DPI is 2550x3300 = 8.4 MP. The cap leaves room for large
  // drawing sheets while staying under the canvas ceiling mobile Safari
  // enforces, above which toBlob() quietly hands back a blank bitmap.
  const MAX_CANVAS_PIXELS = 24e6;

  const COPY = {
    en: {
      nav: 'PDF',
      title: '📄 PDF Page Splitting',
      intro: 'Split a multi-page PDF into separate single-page PDFs, or turn every page into a JPEG picture. The file never leaves your device.',
      drop: 'Drag & drop PDF files here', browse: 'or click to browse',
      outputLegend: 'Split into', optPdf: 'Single-page PDFs', optPdfNote: 'one PDF per page',
      optJpeg: 'JPEG pictures', optJpegNote: 'one image per page',
      quality: 'JPEG quality', resolution: 'Resolution',
      resScreen: '96 DPI (screen)', resStandard: '150 DPI (balanced)', resHigh: '300 DPI (print)',
      split: 'Split', splitting: 'Splitting…', stop: 'Stop', stopping: 'Stopping…', clear: 'Clear',
      downloadAll: '⬇ Download All ({n} files, .zip)', packaging: 'Packaging…',
      pending: 'Pending', reading: 'Reading…', working: 'Page {page} of {total}…',
      done: '✓ {n} pages', stopped: 'Stopped',
      showPages: 'Individual pages ({n})', downloadZip: '⬇ All pages (.zip)', page: 'Page {n}',
      notPdf: 'Not a PDF file',
      encrypted: 'This PDF is password-protected. Open it in a PDF reader, save an unlocked copy, and split that copy.',
      onePage: 'Only one page — the output is a copy of the original.',
      engineLoading: 'Loading the PDF engine…',
      engineFailed: 'Could not load the PDF engine: {message}',
      failed: 'Could not split this PDF: {message}',
      emptyPdf: 'This PDF has no pages',
      zipMissing: 'ZIP library failed to load. Please reload the page and try again.',
      zipFailed: 'Failed to create ZIP: {message}', zipName: 'pdf-pages',
      note: 'HeicQuick extracts and renders the pages on this device — no upload, no account, no page limit.',
    },
    ja: {
      nav: 'PDF',
      title: '📄 PDF ページ分割',
      intro: '複数ページの PDF を 1 ページずつの PDF に分割、または各ページを JPEG 画像に変換します。ファイルは端末から出ません。',
      drop: 'PDF ファイルをここにドラッグ＆ドロップ', browse: 'またはクリックして選択',
      outputLegend: '分割形式', optPdf: '1 ページずつの PDF', optPdfNote: '1 ページ 1 ファイル',
      optJpeg: 'JPEG 画像', optJpegNote: '1 ページ 1 画像',
      quality: 'JPEG 画質', resolution: '解像度',
      resScreen: '96 DPI（画面用）', resStandard: '150 DPI（標準）', resHigh: '300 DPI（印刷用）',
      split: '分割', splitting: '分割中…', stop: '停止', stopping: '停止中…', clear: 'クリア',
      downloadAll: '⬇ すべてダウンロード（{n} 件, .zip）', packaging: '作成中…',
      pending: '待機中', reading: '読み込み中…', working: '{total} ページ中 {page} ページ目…',
      done: '✓ {n} ページ', stopped: '停止しました',
      showPages: '個別のページ（{n}）', downloadZip: '⬇ 全ページ（.zip）', page: '{n} ページ',
      notPdf: 'PDF ファイルではありません',
      encrypted: 'この PDF はパスワードで保護されています。PDF リーダーで開いて保護を解除したコピーを保存し、そのコピーを分割してください。',
      onePage: '1 ページのみ — 出力は元ファイルのコピーです。',
      engineLoading: 'PDF エンジンを読み込み中…',
      engineFailed: 'PDF エンジンを読み込めませんでした: {message}',
      failed: 'この PDF を分割できませんでした: {message}',
      emptyPdf: 'この PDF にページがありません',
      zipMissing: 'ZIP ライブラリを読み込めませんでした。ページを再読み込みしてください。',
      zipFailed: 'ZIP を作成できませんでした: {message}', zipName: 'pdf-pages',
      note: 'ページの抽出と描画は HeicQuick がこの端末上で実行します。アップロード、アカウント、ページ数制限はありません。',
    },
    'zh-cn': {
      nav: 'PDF',
      title: '📄 PDF 分页拆分',
      intro: '把多页 PDF 拆分成单页 PDF，或把每一页转换成 JPEG 图片。文件不会离开你的设备。',
      drop: '将 PDF 文件拖放到此处', browse: '或点击选择文件',
      outputLegend: '拆分为', optPdf: '单页 PDF', optPdfNote: '每页一个 PDF',
      optJpeg: 'JPEG 图片', optJpegNote: '每页一张图片',
      quality: 'JPEG 质量', resolution: '分辨率',
      resScreen: '96 DPI（屏幕）', resStandard: '150 DPI（均衡）', resHigh: '300 DPI（打印）',
      split: '拆分', splitting: '正在拆分…', stop: '停止', stopping: '正在停止…', clear: '清除',
      downloadAll: '⬇ 全部下载（{n} 个文件, .zip）', packaging: '正在打包…',
      pending: '等待中', reading: '正在读取…', working: '第 {page} 页，共 {total} 页…',
      done: '✓ {n} 页', stopped: '已停止',
      showPages: '逐页下载（{n}）', downloadZip: '⬇ 所有页面（.zip）', page: '第 {n} 页',
      notPdf: '不是 PDF 文件',
      encrypted: '该 PDF 受密码保护。请用 PDF 阅读器打开并另存为未加密的副本，然后拆分该副本。',
      onePage: '只有一页 — 输出是原文件的副本。',
      engineLoading: '正在加载 PDF 引擎…',
      engineFailed: '无法加载 PDF 引擎：{message}',
      failed: '无法拆分此 PDF：{message}',
      emptyPdf: '该 PDF 没有页面',
      zipMissing: 'ZIP 库加载失败，请重新加载页面后再试。',
      zipFailed: '无法创建 ZIP：{message}', zipName: 'pdf-pages',
      note: '页面由 HeicQuick 在本设备上提取和渲染 — 无需上传、无需账号、不限页数。',
    },
    'zh-tw': {
      nav: 'PDF',
      title: '📄 PDF 分頁拆分',
      intro: '把多頁 PDF 拆分成單頁 PDF，或把每一頁轉換成 JPEG 圖片。檔案不會離開你的裝置。',
      drop: '將 PDF 檔案拖放到此處', browse: '或點擊選擇檔案',
      outputLegend: '拆分為', optPdf: '單頁 PDF', optPdfNote: '每頁一個 PDF',
      optJpeg: 'JPEG 圖片', optJpegNote: '每頁一張圖片',
      quality: 'JPEG 品質', resolution: '解析度',
      resScreen: '96 DPI（螢幕）', resStandard: '150 DPI（均衡）', resHigh: '300 DPI（列印）',
      split: '拆分', splitting: '正在拆分…', stop: '停止', stopping: '正在停止…', clear: '清除',
      downloadAll: '⬇ 全部下載（{n} 個檔案, .zip）', packaging: '正在打包…',
      pending: '等待中', reading: '正在讀取…', working: '第 {page} 頁，共 {total} 頁…',
      done: '✓ {n} 頁', stopped: '已停止',
      showPages: '逐頁下載（{n}）', downloadZip: '⬇ 所有頁面（.zip）', page: '第 {n} 頁',
      notPdf: '不是 PDF 檔案',
      encrypted: '此 PDF 受密碼保護。請用 PDF 閱讀器開啟並另存為未加密的副本，再拆分該副本。',
      onePage: '只有一頁 — 輸出是原檔案的副本。',
      engineLoading: '正在載入 PDF 引擎…',
      engineFailed: '無法載入 PDF 引擎：{message}',
      failed: '無法拆分此 PDF：{message}',
      emptyPdf: '此 PDF 沒有頁面',
      zipMissing: 'ZIP 程式庫載入失敗，請重新載入頁面後再試。',
      zipFailed: '無法建立 ZIP：{message}', zipName: 'pdf-pages',
      note: '頁面由 HeicQuick 在本裝置上擷取與繪製 — 無需上傳、無需帳號、不限頁數。',
    },
    ko: {
      nav: 'PDF',
      title: '📄 PDF 페이지 분할',
      intro: '여러 페이지로 된 PDF를 한 장씩 PDF로 나누거나, 각 페이지를 JPEG 이미지로 변환합니다. 파일은 기기를 떠나지 않습니다.',
      drop: 'PDF 파일을 여기로 끌어다 놓으세요', browse: '또는 클릭하여 선택',
      outputLegend: '분할 형식', optPdf: '한 장씩 PDF', optPdfNote: '페이지당 PDF 하나',
      optJpeg: 'JPEG 이미지', optJpegNote: '페이지당 이미지 하나',
      quality: 'JPEG 품질', resolution: '해상도',
      resScreen: '96 DPI(화면)', resStandard: '150 DPI(균형)', resHigh: '300 DPI(인쇄)',
      split: '분할', splitting: '분할 중…', stop: '중지', stopping: '중지 중…', clear: '지우기',
      downloadAll: '⬇ 전체 다운로드({n}개 파일, .zip)', packaging: '압축 중…',
      pending: '대기 중', reading: '읽는 중…', working: '{total}페이지 중 {page}페이지…',
      done: '✓ {n}페이지', stopped: '중지됨',
      showPages: '페이지별 다운로드({n})', downloadZip: '⬇ 전체 페이지(.zip)', page: '{n}페이지',
      notPdf: 'PDF 파일이 아닙니다',
      encrypted: '이 PDF는 비밀번호로 보호되어 있습니다. PDF 리더에서 열어 보호가 해제된 사본을 저장한 뒤 그 사본을 분할하세요.',
      onePage: '한 페이지뿐입니다 — 결과는 원본의 사본입니다.',
      engineLoading: 'PDF 엔진을 불러오는 중…',
      engineFailed: 'PDF 엔진을 불러올 수 없습니다: {message}',
      failed: '이 PDF를 분할할 수 없습니다: {message}',
      emptyPdf: '이 PDF에는 페이지가 없습니다',
      zipMissing: 'ZIP 라이브러리를 불러오지 못했습니다. 페이지를 새로 고친 뒤 다시 시도하세요.',
      zipFailed: 'ZIP을 만들 수 없습니다: {message}', zipName: 'pdf-pages',
      note: '페이지 추출과 렌더링은 HeicQuick이 이 기기에서 수행합니다. 업로드, 계정, 페이지 수 제한이 없습니다.',
    },
    de: {
      nav: 'PDF',
      title: '📄 PDF-Seiten aufteilen',
      intro: 'Teilen Sie ein mehrseitiges PDF in einzelne PDF-Seiten auf oder wandeln Sie jede Seite in ein JPEG-Bild um. Die Datei verlässt Ihr Gerät nicht.',
      drop: 'PDF-Dateien hierher ziehen', browse: 'oder klicken zum Auswählen',
      outputLegend: 'Aufteilen in', optPdf: 'Einzelseiten-PDFs', optPdfNote: 'ein PDF pro Seite',
      optJpeg: 'JPEG-Bilder', optJpegNote: 'ein Bild pro Seite',
      quality: 'JPEG-Qualität', resolution: 'Auflösung',
      resScreen: '96 dpi (Bildschirm)', resStandard: '150 dpi (ausgewogen)', resHigh: '300 dpi (Druck)',
      split: 'Aufteilen', splitting: 'Wird aufgeteilt…', stop: 'Stopp', stopping: 'Wird gestoppt…', clear: 'Leeren',
      downloadAll: '⬇ Alle herunterladen ({n} Dateien, .zip)', packaging: 'Wird gepackt…',
      pending: 'Wartet', reading: 'Wird gelesen…', working: 'Seite {page} von {total}…',
      done: '✓ {n} Seiten', stopped: 'Gestoppt',
      showPages: 'Einzelne Seiten ({n})', downloadZip: '⬇ Alle Seiten (.zip)', page: 'Seite {n}',
      notPdf: 'Keine PDF-Datei',
      encrypted: 'Dieses PDF ist passwortgeschützt. Öffnen Sie es in einem PDF-Reader, speichern Sie eine entsperrte Kopie und teilen Sie diese auf.',
      onePage: 'Nur eine Seite — die Ausgabe ist eine Kopie des Originals.',
      engineLoading: 'PDF-Engine wird geladen…',
      engineFailed: 'PDF-Engine konnte nicht geladen werden: {message}',
      failed: 'Dieses PDF konnte nicht aufgeteilt werden: {message}',
      emptyPdf: 'Dieses PDF hat keine Seiten',
      zipMissing: 'Die ZIP-Bibliothek wurde nicht geladen. Bitte laden Sie die Seite neu.',
      zipFailed: 'ZIP konnte nicht erstellt werden: {message}', zipName: 'pdf-seiten',
      note: 'HeicQuick extrahiert und rendert die Seiten auf diesem Gerät — kein Upload, kein Konto, kein Seitenlimit.',
    },
    fr: {
      nav: 'PDF',
      title: '📄 Découpage de PDF',
      intro: 'Découpez un PDF de plusieurs pages en PDF d’une seule page, ou transformez chaque page en image JPEG. Le fichier ne quitte pas votre appareil.',
      drop: 'Glissez les fichiers PDF ici', browse: 'ou cliquez pour choisir',
      outputLegend: 'Découper en', optPdf: 'PDF d’une page', optPdfNote: 'un PDF par page',
      optJpeg: 'Images JPEG', optJpegNote: 'une image par page',
      quality: 'Qualité JPEG', resolution: 'Résolution',
      resScreen: '96 ppp (écran)', resStandard: '150 ppp (équilibré)', resHigh: '300 ppp (impression)',
      split: 'Découper', splitting: 'Découpage…', stop: 'Arrêter', stopping: 'Arrêt…', clear: 'Effacer',
      downloadAll: '⬇ Tout télécharger ({n} fichiers, .zip)', packaging: 'Création…',
      pending: 'En attente', reading: 'Lecture…', working: 'Page {page} sur {total}…',
      done: '✓ {n} pages', stopped: 'Arrêté',
      showPages: 'Pages individuelles ({n})', downloadZip: '⬇ Toutes les pages (.zip)', page: 'Page {n}',
      notPdf: 'Ce n’est pas un fichier PDF',
      encrypted: 'Ce PDF est protégé par mot de passe. Ouvrez-le dans un lecteur PDF, enregistrez une copie déverrouillée, puis découpez cette copie.',
      onePage: 'Une seule page — le résultat est une copie de l’original.',
      engineLoading: 'Chargement du moteur PDF…',
      engineFailed: 'Impossible de charger le moteur PDF : {message}',
      failed: 'Impossible de découper ce PDF : {message}',
      emptyPdf: 'Ce PDF ne contient aucune page',
      zipMissing: 'La bibliothèque ZIP n’a pas pu être chargée. Rechargez la page.',
      zipFailed: 'Impossible de créer le ZIP : {message}', zipName: 'pages-pdf',
      note: 'HeicQuick extrait et rend les pages sur cet appareil — aucun envoi, aucun compte, aucune limite de pages.',
    },
    es: {
      nav: 'PDF',
      title: '📄 División de PDF',
      intro: 'Divide un PDF de varias páginas en PDF de una sola página, o convierte cada página en una imagen JPEG. El archivo no sale de tu dispositivo.',
      drop: 'Arrastra aquí los archivos PDF', browse: 'o haz clic para elegir',
      outputLegend: 'Dividir en', optPdf: 'PDF de una página', optPdfNote: 'un PDF por página',
      optJpeg: 'Imágenes JPEG', optJpegNote: 'una imagen por página',
      quality: 'Calidad JPEG', resolution: 'Resolución',
      resScreen: '96 ppp (pantalla)', resStandard: '150 ppp (equilibrado)', resHigh: '300 ppp (impresión)',
      split: 'Dividir', splitting: 'Dividiendo…', stop: 'Detener', stopping: 'Deteniendo…', clear: 'Limpiar',
      downloadAll: '⬇ Descargar todo ({n} archivos, .zip)', packaging: 'Empaquetando…',
      pending: 'En espera', reading: 'Leyendo…', working: 'Página {page} de {total}…',
      done: '✓ {n} páginas', stopped: 'Detenido',
      showPages: 'Páginas individuales ({n})', downloadZip: '⬇ Todas las páginas (.zip)', page: 'Página {n}',
      notPdf: 'No es un archivo PDF',
      encrypted: 'Este PDF está protegido con contraseña. Ábrelo en un lector de PDF, guarda una copia desbloqueada y divide esa copia.',
      onePage: 'Solo una página — el resultado es una copia del original.',
      engineLoading: 'Cargando el motor PDF…',
      engineFailed: 'No se pudo cargar el motor PDF: {message}',
      failed: 'No se pudo dividir este PDF: {message}',
      emptyPdf: 'Este PDF no tiene páginas',
      zipMissing: 'No se pudo cargar la biblioteca ZIP. Recarga la página e inténtalo de nuevo.',
      zipFailed: 'No se pudo crear el ZIP: {message}', zipName: 'paginas-pdf',
      note: 'HeicQuick extrae y renderiza las páginas en este dispositivo: sin subidas, sin cuenta y sin límite de páginas.',
    },
    pt: {
      nav: 'PDF',
      title: '📄 Divisão de PDF',
      intro: 'Divida um PDF de várias páginas em PDFs de uma página, ou transforme cada página em uma imagem JPEG. O arquivo não sai do seu dispositivo.',
      drop: 'Arraste os arquivos PDF aqui', browse: 'ou clique para escolher',
      outputLegend: 'Dividir em', optPdf: 'PDFs de uma página', optPdfNote: 'um PDF por página',
      optJpeg: 'Imagens JPEG', optJpegNote: 'uma imagem por página',
      quality: 'Qualidade JPEG', resolution: 'Resolução',
      resScreen: '96 ppp (tela)', resStandard: '150 ppp (equilibrado)', resHigh: '300 ppp (impressão)',
      split: 'Dividir', splitting: 'Dividindo…', stop: 'Parar', stopping: 'Parando…', clear: 'Limpar',
      downloadAll: '⬇ Baixar tudo ({n} arquivos, .zip)', packaging: 'Preparando…',
      pending: 'Na fila', reading: 'Lendo…', working: 'Página {page} de {total}…',
      done: '✓ {n} páginas', stopped: 'Parado',
      showPages: 'Páginas individuais ({n})', downloadZip: '⬇ Todas as páginas (.zip)', page: 'Página {n}',
      notPdf: 'Não é um arquivo PDF',
      encrypted: 'Este PDF está protegido por senha. Abra-o em um leitor de PDF, salve uma cópia desbloqueada e divida essa cópia.',
      onePage: 'Apenas uma página — o resultado é uma cópia do original.',
      engineLoading: 'Carregando o motor de PDF…',
      engineFailed: 'Não foi possível carregar o motor de PDF: {message}',
      failed: 'Não foi possível dividir este PDF: {message}',
      emptyPdf: 'Este PDF não tem páginas',
      zipMissing: 'A biblioteca ZIP não carregou. Recarregue a página e tente novamente.',
      zipFailed: 'Não foi possível criar o ZIP: {message}', zipName: 'paginas-pdf',
      note: 'As páginas são extraídas e renderizadas pelo HeicQuick neste dispositivo — sem upload, sem conta e sem limite de páginas.',
    },
  };

  const language = (document.documentElement.lang || 'en').toLowerCase();
  const T = COPY[language] || COPY[language.split('-')[0]] || COPY.en;

  function t(key, vars) {
    const raw = T[key] != null ? T[key] : COPY.en[key];
    return String(raw == null ? key : raw)
      .replace(/\{(\w+)\}/g, (match, name) => (vars && name in vars ? vars[name] : match));
  }

  /* ---------- engines ---------- */

  let pdfLibPromise = null;
  let pdfJsPromise = null;

  function loadPdfLib() {
    if (!pdfLibPromise) pdfLibPromise = import(PDF_LIB_URL);
    return pdfLibPromise;
  }

  function loadPdfJs() {
    if (!pdfJsPromise) {
      pdfJsPromise = import(PDFJS_URL).then(lib => {
        // pdf.js renders in a module worker it spawns from this URL. jsDelivr
        // sends both CORS and cross-origin-resource-policy headers, so the
        // cross-origin worker is allowed under the site's COEP policy (see
        // /_headers). If worker creation ever fails, pdf.js falls back to
        // running the same code on the main thread.
        lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        return lib;
      });
    }
    return pdfJsPromise;
  }

  /* ---------- helpers ---------- */

  const stemOf = name => name.replace(/\.[^.]+$/, '') || 'document';
  const pad = (n, width) => String(n).padStart(width, '0');
  const breathe = () => new Promise(resolve => setTimeout(resolve, 0));
  const messageOf = error => (error && error.message ? error.message : String(error || 'unknown error'));

  function isPdfFile(file) {
    return /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
  }

  // The extension lies often enough to be worth checking: a renamed .docx or a
  // HEIC with a .pdf suffix would otherwise fail deep inside an engine with an
  // unreadable message.
  function looksLikePdf(bytes) {
    const head = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(1024, bytes.length)));
    return head.indexOf('%PDF-') >= 0;
  }

  function isPasswordError(error) {
    if (!error) return false;
    if (error.name === 'PasswordException') return true;
    return /encrypt|password/i.test(messageOf(error));
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toJpeg(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('JPEG encoding failed'))),
        'image/jpeg',
        quality
      );
    });
  }

  /* ---------- the two split modes ---------- */

  // One PDF per page. copyPages() carries the page's own resources over, so the
  // result stays vector text rather than a picture of text.
  async function splitToPdfs(bytes, item, onPage, state) {
    const lib = await loadPdfLib();
    const PDFDocument = lib.PDFDocument;
    // Deliberately not ignoreEncryption: a copied page from an encrypted file
    // would come out blank or corrupt, so it is better to say so.
    const source = await PDFDocument.load(bytes);
    const total = source.getPageCount();
    if (!total) throw new Error(t('emptyPdf'));
    const width = Math.max(2, String(total).length);
    const pages = [];

    for (let index = 0; index < total; index += 1) {
      if (state.cancelled) break;
      onPage(index, total);
      const doc = await PDFDocument.create();
      const [page] = await doc.copyPages(source, [index]);
      doc.addPage(page);
      const data = await doc.save();
      pages.push({
        name: item.stem + '-page-' + pad(index + 1, width) + '.pdf',
        blob: new Blob([data], { type: 'application/pdf' }),
      });
      await breathe();
    }
    return { pages, total };
  }

  // One JPEG per page, rasterised at the chosen DPI.
  async function splitToJpegs(bytes, item, onPage, state, options) {
    const lib = await loadPdfJs();
    const doc = await lib.getDocument({ data: bytes, isEvalSupported: false }).promise;
    const total = doc.numPages;
    const width = Math.max(2, String(total).length);
    const pages = [];

    try {
      if (!total) throw new Error(t('emptyPdf'));
      for (let number = 1; number <= total; number += 1) {
        if (state.cancelled) break;
        onPage(number - 1, total);
        const page = await doc.getPage(number);
        const unscaled = page.getViewport({ scale: 1 });
        let scale = options.dpi / 72;
        const pixels = unscaled.width * scale * unscaled.height * scale;
        if (pixels > MAX_CANVAS_PIXELS) scale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext('2d', { alpha: false });
        // JPEG has no transparency, and PDF pages are transparent where
        // nothing is drawn, so paint the sheet white first.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        // intent: 'print' is not cosmetic. With the default 'display' intent
        // pdf.js advances the render with requestAnimationFrame, which a
        // background tab never fires — a long document would appear to freeze
        // the moment the visitor switched tabs. The print path uses timers
        // instead, and rasterising a page to a file is the print case anyway.
        await page.render({ canvasContext: context, viewport, intent: 'print' }).promise;

        pages.push({
          name: item.stem + '-page-' + pad(number, width) + '.jpg',
          blob: await toJpeg(canvas, options.quality),
        });

        page.cleanup();
        // Zeroing the canvas releases the bitmap now instead of at the next GC,
        // which matters when a long document is rendered at 300 DPI.
        canvas.width = 0;
        canvas.height = 0;
        await breathe();
      }
    } finally {
      try { await doc.destroy(); } catch (ignored) { /* already gone */ }
    }
    return { pages, total };
  }

  /* ---------- UI ---------- */

  function sectionMarkup() {
    return `
      <h2 class="section-title">${T.title}</h2>
      <p class="section-intro">${T.intro}</p>
      <div class="card">
        <div class="drop-zone" data-pdf-drop>
          <p><strong>${T.drop}</strong></p>
          <p>${T.browse}</p>
          <input type="file" accept=".pdf,application/pdf" multiple hidden>
        </div>

        <div class="controls">
          <fieldset class="format-options" data-pdf-modes>
            <legend>${T.outputLegend}</legend>
            <label class="format-option selected">
              <input type="radio" name="pdfSplitMode" value="pdf" checked>
              ${T.optPdf} <small>${T.optPdfNote}</small>
            </label>
            <label class="format-option">
              <input type="radio" name="pdfSplitMode" value="jpeg">
              ${T.optJpeg} <small>${T.optJpegNote}</small>
            </label>
          </fieldset>

          <label data-pdf-quality-label hidden>${T.quality}: <span data-pdf-quality-value>85</span>
            <input type="range" data-pdf-quality min="1" max="100" value="85">
          </label>

          <label data-pdf-dpi-label hidden>${T.resolution}:
            <select data-pdf-dpi>
              <option value="96">${T.resScreen}</option>
              <option value="150" selected>${T.resStandard}</option>
              <option value="300">${T.resHigh}</option>
            </select>
          </label>

          <button type="button" data-pdf-split disabled>${T.split}</button>
          <button type="button" data-pdf-stop style="background:var(--error);" hidden>${T.stop}</button>
          <button type="button" data-pdf-clear style="background:#6b7280;">${T.clear}</button>
          <button type="button" data-pdf-zip style="background:var(--success);" hidden></button>
        </div>

        <ul class="video-list" data-pdf-list></ul>
        <p class="engine-note" data-pdf-note>${T.note}</p>
      </div>`;
  }

  function install() {
    if (document.getElementById('pdf')) return;

    const section = document.createElement('section');
    section.id = 'pdf';
    section.innerHTML = sectionMarkup();

    const mount = document.querySelector('[data-pdf-mount]');
    if (mount) {
      mount.replaceWith(section);
    } else {
      // Home pages: sit after the video section, keeping the divider rhythm the
      // generated sections establish.
      const anchor = document.getElementById('video')
        || document.getElementById('livePhoto')
        || document.getElementById('heic');
      if (!anchor) return;
      const divider = anchor.nextElementSibling;
      if (divider && divider.matches('.section-divider')) {
        const own = document.createElement('hr');
        own.className = 'section-divider';
        divider.before(own, section);
      } else {
        anchor.after(section);
      }
      addNavLinks();
    }

    wire(section);
  }

  // The home page nav and the section jump list are both rewritten by
  // tools/build-video-sections.mjs, so the PDF entries are added here at
  // runtime rather than checked into markup the generator would drop.
  function addNavLinks() {
    const nav = document.querySelector('.header-nav');
    if (nav && !nav.querySelector('a[href="#pdf"]')) {
      const link = document.createElement('a');
      link.className = 'nav-link';
      link.href = '#pdf';
      link.textContent = T.nav;
      const after = nav.querySelector('a[href="#video"]') || nav.querySelector('a[href="#heic"]');
      if (after) after.after(link);
      else nav.prepend(link);
    }

    const jump = document.querySelector('.section-jump');
    if (jump && !jump.querySelector('a[href="#pdf"]')) {
      const link = document.createElement('a');
      link.href = '#pdf';
      link.textContent = T.title;
      jump.append(link);
    }
  }

  function wire(section) {
    const dropZone = section.querySelector('[data-pdf-drop]');
    const input = section.querySelector('input[type="file"]');
    const list = section.querySelector('[data-pdf-list]');
    const modes = section.querySelector('[data-pdf-modes]');
    const qualityLabel = section.querySelector('[data-pdf-quality-label]');
    const qualityRange = section.querySelector('[data-pdf-quality]');
    const qualityValue = section.querySelector('[data-pdf-quality-value]');
    const dpiLabel = section.querySelector('[data-pdf-dpi-label]');
    const dpiSelect = section.querySelector('[data-pdf-dpi]');
    const splitButton = section.querySelector('[data-pdf-split]');
    const stopButton = section.querySelector('[data-pdf-stop]');
    const clearButton = section.querySelector('[data-pdf-clear]');
    const zipButton = section.querySelector('[data-pdf-zip]');

    const items = [];
    const objectUrls = [];
    let running = false;
    let state = { cancelled: false };

    const mode = () => modes.querySelector('input[name="pdfSplitMode"]:checked').value;

    function trackedUrl(blob) {
      const url = URL.createObjectURL(blob);
      objectUrls.push(url);
      return url;
    }

    function setStatus(item, text, kind) {
      item.statusEl.textContent = text;
      item.statusEl.className = 'status ' + (kind || 'pending');
    }

    function setProgress(item, done, total) {
      item.bar.hidden = false;
      item.barFill.style.width = Math.round((done / Math.max(1, total)) * 100) + '%';
    }

    function addItem(file) {
      const element = document.createElement('li');
      element.innerHTML = `
        <div class="file-row">
          <span class="file-name"></span>
          <span class="status pending">${T.pending}</span>
        </div>
        <div class="bar" hidden><span style="width:0%"></span></div>
        <div class="pdf-results" hidden></div>`;
      element.querySelector('.file-name').textContent = file.name;

      const item = {
        file,
        stem: stemOf(file.name),
        pages: [],
        element,
        statusEl: element.querySelector('.status'),
        bar: element.querySelector('.bar'),
        barFill: element.querySelector('.bar > span'),
        results: element.querySelector('.pdf-results'),
      };

      if (!isPdfFile(file)) {
        setStatus(item, T.notPdf, 'error');
        item.skip = true;
      }

      items.push(item);
      list.append(element);
      return item;
    }

    function renderResults(item) {
      const results = item.results;
      results.innerHTML = '';
      if (!item.pages.length) {
        results.hidden = true;
        return;
      }
      results.hidden = false;

      const zip = document.createElement('button');
      zip.type = 'button';
      zip.textContent = T.downloadZip;
      zip.addEventListener('click', () => downloadZip([item], item.stem + '-pages.zip', zip));
      results.append(zip);

      if (item.note) {
        const note = document.createElement('p');
        note.className = 'file-meta';
        note.style.width = '100%';
        note.textContent = item.note;
        results.append(note);
      }

      const details = document.createElement('details');
      details.className = 'pdf-pages';
      const summary = document.createElement('summary');
      summary.textContent = t('showPages', { n: item.pages.length });
      const links = document.createElement('div');
      links.className = 'pdf-page-links';
      item.pages.forEach((page, index) => {
        const link = document.createElement('a');
        link.className = 'download-link';
        link.href = trackedUrl(page.blob);
        link.download = page.name;
        link.textContent = t('page', { n: index + 1 });
        links.append(link);
      });
      details.append(summary, links);
      results.append(details);
    }

    // A run that was stopped half way leaves its pages downloadable but stays
    // queued, so pressing Split again restarts that document rather than
    // leaving it permanently half-split.
    function pendingItems() {
      return items.filter(item => !item.skip && !item.complete);
    }

    function refreshControls() {
      const jpeg = mode() === 'jpeg';
      qualityLabel.hidden = !jpeg;
      dpiLabel.hidden = !jpeg;
      splitButton.disabled = running || !pendingItems().length;
      const ready = items.reduce((sum, item) => sum + item.pages.length, 0);
      zipButton.hidden = ready === 0;
      zipButton.textContent = t('downloadAll', { n: ready });
      zipButton.disabled = running;
      clearButton.disabled = running;
    }

    async function downloadZip(sources, name, button) {
      if (!window.JSZip) {
        alert(t('zipFailed', { message: T.zipMissing }));
        return;
      }
      const original = button.textContent;
      button.disabled = true;
      button.textContent = T.packaging;
      try {
        const zip = new window.JSZip();
        const nest = sources.length > 1;
        for (const item of sources) {
          const folder = nest ? zip.folder(item.stem) : zip;
          for (const page of item.pages) folder.file(page.name, page.blob);
        }
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        download(blob, name);
      } catch (error) {
        alert(t('zipFailed', { message: messageOf(error) }));
      } finally {
        button.textContent = original;
        button.disabled = false;
        refreshControls();
      }
    }

    async function run() {
      const queue = pendingItems();
      if (!queue.length || running) return;
      running = true;
      state = { cancelled: false };
      splitButton.textContent = T.splitting;
      stopButton.hidden = false;
      stopButton.disabled = false;
      stopButton.textContent = T.stop;
      refreshControls();

      const chosen = mode();
      const options = {
        quality: Math.min(100, Math.max(1, Number(qualityRange.value) || 85)) / 100,
        dpi: Number(dpiSelect.value) || 150,
      };

      try {
        for (const item of queue) {
          if (state.cancelled) {
            setStatus(item, T.stopped, 'warn');
            continue;
          }
          setStatus(item, T.reading, 'pending');
          try {
            const bytes = new Uint8Array(await item.file.arrayBuffer());
            if (!looksLikePdf(bytes)) {
              setStatus(item, T.notPdf, 'error');
              item.skip = true;
              continue;
            }

            setStatus(item, T.engineLoading, 'pending');
            const onPage = (done, total) => {
              setStatus(item, t('working', { page: done + 1, total }), 'pending');
              setProgress(item, done, total);
            };

            const result = chosen === 'jpeg'
              ? await splitToJpegs(bytes, item, onPage, state, options)
              : await splitToPdfs(bytes, item, onPage, state);

            item.pages = result.pages;
            item.note = chosen === 'pdf' && result.total === 1 ? T.onePage : '';
            item.complete = item.pages.length === result.total;
            setProgress(item, item.pages.length, result.total);
            if (item.complete) {
              setStatus(item, t('done', { n: item.pages.length }), 'ok');
            } else {
              setStatus(item, T.stopped, 'warn');
            }
            renderResults(item);
          } catch (error) {
            item.bar.hidden = true;
            if (isPasswordError(error)) setStatus(item, T.encrypted, 'error');
            else setStatus(item, t('failed', { message: messageOf(error) }), 'error');
            item.skip = true;
          }
          refreshControls();
        }
      } finally {
        running = false;
        state.cancelled = false;
        splitButton.textContent = T.split;
        stopButton.hidden = true;
        refreshControls();
      }
    }

    dropZone.addEventListener('click', () => input.click());
    dropZone.addEventListener('dragover', event => {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', event => {
      event.preventDefault();
      dropZone.classList.remove('dragover');
      for (const file of event.dataTransfer.files) addItem(file);
      refreshControls();
    });
    input.addEventListener('change', event => {
      for (const file of event.target.files) addItem(file);
      input.value = '';
      refreshControls();
    });

    modes.addEventListener('change', () => {
      for (const option of modes.querySelectorAll('.format-option')) {
        option.classList.toggle('selected', option.querySelector('input').checked);
      }
      // A finished run belongs to the mode it ran under; switching modes queues
      // the same files again rather than silently mixing PDF and JPEG output.
      for (const item of items) {
        if (item.pages.length) {
          item.pages = [];
          item.note = '';
          item.complete = false;
          item.bar.hidden = true;
          item.barFill.style.width = '0%';
          setStatus(item, T.pending, 'pending');
          renderResults(item);
        }
      }
      refreshControls();
    });

    qualityRange.addEventListener('input', () => {
      qualityValue.textContent = qualityRange.value;
    });

    stopButton.addEventListener('click', () => {
      state.cancelled = true;
      stopButton.disabled = true;
      stopButton.textContent = T.stopping;
    });

    splitButton.addEventListener('click', run);

    clearButton.addEventListener('click', () => {
      if (running) return;
      for (const url of objectUrls) URL.revokeObjectURL(url);
      objectUrls.length = 0;
      items.length = 0;
      list.innerHTML = '';
      refreshControls();
    });

    zipButton.addEventListener('click', () => {
      const ready = items.filter(item => item.pages.length);
      if (!ready.length) return;
      downloadZip(ready, T.zipName + '.zip', zipButton);
    });

    refreshControls();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
}());
