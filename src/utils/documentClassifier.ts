// ===== START NEW CODE: AUTOMATED DOCUMENT CATEGORIZATION ENGINE =====
import { DocumentCategory } from '../types/index.ts';

export interface CategoryMatchScore {
  category: DocumentCategory;
  score: number;
  matchedKeywords: string[];
}

export interface ClassificationResult {
  category: DocumentCategory;
  tags: string[];
  confidence: number; // 0 to 100
  matchedKeywords: string[];
  scores: Record<DocumentCategory, number>;
}

// Targeted keyword dictionaries for precision detection
const INVOICE_KEYWORDS = [
  'invoice', 'bill to', 'billed to', 'ship to', 'remit to', 'remittance',
  'due date', 'invoice date', 'payment terms', 'subtotal', 'sales tax', 'vat',
  'total amount', 'balance due', 'amount due', 'amount payable', 'purchase order',
  'p.o. #', 'po number', 'itemized', 'unit price', 'line item', 'qty',
  'net 30', 'net 60', 'net 15', 'billing address', 'payable to', 'receipt',
  'tax invoice', 'proforma', 'account number', 'statement of account'
];

const CONTRACT_KEYWORDS = [
  'agreement', 'contract', 'nda', 'non-disclosure', 'terms and conditions',
  'terms of service', 'parties hereby agree', 'governing law', 'jurisdiction',
  'indemnification', 'confidentiality', 'effective date', 'termination clause',
  'whereas', 'herein', 'hereinafter', 'in witness whereof', 'severability',
  'intellectual property rights', 'breach of contract', 'signatory', 'authorized signature',
  'executed as of', 'memorandum of understanding', 'mou', 'service level agreement',
  'sla', 'master services agreement', 'msa', 'employment agreement', 'lease agreement',
  'covenant', 'arbitration', 'force majeure', 'warranties and representations'
];

const LEGAL_KEYWORDS = [
  'legal', 'court', 'statute', 'compliance', 'litigation', 'attorney', 'counsel',
  'affidavit', 'plaintiff', 'defendant', 'subpoena', 'regulatory', 'statutory',
  'ordinance', 'liability', 'lawsuit', 'deposition', 'jurisprudence', 'notary'
];

const ACADEMIC_KEYWORDS = [
  'academic', 'abstract', 'thesis', 'dissertation', 'journal', 'references',
  'bibliography', 'citation', 'doi', 'peer review', 'university', 'professor',
  'methodology', 'experiment', 'hypothesis', 'study', 'literature review',
  'ieee', 'acm', 'springer', 'arxiv', 'volume', 'issue', 'proceedings'
];

const REPORT_KEYWORDS = [
  'report', 'analysis', 'quarterly', 'annual report', 'executive summary',
  'performance review', 'evaluation', 'benchmark', 'audit', 'findings',
  'overview', 'kpi', 'key performance indicators', 'metrics', 'methodology',
  'conclusion', 'recommendations', 'forecast', 'projections', 'trend analysis',
  'financial results', 'market research', 'status report', 'feasibility study',
  'incident report', 'progress report', 'assessment', 'statistics', 'whitepaper'
];

/**
 * Strips HTML tags and collapses whitespace to extract clean plain text for keyword scanning
 */
