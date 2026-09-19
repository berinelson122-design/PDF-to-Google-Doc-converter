import { ReadabilityMetrics, ComplexPhraseItem } from '../types/index.ts';

// ===== START NEW CODE: READABILITY ANALYSIS & COMPLEX PHRASING DETECTOR =====

/**
 * Counts syllables in an English word accurately based on linguistic heuristic rules.
 */
export function countSyllablesInWord(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;

  // Standard syllable count rules
  let syllables = 0;
  const vowels = 'aeiouy';
  let prevIsVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevIsVowel) {
      syllables++;
    }
    prevIsVowel = isVowel;
  }

  // Adjustments for common silent letters & endings
  if (word.endsWith('e') && !word.endsWith('le') && !word.endsWith('ee')) {
    syllables = Math.max(1, syllables - 1);
  } else if (word.endsWith('ed') && !word.endsWith('ted') && !word.endsWith('ded')) {
    syllables = Math.max(1, syllables - 1);
  } else if (word.endsWith('es') && !word.endsWith('ses') && !word.endsWith('zes') && !word.endsWith('ches') && !word.endsWith('shes')) {
    syllables = Math.max(1, syllables - 1);
  }

  return Math.max(1, syllables);
}

// Database of complex, wordy, or legalistic phrasing with plain-language recommendations
const COMPLEX_PHRASES_CATALOG: Array<{
  pattern: RegExp;
  phraseName: string;
  suggestion: string;
  category: ComplexPhraseItem['category'];
  explanation: string;
}> = [
  {
    pattern: /\bin order to\b/gi,
    phraseName: 'in order to',
    suggestion: 'to',
    category: 'wordy',
    explanation: 'Unnecessary filler; "to" conveys identical purpose with greater impact.',
  },
  {
    pattern: /\bdue to the fact that\b/gi,
    phraseName: 'due to the fact that',
    suggestion: 'because / since',
    category: 'wordy',
    explanation: 'Wordy circumlocution that burdens reading flow.',
  },
  {
    pattern: /\bat this point in time\b/gi,
    phraseName: 'at this point in time',
    suggestion: 'now / currently',
    category: 'wordy',
    explanation: 'Inflated phrase often used as placeholder speech.',
  },
  {
    pattern: /\butiliz(?:e|es|ed|ing)\b/gi,
    phraseName: 'utilize / utilization',
    suggestion: 'use',
    category: 'jargon',
    explanation: '"Use" is clearer and less pretentious than "utilize".',
  },
  {
    pattern: /\bin accordance with\b/gi,
    phraseName: 'in accordance with',
    suggestion: 'under / per / following',
    category: 'jargon',
    explanation: 'Formal legalistic jargon that creates cognitive overhead.',
  },
  {
    pattern: /\bfor the purpose of\b/gi,
    phraseName: 'for the purpose of',
    suggestion: 'to / for',
    category: 'wordy',
    explanation: 'Convoluted prepositional phrase.',
  },
  {
    pattern: /\bwith reference to\b|\bwith respect to\b|\bin regard to\b/gi,
    phraseName: 'with reference / respect to',
    suggestion: 'regarding / about',
    category: 'wordy',
    explanation: 'Wordy transitional phrase.',
  },
  {
    pattern: /\bsubsequent to\b/gi,
    phraseName: 'subsequent to',
    suggestion: 'after',
    category: 'jargon',
    explanation: 'Direct plain language preference is "after".',
  },
  {
    pattern: /\bprior to\b/gi,
    phraseName: 'prior to',
    suggestion: 'before',
    category: 'jargon',
    explanation: '"Before" is direct, punchy, and universally recognized.',
  },
  {
    pattern: /\bhas the capacity to\b|\bhave the capacity to\b/gi,
    phraseName: 'has the capacity to',
    suggestion: 'can',
    category: 'wordy',
    explanation: 'Multi-word verbal expression easily condensed to modal verb "can".',
  },
  {
    pattern: /\bis indicative of\b|\bare indicative of\b/gi,
    phraseName: 'is indicative of',
    suggestion: 'indicates / shows',
    category: 'wordy',
    explanation: 'Smothered verb; replace with the active verb "indicates".',
  },
  {
    pattern: /\btake into consideration\b/gi,
    phraseName: 'take into consideration',
    suggestion: 'consider',
    category: 'wordy',
    explanation: 'Three words doing the work of one crisp verb.',
  },
  {
    pattern: /\bmake a determination\b/gi,
    phraseName: 'make a determination',
    suggestion: 'decide / determine',
    category: 'wordy',
    explanation: 'Nominalization; use direct verb "decide".',
  },
  {
    pattern: /\bnotwithstanding the fact that\b/gi,
    phraseName: 'notwithstanding the fact that',
    suggestion: 'although / even though',
    category: 'complex',
    explanation: 'Extremely heavy syntactic construction.',
  },
  {
    pattern: /\ba large number of\b/gi,
    phraseName: 'a large number of',
    suggestion: 'many',
    category: 'wordy',
    explanation: 'Replace 4 words with "many".',
  },
  {
    pattern: /\bin the event that\b/gi,
    phraseName: 'in the event that',
    suggestion: 'if',
    category: 'wordy',
    explanation: 'Simple conditional "if" improves sentence tempo.',
  },
  {
    pattern: /\bon a regular basis\b|\bon a daily basis\b/gi,
    phraseName: 'on a ... basis',
    suggestion: 'regularly / daily',
    category: 'redundant',
    explanation: 'Adverbial bloat; use the direct adverb.',
  },
  {
    pattern: /\bit is recommended that\b/gi,
    phraseName: 'it is recommended that',
    suggestion: 'we recommend / please',
    category: 'passive',
    explanation: 'Passive expletive construct obscuring the actor.',
  },
  {
    pattern: /\bin close proximity to\b/gi,
    phraseName: 'in close proximity to',
    suggestion: 'near / close to',
    category: 'redundant',
    explanation: '"Proximity" already implies closeness; redundancy.',
  },
  {
    pattern: /\baforementioned\b/gi,
    phraseName: 'aforementioned',
    suggestion: 'earlier / previous / this',
    category: 'jargon',
    explanation: 'Archaic legalese that alienates general readers.',
  },
  {
    pattern: /\bis considered to be\b|\bwas considered to be\b/gi,
    phraseName: 'is considered to be',
    suggestion: 'is considered / is',
    category: 'passive',
    explanation: 'Weak passive voice structure.',
  },
  {
    pattern: /\bexpedite\b/gi,
    phraseName: 'expedite',
    suggestion: 'speed up / hasten',
    category: 'jargon',
    explanation: 'Plain English guideline replacement for high-register business talk.',
  },
];

