// Locale registry + translated blog chrome for heicquick.com.
//
// Adding a language means adding one entry here and dropping translated posts
// into blog/posts/<code>/. The generator does the rest.
//
//   code       BCP-47 code, also the URL directory (`/fr/blog/...`)
//   dir        URL prefix; '' for English, which lives at the site root
//   native     name shown in the language picker
//   dateLocale locale passed to toLocaleDateString for post dates
//   ui         every user-visible string on a blog page
//
// `readMins` is a function because the unit's position and pluralisation differ
// per language.

export const LOCALES = {
  en: {
    dir: '',
    native: 'English',
    dateLocale: 'en-US',
    ui: {
      navConverter: 'Converter',
      navBlog: 'Blog',
      backToList: '← All articles',
      readMins: n => `${n} min read`,
      heroTitle: 'Blog',
      heroSub: 'Guides on HEIC files, iPhone photos, and picking the right image format.',
      indexTitle: 'Blog — HEIC, iPhone Photos & Image Formats',
      indexDesc: 'Guides and tips on HEIC files, converting iPhone photos, and choosing image formats like JPG, PNG, WebP and PDF.',
      empty: 'No posts yet — check back soon.',
      ctaTitle: 'Need to convert HEIC photos?',
      ctaBody: 'Turn iPhone HEIC into JPG, PNG, WebP or PDF right in your browser — free, unlimited, and 100% private.',
      ctaButton: 'Open the free converter →',
      footHome: 'Home',
      footPrivacy: 'Privacy',
      footTerms: 'Terms',
      footNote: 'No files are uploaded, stored, or tracked.',
      langLabel: 'Language',
    },
  },

  ja: {
    dir: 'ja',
    native: '日本語',
    dateLocale: 'ja-JP',
    ui: {
      navConverter: '変換ツール',
      navBlog: 'ブログ',
      backToList: '← 記事一覧へ',
      readMins: n => `約${n}分で読めます`,
      heroTitle: 'ブログ',
      heroSub: 'HEICファイル、iPhoneの写真、そして画像形式の選び方に関するガイド。',
      indexTitle: 'ブログ — HEIC・iPhoneの写真・画像形式',
      indexDesc: 'HEICファイルとは何か、iPhoneの写真の変換方法、JPG・PNG・WebP・PDFの使い分けをわかりやすく解説します。',
      empty: 'まだ記事がありません。またお越しください。',
      ctaTitle: 'HEIC写真を変換しますか?',
      ctaBody: 'iPhoneのHEIC写真をブラウザ上でJPG・PNG・WebP・PDFに変換できます。無料・無制限・完全プライベート。',
      ctaButton: '無料の変換ツールを開く →',
      footHome: 'ホーム',
      footPrivacy: 'プライバシー',
      footTerms: '利用規約',
      footNote: 'ファイルのアップロード・保存・追跡は一切行いません。',
      langLabel: '言語',
    },
  },

  'zh-cn': {
    dir: 'zh-cn',
    native: '简体中文',
    dateLocale: 'zh-CN',
    ui: {
      navConverter: '转换器',
      navBlog: '博客',
      backToList: '← 所有文章',
      readMins: n => `阅读约 ${n} 分钟`,
      heroTitle: '博客',
      heroSub: '关于 HEIC 文件、iPhone 照片以及如何选择图片格式的指南。',
      indexTitle: '博客 — HEIC、iPhone 照片与图片格式',
      indexDesc: '解读 HEIC 文件、转换 iPhone 照片的方法，以及 JPG、PNG、WebP 和 PDF 等格式该如何选择。',
      empty: '暂无文章，敬请期待。',
      ctaTitle: '需要转换 HEIC 照片吗?',
      ctaBody: '在浏览器中直接把 iPhone 的 HEIC 照片转成 JPG、PNG、WebP 或 PDF —— 免费、无限制、完全私密。',
      ctaButton: '打开免费转换器 →',
      footHome: '首页',
      footPrivacy: '隐私政策',
      footTerms: '使用条款',
      footNote: '不上传、不存储、不追踪任何文件。',
      langLabel: '语言',
    },
  },

  'zh-tw': {
    dir: 'zh-tw',
    native: '繁體中文',
    dateLocale: 'zh-TW',
    ui: {
      navConverter: '轉換器',
      navBlog: '部落格',
      backToList: '← 所有文章',
      readMins: n => `閱讀約 ${n} 分鐘`,
      heroTitle: '部落格',
      heroSub: '關於 HEIC 檔案、iPhone 照片以及如何挑選圖片格式的指南。',
      indexTitle: '部落格 — HEIC、iPhone 照片與圖片格式',
      indexDesc: '解讀 HEIC 檔案、轉換 iPhone 照片的方法，以及 JPG、PNG、WebP 與 PDF 等格式該如何選擇。',
      empty: '目前尚無文章，敬請期待。',
      ctaTitle: '需要轉換 HEIC 照片嗎?',
      ctaBody: '在瀏覽器中直接把 iPhone 的 HEIC 照片轉成 JPG、PNG、WebP 或 PDF —— 免費、無限制、完全私密。',
      ctaButton: '開啟免費轉換器 →',
      footHome: '首頁',
      footPrivacy: '隱私權政策',
      footTerms: '使用條款',
      footNote: '不上傳、不儲存、不追蹤任何檔案。',
      langLabel: '語言',
    },
  },

  ko: {
    dir: 'ko',
    native: '한국어',
    dateLocale: 'ko-KR',
    ui: {
      navConverter: '변환기',
      navBlog: '블로그',
      backToList: '← 전체 글 보기',
      readMins: n => `${n}분 분량`,
      heroTitle: '블로그',
      heroSub: 'HEIC 파일, 아이폰 사진, 이미지 형식 선택에 대한 가이드.',
      indexTitle: '블로그 — HEIC, 아이폰 사진, 이미지 형식',
      indexDesc: 'HEIC 파일이 무엇인지, 아이폰 사진을 변환하는 방법, JPG·PNG·WebP·PDF 중 무엇을 골라야 하는지 알려드립니다.',
      empty: '아직 글이 없습니다. 곧 찾아뵙겠습니다.',
      ctaTitle: 'HEIC 사진을 변환해야 하나요?',
      ctaBody: '아이폰 HEIC 사진을 브라우저에서 바로 JPG·PNG·WebP·PDF로 변환하세요. 무료, 무제한, 100% 비공개.',
      ctaButton: '무료 변환기 열기 →',
      footHome: '홈',
      footPrivacy: '개인정보처리방침',
      footTerms: '이용약관',
      footNote: '파일을 업로드하거나 저장하거나 추적하지 않습니다.',
      langLabel: '언어',
    },
  },

  de: {
    dir: 'de',
    native: 'Deutsch',
    dateLocale: 'de-DE',
    ui: {
      navConverter: 'Konverter',
      navBlog: 'Blog',
      backToList: '← Alle Artikel',
      readMins: n => `${n} Min. Lesezeit`,
      heroTitle: 'Blog',
      heroSub: 'Ratgeber zu HEIC-Dateien, iPhone-Fotos und der Wahl des richtigen Bildformats.',
      indexTitle: 'Blog — HEIC, iPhone-Fotos & Bildformate',
      indexDesc: 'Tipps und Anleitungen zu HEIC-Dateien, zum Konvertieren von iPhone-Fotos und zur Wahl zwischen JPG, PNG, WebP und PDF.',
      empty: 'Noch keine Beiträge — schauen Sie bald wieder vorbei.',
      ctaTitle: 'HEIC-Fotos konvertieren?',
      ctaBody: 'Wandeln Sie iPhone-HEIC direkt im Browser in JPG, PNG, WebP oder PDF um — kostenlos, unbegrenzt und zu 100 % privat.',
      ctaButton: 'Kostenlosen Konverter öffnen →',
      footHome: 'Startseite',
      footPrivacy: 'Datenschutz',
      footTerms: 'AGB',
      footNote: 'Es werden keine Dateien hochgeladen, gespeichert oder getrackt.',
      langLabel: 'Sprache',
    },
  },

  fr: {
    dir: 'fr',
    native: 'Français',
    dateLocale: 'fr-FR',
    ui: {
      navConverter: 'Convertisseur',
      navBlog: 'Blog',
      backToList: '← Tous les articles',
      readMins: n => `${n} min de lecture`,
      heroTitle: 'Blog',
      heroSub: 'Guides sur les fichiers HEIC, les photos iPhone et le choix du bon format d’image.',
      indexTitle: 'Blog — HEIC, photos iPhone et formats d’image',
      indexDesc: 'Guides et conseils sur les fichiers HEIC, la conversion des photos iPhone et le choix entre JPG, PNG, WebP et PDF.',
      empty: 'Aucun article pour l’instant — revenez bientôt.',
      ctaTitle: 'Besoin de convertir des photos HEIC ?',
      ctaBody: 'Convertissez vos HEIC d’iPhone en JPG, PNG, WebP ou PDF directement dans votre navigateur — gratuit, illimité et 100 % privé.',
      ctaButton: 'Ouvrir le convertisseur gratuit →',
      footHome: 'Accueil',
      footPrivacy: 'Confidentialité',
      footTerms: 'Conditions',
      footNote: 'Aucun fichier n’est envoyé, stocké ni suivi.',
      langLabel: 'Langue',
    },
  },

  es: {
    dir: 'es',
    native: 'Español',
    dateLocale: 'es-ES',
    ui: {
      navConverter: 'Conversor',
      navBlog: 'Blog',
      backToList: '← Todos los artículos',
      readMins: n => `${n} min de lectura`,
      heroTitle: 'Blog',
      heroSub: 'Guías sobre archivos HEIC, fotos de iPhone y cómo elegir el formato de imagen adecuado.',
      indexTitle: 'Blog — HEIC, fotos de iPhone y formatos de imagen',
      indexDesc: 'Guías y consejos sobre archivos HEIC, cómo convertir fotos de iPhone y cuándo usar JPG, PNG, WebP o PDF.',
      empty: 'Todavía no hay artículos — vuelve pronto.',
      ctaTitle: '¿Necesitas convertir fotos HEIC?',
      ctaBody: 'Convierte los HEIC de tu iPhone a JPG, PNG, WebP o PDF desde el navegador: gratis, sin límites y 100 % privado.',
      ctaButton: 'Abrir el conversor gratuito →',
      footHome: 'Inicio',
      footPrivacy: 'Privacidad',
      footTerms: 'Términos',
      footNote: 'No se sube, almacena ni rastrea ningún archivo.',
      langLabel: 'Idioma',
    },
  },

  pt: {
    dir: 'pt',
    native: 'Português',
    dateLocale: 'pt-BR',
    ui: {
      navConverter: 'Conversor',
      navBlog: 'Blog',
      backToList: '← Todos os artigos',
      readMins: n => `${n} min de leitura`,
      heroTitle: 'Blog',
      heroSub: 'Guias sobre arquivos HEIC, fotos do iPhone e como escolher o formato de imagem certo.',
      indexTitle: 'Blog — HEIC, fotos do iPhone e formatos de imagem',
      indexDesc: 'Guias e dicas sobre arquivos HEIC, como converter fotos do iPhone e quando usar JPG, PNG, WebP ou PDF.',
      empty: 'Ainda não há artigos — volte em breve.',
      ctaTitle: 'Precisa converter fotos HEIC?',
      ctaBody: 'Converta os HEIC do seu iPhone em JPG, PNG, WebP ou PDF direto no navegador — grátis, ilimitado e 100% privado.',
      ctaButton: 'Abrir o conversor gratuito →',
      footHome: 'Início',
      footPrivacy: 'Privacidade',
      footTerms: 'Termos',
      footNote: 'Nenhum arquivo é enviado, armazenado ou rastreado.',
      langLabel: 'Idioma',
    },
  },
};

export const LANG_CODES = Object.keys(LOCALES);

/** URL of the converter home page for a locale. */
export function homePath(lang) {
  return lang === 'en' ? '/' : `/${LOCALES[lang].dir}/`;
}

/** URL of the blog index for a locale. */
export function blogPath(lang) {
  return lang === 'en' ? '/blog/' : `/${LOCALES[lang].dir}/blog/`;
}

/** URL of a single post. */
export function postPath(lang, slug) {
  return lang === 'en' ? `/blog/${slug}` : `/${LOCALES[lang].dir}/blog/${slug}`;
}

/** Filesystem directory (relative to repo root) holding a locale's blog pages. */
export function blogDirFor(lang) {
  return lang === 'en' ? 'blog' : `${LOCALES[lang].dir}/blog`;
}
