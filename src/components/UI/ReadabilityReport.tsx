import React, { useMemo } from 'react';
import { 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  TrendingUp, 
  FileText,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { analyzeDocumentReadability } from '../../utils/readabilityAnalyzer.ts';
import { CyberBadge } from '../common/CyberBadge.tsx';

interface ReadabilityReportProps {
  content: string;
  documentTitle?: string;
}

// ===== START NEW CODE: AUTOMATED READABILITY ANALYSIS REPORT COMPONENT =====
export const ReadabilityReport: React.FC<ReadabilityReportProps> = ({ content, documentTitle }) => {
  const metrics = useMemo(() => analyzeDocumentReadability(content), [content]);

  // Color coding based on grade level
  const getGradeLevelColor = (grade: number) => {
    if (grade <= 6) return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30';
    if (grade <= 9) return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30';
    if (grade <= 12) return 'text-amber-400 border-amber-500/50 bg-amber-950/30';
    return 'text-[#FF003C] border-[#FF003C]/50 bg-rose-950/30';
  };

  const getEaseBadge = (ease: number) => {
    if (ease >= 70) return { label: 'HIGH READABILITY', variant: 'green' as const };
    if (ease >= 50) return { label: 'BALANCED', variant: 'cyan' as const };
    if (ease >= 30) return { label: 'TECHNICAL', variant: 'purple' as const };
    return { label: 'DENSE / COMPLEX', variant: 'red' as const };
  };

  const easeBadge = getEaseBadge(metrics.fleschReadingEase);

  return (
    <div className="bg-[#0A0A0D] border border-neutral-800 rounded-lg p-4 font-mono space-y-5 shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#FF003C]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            AUTOMATED READABILITY & LINGUISTIC ANALYSIS
          </span>
          <span className="text-neutral-500 text-[10px] hidden sm:inline">&bull; FLESCH-KINCAID PROTOCOL</span>
        </div>
        <div className="flex items-center gap-2">
          <CyberBadge label={easeBadge.label} variant={easeBadge.variant} />
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Flesch-Kincaid Grade Level */}
        <div className={`p-3.5 rounded border flex flex-col justify-between ${getGradeLevelColor(metrics.fleschKincaidGradeLevel)}`}>
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              FLESCH-KINCAID GRADE
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-white">
                {metrics.fleschKincaidGradeLevel.toFixed(1)}
              </span>
              <span className="text-xs text-neutral-400 uppercase font-semibold">
                GRADE LEVEL
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-300 mt-2 font-semibold">
            {metrics.readingLevelLabel}
          </p>
        </div>

        {/* Card 2: Flesch Reading Ease Score */}
        <div className="p-3.5 rounded border border-neutral-800 bg-neutral-950 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              FLESCH READING EASE
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-400">
                {metrics.fleschReadingEase}
              </span>
              <span className="text-xs text-neutral-500 font-semibold">/ 100</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-neutral-900 rounded-full h-1.5 mt-2 overflow-hidden border border-neutral-800">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${metrics.fleschReadingEase}%`,
                backgroundColor: metrics.fleschReadingEase >= 60 ? '#10b981' : metrics.fleschReadingEase >= 40 ? '#06b6d4' : '#FF003C'
              }}
            />
          </div>
        </div>

        {/* Card 3: Syntactic Density */}
        <div className="p-3.5 rounded border border-neutral-800 bg-neutral-950 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            SYNTACTIC STRUCTURE
          </span>
          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
            <div>
              <span className="text-neutral-500 text-[10px] block">AVG WORDS / SENTENCE</span>
              <span className="text-white font-bold text-sm">{metrics.avgSentenceLength}</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block">COMPLEX WORDS (3+ SYL)</span>
              <span className="text-[#E056FD] font-bold text-sm">
                {metrics.complexWordsPercentage}%
              </span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 mt-2">
            {metrics.totalWords} words &bull; {metrics.totalSentences} sentences
          </span>
        </div>
      </div>

      {/* Narrative Linguistic Interpretation */}
      <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded text-xs text-neutral-300 flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-white font-bold block mb-0.5">READING COGNITION ASSESSMENT:</span>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            {metrics.interpretation}
          </p>
        </div>
      </div>

      {/* Complex Phrasing Detected Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF003C]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              POTENTIAL COMPLEX PHRASING DETECTED ({metrics.complexPhrases.length})
            </span>
          </div>
          <span className="text-[10px] text-neutral-500">
            PLAIN LANGUAGE GUIDELINE RULES
          </span>
        </div>

        {metrics.complexPhrases.length === 0 ? (
          <div className="p-4 rounded border border-emerald-500/30 bg-emerald-950/20 text-center flex items-center justify-center gap-2 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">
              ZERO COMPLEX PHRASING DETECTED &mdash; DOCUMENT CONFORMS TO PLAIN-LANGUAGE CADENCE
            </span>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {metrics.complexPhrases.map((item, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded transition-all text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-red-950/50 border border-red-500/40 text-[#FF003C] rounded text-[9px] uppercase font-bold tracking-wider">
                      {item.category}
                    </span>
                    <span className="font-bold text-[#FF003C] line-through decoration-[#FF003C]/70">
                      &ldquo;{item.phrase}&rdquo;
                    </span>
                    <ArrowRight className="w-3 h-3 text-neutral-500" />
                    <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      &ldquo;{item.suggestion}&rdquo;
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400">
                  {item.explanation}
                </p>

                {item.contextSnippet && (
                  <div className="text-[10px] font-mono text-neutral-500 bg-black/60 p-1.5 rounded border border-neutral-900 truncate">
                    <span className="text-neutral-600 mr-1">CONTEXT:</span>
                    <span className="text-neutral-400">{item.contextSnippet}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
// ===== END NEW CODE: AUTOMATED READABILITY ANALYSIS REPORT COMPONENT =====