/**
 * Strips HTML and tags cleanly to extract plain readable sentences.
 */
export function extractCleanText(htmlOrText: string): string {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executes an automated Readability Analysis on the provided document content.
 * Computes Flesch-Kincaid Grade Level, Flesch Reading Ease, and identifies complex phrasing.
 */
export function analyzeDocumentReadability(rawContent: string): ReadabilityMetrics {
  const plainText = extractCleanText(rawContent);

  if (!plainText || plainText.length < 10) {
    return {
      fleschKincaidGradeLevel: 0,
      fleschReadingEase: 100,
      readingLevelLabel: 'Awaiting Content',
      interpretation: 'Provide document text to initiate automated linguistic assessment.',
      totalWords: 0,
      totalSentences: 0,
      totalSyllables: 0,
      avgSentenceLength: 0,
      avgSyllablesPerWord: 0,
      complexWordsCount: 0,
      complexWordsPercentage: 0,
      complexPhrases: [],
    };
  }

  // Segment sentences by terminating punctuation
  const sentences = plainText
    .split(/[.!?]+(?:\s+|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /\w+/.test(s));

  const totalSentences = Math.max(1, sentences.length);

  // Extract individual words
  const words = plainText
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w]+|[^\w]+$/g, ''))
    .filter((w) => w.length > 0 && /[a-zA-Z]/.test(w));

  const totalWords = Math.max(1, words.length);

  // Syllables and complex words (3+ syllables)
  let totalSyllables = 0;
  let complexWordsCount = 0;

  for (const word of words) {
    const syl = countSyllablesInWord(word);
    totalSyllables += syl;
    if (syl >= 3) {
      complexWordsCount++;
    }
  }

  const avgSentenceLength = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;
  const complexWordsPercentage = (complexWordsCount / totalWords) * 100;

  // Formula 1: Flesch-Kincaid Grade Level
  // 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const rawGradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  const fleschKincaidGradeLevel = Math.max(0, Math.round(rawGradeLevel * 10) / 10);

  // Formula 2: Flesch Reading Ease
  // 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const rawEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  const fleschReadingEase = Math.min(100, Math.max(0, Math.round(rawEase * 10) / 10));

  // Determine Grade Level Label & Interpretation
  let readingLevelLabel = '';
  let interpretation = '';

  if (fleschReadingEase >= 90) {
    readingLevelLabel = '5th Grade (Very Easy)';
    interpretation = 'Extremely accessible; reads effortlessly with short sentences and simple vocabulary.';
  } else if (fleschReadingEase >= 80) {
    readingLevelLabel = '6th Grade (Easy)';
    interpretation = 'Conversational English; suitable for general consumer documentation and quick scans.';
  } else if (fleschReadingEase >= 70) {
    readingLevelLabel = '7th Grade (Fairly Easy)';
    interpretation = 'Standard plain English; easily understood by broad audiences.';
  } else if (fleschReadingEase >= 60) {
    readingLevelLabel = '8th–9th Grade (Standard)';
    interpretation = 'Optimal business standard; balanced structure common in professional memos and guides.';
  } else if (fleschReadingEase >= 50) {
    readingLevelLabel = '10th–12th Grade (Fairly Difficult)';
    interpretation = 'Academic/technical level; suitable for executive reports and engineering specifications.';
  } else if (fleschReadingEase >= 30) {
    readingLevelLabel = 'College Level (Difficult)';
    interpretation = 'Dense academic prose; contains multi-clause syntax and specialized terminology.';
  } else {
    readingLevelLabel = 'College Graduate (Very Confusing)';
    interpretation = 'Highly abstract, legalistic, or scientific text with extreme sentence length and polysyllabic jargon.';
  }

  // Complex Phrasing Detection across plainText
  const complexPhrases: ComplexPhraseItem[] = [];
  const recordedKeys = new Set<string>();

  for (const item of COMPLEX_PHRASES_CATALOG) {
    const matches = plainText.match(item.pattern);
    if (matches && matches.length > 0) {
      const matchedPhrase = matches[0];
      const matchIndex = plainText.indexOf(matchedPhrase);
      const start = Math.max(0, matchIndex - 30);
      const end = Math.min(plainText.length, matchIndex + matchedPhrase.length + 30);
      const snippet = (start > 0 ? '...' : '') + plainText.slice(start, end).trim() + (end < plainText.length ? '...' : '');

      const key = item.phraseName.toLowerCase();
      if (!recordedKeys.has(key)) {
        recordedKeys.add(key);
        complexPhrases.push({
          phrase: matchedPhrase,
          suggestion: item.suggestion,
          category: item.category,
          explanation: item.explanation,
          contextSnippet: snippet,
        });
      }
    }
  }

  return {
    fleschKincaidGradeLevel,
    fleschReadingEase,
    readingLevelLabel,
    interpretation,
    totalWords,
    totalSentences,
    totalSyllables,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    complexWordsCount,
    complexWordsPercentage: Math.round(complexWordsPercentage * 10) / 10,
    complexPhrases,
  };
}
// ===== END NEW CODE: READABILITY ANALYSIS & COMPLEX PHRASING DETECTOR =====
