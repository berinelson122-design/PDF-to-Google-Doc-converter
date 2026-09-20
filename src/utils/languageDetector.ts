import { DetectedLanguage, SupportedLanguage, IngestionOcrSettings, ScriptType, PdfTechnicalMetadata } from '../types/index.ts';
export type { DetectedLanguage, SupportedLanguage, IngestionOcrSettings, ScriptType };

// ===== START NEW CODE: AUTOMATED LANGUAGE DETECTION & SUPPORTED LANGUAGES REGISTRY =====

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', speechCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', speechCode: 'pt-PT' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', speechCode: 'zh-TW' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', speechCode: 'ar-SA' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', speechCode: 'nl-NL' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', speechCode: 'sv-SE' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', speechCode: 'pl-PL' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', speechCode: 'tr-TR' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', speechCode: 'vi-VN' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', speechCode: 'id-ID' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', speechCode: 'uk-UA' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', speechCode: 'el-GR' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', speechCode: 'he-IL' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', speechCode: 'cs-CZ' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', speechCode: 'da-DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', speechCode: 'fi-FI' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', speechCode: 'no-NO' },
];

export const LANGUAGE_MAP = new Map<string, SupportedLanguage>(
  SUPPORTED_LANGUAGES.map((l) => [l.code.toLowerCase(), l])
);

// Common stop-words for rapid client-side text language detection
const STOPWORDS_MAP: Record<string, string[]> = {
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'en', 'para', 'con', 'por', 'que', 'este', 'esta', 'como', 'pero', 'más', 'del', 'al', 'los', 'estos', 'estas', 'son', 'sobre'],
  fr: ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'en', 'pour', 'avec', 'par', 'qui', 'que', 'dans', 'sur', 'ce', 'cette', 'ces', 'est', 'sont', 'comme', 'mais'],
  de: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen', 'und', 'in', 'von', 'zu', 'mit', 'für', 'auf', 'ist', 'im', 'nicht', 'als', 'auch', 'es'],
  it: ['il', 'la', 'lo', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'che', 'non', 'del', 'della', 'dei', 'delle', 'questo', 'questa'],
  pt: ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'que', 'este', 'esta', 'como', 'mais'],
  nl: ['de', 'het', 'een', 'en', 'van', 'ik', 'te', 'dat', 'die', 'in', 'voor', 'is', 'niet', 'op', 'met', 'als', 'er', 'maar', 'om', 'zijn', 'aan'],
  ru: ['и', 'в', 'не', 'на', 'я', 'что', 'тот', 'быть', 'с', 'он', 'а', 'весь', 'это', 'как', 'по', 'к', 'но', 'они', 'мы', 'к', 'у', 'который', 'из'],
  en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from'],
};

/**
 * Detects the primary language of any input text or HTML document.
 * Combines unicode script recognition with stop-word frequency analysis.
 */