function extractCleanText(rawContent: string): string {
  if (!rawContent) return '';
  return rawContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Automatically classifies a document as 'Invoices', 'Contracts', or 'Reports'
 * based on keyword frequency, title weight, and semantic triggers.
 */
export function classifyDocument(title: string = '', content: string = ''): ClassificationResult {
  const normalizedTitle = (title || '').toLowerCase();
  const cleanBody = extractCleanText(content);

  const scores: Record<DocumentCategory, number> = {
    Invoices: 0,
    Contracts: 0,
    Reports: 0,
    Legal: 0,
    Academic: 0,
    Invoice: 0,
    Contract: 0,
    Financial: 0,
    Technical: 0,
    General: 0,
  };

  const matchedKeywordsRecord: Record<DocumentCategory, string[]> = {
    Invoices: [],
    Contracts: [],
    Reports: [],
    Legal: [],
    Academic: [],
    Invoice: [],
    Contract: [],
    Financial: [],
    Technical: [],
    General: [],
  };

  // 1. Check Invoice Keywords
  for (const kw of INVOICE_KEYWORDS) {
    if (normalizedTitle.includes(kw)) {
      scores.Invoices += 5;
      if (!matchedKeywordsRecord.Invoices.includes(kw)) matchedKeywordsRecord.Invoices.push(kw);
    }
    if (cleanBody.includes(kw)) {
      scores.Invoices += 2;
      if (!matchedKeywordsRecord.Invoices.includes(kw)) matchedKeywordsRecord.Invoices.push(kw);
    }
  }

  // 2. Check Contract Keywords
  for (const kw of CONTRACT_KEYWORDS) {
    if (normalizedTitle.includes(kw)) {
      scores.Contracts += 5;
      if (!matchedKeywordsRecord.Contracts.includes(kw)) matchedKeywordsRecord.Contracts.push(kw);
    }
    if (cleanBody.includes(kw)) {
      scores.Contracts += 2;
      if (!matchedKeywordsRecord.Contracts.includes(kw)) matchedKeywordsRecord.Contracts.push(kw);
    }
  }

  // 3. Check Legal Keywords
  for (const kw of LEGAL_KEYWORDS) {
    if (normalizedTitle.includes(kw)) {
      scores.Legal += 5;
      if (!matchedKeywordsRecord.Legal.includes(kw)) matchedKeywordsRecord.Legal.push(kw);
    }
    if (cleanBody.includes(kw)) {
      scores.Legal += 2;
      if (!matchedKeywordsRecord.Legal.includes(kw)) matchedKeywordsRecord.Legal.push(kw);
    }
  }

  // 4. Check Academic Keywords
  for (const kw of ACADEMIC_KEYWORDS) {
    if (normalizedTitle.includes(kw)) {
      scores.Academic += 5;
      if (!matchedKeywordsRecord.Academic.includes(kw)) matchedKeywordsRecord.Academic.push(kw);
    }
    if (cleanBody.includes(kw)) {
      scores.Academic += 2;
      if (!matchedKeywordsRecord.Academic.includes(kw)) matchedKeywordsRecord.Academic.push(kw);
    }
  }

  // 5. Check Report Keywords
  for (const kw of REPORT_KEYWORDS) {
    if (normalizedTitle.includes(kw)) {
      scores.Reports += 5;
      if (!matchedKeywordsRecord.Reports.includes(kw)) matchedKeywordsRecord.Reports.push(kw);
    }
    if (cleanBody.includes(kw)) {
      scores.Reports += 2;
      if (!matchedKeywordsRecord.Reports.includes(kw)) matchedKeywordsRecord.Reports.push(kw);
    }
  }

  // Determine top category
  const categoriesToCheck: DocumentCategory[] = ['Invoices', 'Contracts', 'Legal', 'Academic', 'Reports'];
  let topCategory: DocumentCategory = 'General';
  let highestScore = 0;

  for (const cat of categoriesToCheck) {
    if (scores[cat] > highestScore) {
      highestScore = scores[cat];
      topCategory = cat;
    }
  }

  // If score is negligible, assign based on secondary structural hints
  if (highestScore < 3) {
    if (/\b(inv|bill|receipt|po|p\.o\.|invoice)\b/i.test(normalizedTitle)) {
      topCategory = 'Invoices';
      highestScore = 3;
    } else if (/\b(contract|agree|nda|sla|terms)\b/i.test(normalizedTitle)) {
      topCategory = 'Contracts';
      highestScore = 3;
    } else if (/\b(court|legal|statute|law|claim)\b/i.test(normalizedTitle)) {
      topCategory = 'Legal';
      highestScore = 3;
    } else if (/\b(thesis|paper|journal|abstract|academic)\b/i.test(normalizedTitle)) {
      topCategory = 'Academic';
      highestScore = 3;
    } else {
      topCategory = 'Reports';
    }
  }

  // Generate automated metadata tags array
  const tagsSet = new Set<string>();

  // Add primary category tag
  if (topCategory === 'Invoices') {
    tagsSet.add('Invoice');
    tagsSet.add('Financial');
  } else if (topCategory === 'Contracts') {
    tagsSet.add('Contract');
    tagsSet.add('Legal');
  } else if (topCategory === 'Legal') {
    tagsSet.add('Legal');
    tagsSet.add('Compliance');
  } else if (topCategory === 'Academic') {
    tagsSet.add('Academic');
    tagsSet.add('Research');
  } else if (topCategory === 'Reports') {
    tagsSet.add('Report');
    tagsSet.add('Analysis');
  }

  // Add secondary tags based on keyword hits
  if (scores.Invoices >= 2) tagsSet.add('Invoice');
  if (scores.Contracts >= 2) tagsSet.add('Contract');
  if (scores.Legal >= 2) tagsSet.add('Legal');
  if (scores.Academic >= 2) tagsSet.add('Academic');

  // Structural checks
  if (content.includes('<table') || content.includes('border-collapse')) {
    tagsSet.add('Tables');
  }

  const confidence = Math.min(100, Math.round((highestScore / 15) * 100));

  return {
    category: topCategory,
    tags: Array.from(tagsSet),
    confidence: Math.max(50, confidence),
    matchedKeywords: (matchedKeywordsRecord[topCategory] || []).slice(0, 5),
    scores,
  };
}

/**
 * Returns theme-compatible styling meta for category badges
 */
export function getCategoryBadgeStyle(category: DocumentCategory = 'Reports'): {
  label: string;
  bg: string;
  border: string;
  text: string;
  dotColor: string;
} {
  switch (category) {
    case 'Invoices':
    case 'Invoice':
      return {
        label: 'INVOICE',
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/50',
        text: 'text-amber-400',
        dotColor: 'bg-amber-400',
      };
    case 'Contracts':
    case 'Contract':
      return {
        label: 'CONTRACT',
        bg: 'bg-[#E056FD]/20',
        border: 'border-[#E056FD]/50',
        text: 'text-[#E056FD]',
        dotColor: 'bg-[#E056FD]',
      };
    case 'Legal':
      return {
        label: 'LEGAL',
        bg: 'bg-purple-950/40',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        dotColor: 'bg-purple-400',
      };
    case 'Academic':
      return {
        label: 'ACADEMIC',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        dotColor: 'bg-emerald-400',
      };
    case 'Reports':
    case 'Financial':
      return {
        label: 'REPORT',
        bg: 'bg-cyan-950/40',
        border: 'border-cyan-500/50',
        text: 'text-cyan-400',
        dotColor: 'bg-cyan-400',
      };
    default:
      return {
        label: 'GENERAL',
        bg: 'bg-neutral-900',
        border: 'border-neutral-700',
        text: 'text-neutral-300',
        dotColor: 'bg-neutral-400',
      };
  }
}
// ===== END NEW CODE: AUTOMATED DOCUMENT CATEGORIZATION ENGINE =====