export function detectLanguageFromText(rawText: string): DetectedLanguage {
  if (!rawText || rawText.trim().length === 0) {
    return { code: 'en', name: 'English', nativeName: 'English', confidence: 0.95, flag: '🇺🇸', isAutoDetected: true };
  }

  // Strip HTML tags and normalize
  const clean = rawText
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase()
    .trim();

  // 1. Script-based immediate detection (CJK, Cyrillic, Arabic, Hangul, Hebrew, Greek, Devanagari)
  const totalChars = clean.length;
  if (totalChars === 0) {
    return { code: 'en', name: 'English', nativeName: 'English', confidence: 0.95, flag: '🇺🇸', isAutoDetected: true };
  }

  const japaneseHiraganaKatakana = (clean.match(/[\u3040-\u30ff]/g) || []).length;
  if (japaneseHiraganaKatakana / totalChars > 0.05) {
    return { code: 'ja', name: 'Japanese', nativeName: '日本語', confidence: 0.99, flag: '🇯🇵', isAutoDetected: true };
  }

  const koreanHangul = (clean.match(/[\uac00-\ud7af\u1100-\u11ff]/g) || []).length;
  if (koreanHangul / totalChars > 0.05) {
    return { code: 'ko', name: 'Korean', nativeName: '한국어', confidence: 0.99, flag: '🇰🇷', isAutoDetected: true };
  }

  const chineseChars = (clean.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseChars / totalChars > 0.08) {
    return { code: 'zh', name: 'Chinese', nativeName: '中文', confidence: 0.98, flag: '🇨🇳', isAutoDetected: true };
  }

  const arabicChars = (clean.match(/[\u0600-\u06ff]/g) || []).length;
  if (arabicChars / totalChars > 0.08) {
    return { code: 'ar', name: 'Arabic', nativeName: 'العربية', confidence: 0.98, flag: '🇸🇦', isAutoDetected: true };
  }

  const cyrillicChars = (clean.match(/[\u0400-\u04ff]/g) || []).length;
  if (cyrillicChars / totalChars > 0.08) {
    // Check for Ukrainian specific letters (і, ї, є, ґ)
    const ukrainianSpecific = (clean.match(/[іїєґ]/gi) || []).length;
    if (ukrainianSpecific > 2) {
      return { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', confidence: 0.96, flag: '🇺🇦', isAutoDetected: true };
    }
    return { code: 'ru', name: 'Russian', nativeName: 'Русский', confidence: 0.97, flag: '🇷🇺', isAutoDetected: true };
  }

  const devanagariChars = (clean.match(/[\u0900-\u097f]/g) || []).length;
  if (devanagariChars / totalChars > 0.08) {
    return { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', confidence: 0.98, flag: '🇮🇳', isAutoDetected: true };
  }

  const greekChars = (clean.match(/[\u0370-\u03ff]/g) || []).length;
  if (greekChars / totalChars > 0.08) {
    return { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', confidence: 0.98, flag: '🇬🇷', isAutoDetected: true };
  }

  const hebrewChars = (clean.match(/[\u0590-\u05ff]/g) || []).length;
  if (hebrewChars / totalChars > 0.08) {
    return { code: 'he', name: 'Hebrew', nativeName: 'עברית', confidence: 0.98, flag: '🇮🇱', isAutoDetected: true };
  }

  // 2. Token stop-word scoring for Latin-based languages
  const words = clean
    .split(/[\s,.;:!?()"'`«»—–\-\d/\\\[\]{}]+/)
    .filter((w) => w.length >= 2);

  if (words.length === 0) {
    return { code: 'en', name: 'English', nativeName: 'English', confidence: 0.90, flag: '🇺🇸', isAutoDetected: true };
  }

  const scores: Record<string, number> = {
    es: 0,
    fr: 0,
    de: 0,
    it: 0,
    pt: 0,
    nl: 0,
    en: 0,
  };

  for (const word of words) {
    for (const [langCode, stoplist] of Object.entries(STOPWORDS_MAP)) {
      if (stoplist.includes(word)) {
        scores[langCode] = (scores[langCode] || 0) + 1;
      }
    }
  }

  // Find best scoring language
  let bestLang = 'en';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  const matchRatio = bestScore / Math.max(1, words.length * 0.15);
  const confidence = Math.min(0.99, Math.max(0.70, Number((0.65 + matchRatio * 0.35).toFixed(2))));

  const found = SUPPORTED_LANGUAGES.find((l) => l.code === bestLang) || SUPPORTED_LANGUAGES[0];

  return {
    code: found.code,
    name: found.name,
    nativeName: found.nativeName,
    confidence,
    flag: found.flag,
    isAutoDetected: true,
  };
}

/**
 * Helper to get language object by code or name
 */
export function getSupportedLanguage(codeOrName: string): SupportedLanguage {
  const normalized = (codeOrName || 'en').toLowerCase().trim();
  const direct = LANGUAGE_MAP.get(normalized);
  if (direct) return direct;

  const byName = SUPPORTED_LANGUAGES.find(
    (l) => l.name.toLowerCase() === normalized || l.nativeName.toLowerCase() === normalized
  );
  if (byName) return byName;

  return SUPPORTED_LANGUAGES[0]; // English fallback
}

export const DEFAULT_INGESTION_OCR_SETTINGS: IngestionOcrSettings = {
  autoLanguageDetection: true,
  detectedLanguageCode: 'en',
  detectedLanguageName: 'English',
  scriptType: 'latin',
  enableBidiTextEngine: false,
  verticalTextOrientation: false,
  enhanceCharacterResolution: true,
  tabularMatrixMode: 'strict',
  preserveLigatures: true,
  diacriticsPreservation: true,
  handwritingPreprocessing: false,
  dictionaryAlignment: true,
};

/**
 * Automatically computes and toggles the optimal OCR parameters based on the detected language and script.
 */
export function getAutoOcrSettingsForLanguage(detectedLang: DetectedLanguage): IngestionOcrSettings {
  const code = (detectedLang.code || 'en').toLowerCase();
  
  // 1. CJK Matrix (Japanese, Chinese, Korean)
  if (['ja', 'zh', 'zh-tw', 'ko'].includes(code)) {
    return {
      autoLanguageDetection: true,
      detectedLanguageCode: detectedLang.code,
      detectedLanguageName: detectedLang.name,
      scriptType: 'cjk',
      enableBidiTextEngine: false,
      verticalTextOrientation: code === 'ja' || code.startsWith('zh'),
      enhanceCharacterResolution: true,
      tabularMatrixMode: 'strict',
      preserveLigatures: true,
      diacriticsPreservation: false,
      handwritingPreprocessing: true,
      dictionaryAlignment: true,
    };
  }

  // 2. RTL BiDi Matrix (Arabic, Hebrew)
  if (['ar', 'he'].includes(code)) {
    return {
      autoLanguageDetection: true,
      detectedLanguageCode: detectedLang.code,
      detectedLanguageName: detectedLang.name,
      scriptType: code === 'he' ? 'hebrew' : 'rtl',
      enableBidiTextEngine: true,
      verticalTextOrientation: false,
      enhanceCharacterResolution: true,
      tabularMatrixMode: 'strict',
      preserveLigatures: true,
      diacriticsPreservation: true,
      handwritingPreprocessing: false,
      dictionaryAlignment: true,
    };
  }

  // 3. Cyrillic Matrix (Russian, Ukrainian)
  if (['ru', 'uk'].includes(code)) {
    return {
      autoLanguageDetection: true,
      detectedLanguageCode: detectedLang.code,
      detectedLanguageName: detectedLang.name,
      scriptType: 'cyrillic',
      enableBidiTextEngine: false,
      verticalTextOrientation: false,
      enhanceCharacterResolution: true,
      tabularMatrixMode: 'strict',
      preserveLigatures: true,
      diacriticsPreservation: true,
      handwritingPreprocessing: false,
      dictionaryAlignment: true,
    };
  }

  // 4. Devanagari / Indic Matrix (Hindi)
  if (['hi'].includes(code)) {
    return {
      autoLanguageDetection: true,
      detectedLanguageCode: detectedLang.code,
      detectedLanguageName: detectedLang.name,
      scriptType: 'devanagari',
      enableBidiTextEngine: false,
      verticalTextOrientation: false,
      enhanceCharacterResolution: true,
      tabularMatrixMode: 'strict',
      preserveLigatures: true,
      diacriticsPreservation: true,
      handwritingPreprocessing: false,
      dictionaryAlignment: true,
    };
  }

  // 5. Greek Matrix
  if (['el'].includes(code)) {
    return {
      autoLanguageDetection: true,
      detectedLanguageCode: detectedLang.code,
      detectedLanguageName: detectedLang.name,
      scriptType: 'greek',
      enableBidiTextEngine: false,
      verticalTextOrientation: false,
      enhanceCharacterResolution: true,
      tabularMatrixMode: 'strict',
      preserveLigatures: true,
      diacriticsPreservation: true,
      handwritingPreprocessing: false,
      dictionaryAlignment: true,
    };
  }

  // 6. Latin with Diacritics (Spanish, French, German, Portuguese, Italian, Dutch, Polish, Czech, Turkish, Vietnamese, Scandinavian)
  if (['es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'cs', 'tr', 'vi', 'sv', 'da', 'fi', 'no', 'id'].includes(code)) {
    return {
      autoLanguageDetection: true,
      detectedLanguageCode: detectedLang.code,
      detectedLanguageName: detectedLang.name,
      scriptType: 'latin',
      enableBidiTextEngine: false,
      verticalTextOrientation: false,
      enhanceCharacterResolution: true,
      tabularMatrixMode: 'strict',
      preserveLigatures: true,
      diacriticsPreservation: true,
      handwritingPreprocessing: false,
      dictionaryAlignment: true,
    };
  }

  // Default Standard Latin (English)
  return {
    autoLanguageDetection: true,
    detectedLanguageCode: detectedLang.code || 'en',
    detectedLanguageName: detectedLang.name || 'English',
    scriptType: 'latin',
    enableBidiTextEngine: false,
    verticalTextOrientation: false,
    enhanceCharacterResolution: true,
    tabularMatrixMode: 'strict',
    preserveLigatures: true,
    diacriticsPreservation: true,
    handwritingPreprocessing: false,
    dictionaryAlignment: true,
  };
}

/**
 * Scans raw PDF binary streams, embedded strings, and metadata during the ingestion stage
 * to immediately identify the document language before full neural OCR extraction.
 */
export function detectLanguageFromPdfBuffer(
  bufferOrBase64: ArrayBuffer | Uint8Array | string,
  metadata?: PdfTechnicalMetadata
): DetectedLanguage {
  let textSample = '';

  // 1. Gather metadata hints (Title, Subject, Author, Keywords)
  if (metadata) {
    const metaParts = [
      metadata.title,
      metadata.subject,
      metadata.author,
      ...(metadata.keywords || []),
    ].filter(Boolean);
    if (metaParts.length > 0) {
      textSample += metaParts.join(' ') + ' ';
    }
  }

  // 2. Extract embedded text stream fragments from PDF binary
  try {
    let rawString = '';
    if (typeof bufferOrBase64 === 'string') {
      const cleanBase64 = bufferOrBase64.replace(/^data:application\/pdf;base64,/, '');
      const binaryString = atob(cleanBase64.slice(0, Math.min(cleanBase64.length, 65536)));
      rawString = binaryString;
    } else {
      const uint8 = bufferOrBase64 instanceof Uint8Array 
        ? bufferOrBase64 
        : new Uint8Array(bufferOrBase64);
      const sliceLen = Math.min(uint8.byteLength, 65536);
      const decoder = new TextDecoder('latin1');
      rawString = decoder.decode(uint8.subarray(0, sliceLen));
    }

    // Extract PDF text operators like (string) Tj or [(string)] TJ
    const literalStrings = rawString.match(/\(([^()]{2,100})\)\s*(?:Tj|TJ|'|")/g) || [];
    for (const match of literalStrings.slice(0, 50)) {
      const inner = match.replace(/^\(/, '').replace(/\)\s*(?:Tj|TJ|'|")$/, '');
      textSample += inner + ' ';
    }

    // Extract Unicode CJK/RTL/Cyrillic escape sequences if any
    const hexStrings = rawString.match(/<([0-9a-fA-F]{4,120})>\s*(?:Tj|TJ)/g) || [];
    for (const hex of hexStrings.slice(0, 20)) {
      const hexBody = hex.replace(/^</, '').replace(/>\s*(?:Tj|TJ)$/, '');
      // Try decode UTF-16BE
      try {
        let decoded = '';
        for (let i = 0; i < hexBody.length; i += 4) {
          const codePoint = parseInt(hexBody.substr(i, 4), 16);
          if (codePoint >= 32 && codePoint < 65534) {
            decoded += String.fromCharCode(codePoint);
          }
        }
        textSample += decoded + ' ';
      } catch {
        // Continue
      }
    }
  } catch (err) {
    console.warn('PDF stream language sampling notice:', err);
  }

  // If text sample has meaningful content, run language detection
  if (textSample.trim().length >= 4) {
    return detectLanguageFromText(textSample);
  }

  // If metadata title had non-latin chars
  if (metadata?.title) {
    return detectLanguageFromText(metadata.title);
  }

  return {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    confidence: 0.95,
    flag: '🇺🇸',
    isAutoDetected: true,
  };
}

// ===== END NEW CODE: AUTOMATED LANGUAGE DETECTION & SUPPORTED LANGUAGES REGISTRY =====
