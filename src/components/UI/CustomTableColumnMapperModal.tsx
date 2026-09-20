import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  Layers, 
  Check, 
  X, 
  RotateCcw, 
  Sparkles, 
  Edit3, 
  Columns,
  ArrowRight,
  Sliders,
  Type
} from 'lucide-react';
import { CyberButton } from '../common/CyberButton.tsx';
import { CyberBadge } from '../common/CyberBadge.tsx';
import { cyberAudio } from '../../utils/audioSynth.ts';

// ===== START NEW CODE: COMPLEX MULTI-PAGE TABLE & CUSTOM COLUMN MAPPER MODAL =====

export interface DetectedTableColumn {
  id: string;
  originalName: string;
  mappedName: string;
  sampleData?: string;
  isIncluded: boolean;
}

export interface DetectedTableSchema {
  id: string;
  title: string;
  pageSpan: string; // e.g. "Pages 2 - 4"
  rowCount: number;
  columns: DetectedTableColumn[];
}

interface CustomTableColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedTables: DetectedTableSchema[];
  onApplyMapping: (updatedTables: DetectedTableSchema[]) => void;
}

export const CustomTableColumnMapperModal: React.FC<CustomTableColumnMapperModalProps> = ({
  isOpen,
  onClose,
  detectedTables,
  onApplyMapping,
}) => {
  const [tables, setTables] = useState<DetectedTableSchema[]>(() => 
    detectedTables.length > 0
      ? JSON.parse(JSON.stringify(detectedTables))
      : [
          {
            id: 'tbl_multi_1',
            title: 'Complex Financial Ledger & Operational Metrics',
            pageSpan: 'Pages 1 - 3',
            rowCount: 24,
            columns: [
              { id: 'c1', originalName: 'Col_1_Date', mappedName: 'Transaction Date', sampleData: '2026-03-15', isIncluded: true },
              { id: 'c2', originalName: 'Col_2_RefVoucher', mappedName: 'Invoice / Voucher ID', sampleData: 'INV-94827', isIncluded: true },
              { id: 'c3', originalName: 'Col_3_DescItem', mappedName: 'Line Item Description', sampleData: 'Neural Cloud Transit Gateway', isIncluded: true },
              { id: 'c4', originalName: 'Col_4_QtyUnits', mappedName: 'Quantity', sampleData: '2', isIncluded: true },
              { id: 'c5', originalName: 'Col_5_RateUSD', mappedName: 'Unit Rate ($)', sampleData: '$1,200.00', isIncluded: true },
              { id: 'c6', originalName: 'Col_6_SubtotalUSD', mappedName: 'Total Payable ($)', sampleData: '$2,400.00', isIncluded: true },
            ],
          },
        ]
  );

  const [activeTableIdx, setActiveTableIdx] = useState(0);

  if (!isOpen) return null;

  const activeTable = tables[activeTableIdx] || tables[0];

  const handleColumnNameChange = (colId: string, newMappedName: string) => {
    setTables((prev) =>
      prev.map((tbl, idx) => {
        if (idx !== activeTableIdx) return tbl;
        return {
          ...tbl,
          columns: tbl.columns.map((c) => (c.id === colId ? { ...c, mappedName: newMappedName } : c)),
        };
      })
    );
  };

  const handleToggleColumn = (colId: string) => {
    cyberAudio.playCyberClick();
    setTables((prev) =>
      prev.map((tbl, idx) => {
        if (idx !== activeTableIdx) return tbl;
        return {
          ...tbl,
          columns: tbl.columns.map((c) => (c.id === colId ? { ...c, isIncluded: !c.isIncluded } : c)),
        };
      })
    );
  };

  const handleApplyTransform = (transformType: 'title_case' | 'uppercase' | 'snake_case' | 'reset') => {
    cyberAudio.playButtonAction();
    setTables((prev) =>
      prev.map((tbl, idx) => {
        if (idx !== activeTableIdx) return tbl;
        return {
          ...tbl,
          columns: tbl.columns.map((c) => {
            let mapped = c.mappedName;
            if (transformType === 'title_case') {
              mapped = c.originalName
                .replace(/[_\-]+/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase());
            } else if (transformType === 'uppercase') {
              mapped = c.mappedName.toUpperCase();
            } else if (transformType === 'snake_case') {
              mapped = c.mappedName.toLowerCase().replace(/\s+/g, '_');
            } else if (transformType === 'reset') {
              mapped = c.originalName;
            }
            return { ...c, mappedName: mapped };
          }),
        };
      })
    );
  };

  const handleSaveAndApply = () => {
    cyberAudio.playSuccessChime();
    onApplyMapping(tables);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#0A0A0E] border-2 border-[#FF003C] rounded-lg shadow-[0_0_30px_rgba(255,0,60,0.3)] flex flex-col max-h-[90vh] overflow-hidden text-neutral-200 font-mono">
        {/* Header */}
        <div className="bg-[#121218] border-b border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TableIcon className="w-5 h-5 text-[#FF003C]" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                <span>MULTI-PAGE TABLE COLUMN MAPPER</span>
                <CyberBadge label="EXTRACTION ENGINE" variant="purple" />
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Customize column header mappings & schema alignment before finalizing Google Doc conversion.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              cyberAudio.playCyberClick();
              onClose();
            }}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:border-[#FF003C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Table Selector Bar if multiple detected */}
        {tables.length > 1 && (
          <div className="bg-[#181820] border-b border-neutral-800 p-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] text-neutral-400 uppercase font-bold shrink-0">
              DETECTED TABLES ({tables.length}):
            </span>
            {tables.map((tbl, idx) => (
              <button
                key={tbl.id}
                onClick={() => {
                  setActiveTableIdx(idx);
                  cyberAudio.playCyberClick();
                }}
                className={`px-3 py-1 rounded text-xs font-bold shrink-0 transition-all ${
                  idx === activeTableIdx
                    ? 'bg-[#FF003C] text-white border border-[#FF003C]'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-700 hover:text-white'
                }`}
              >
                Table #{idx + 1} ({tbl.pageSpan})
              </button>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Active Table Details Metadata */}
          {activeTable && (
            <div className="bg-[#111116] border border-neutral-800 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-neutral-400 font-bold">TABLE TITLE: </span>
                <span className="text-white font-bold">{activeTable.title}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400 font-bold">{activeTable.pageSpan}</span>
                <span className="text-neutral-600">|</span>
                <span className="text-[#E056FD] font-bold">{activeTable.rowCount} ROWS</span>
                <span className="text-neutral-600">|</span>
                <span className="text-cyan-400 font-bold">{activeTable.columns.length} COLUMNS</span>
              </div>
            </div>
          )}

          {/* Preset Quick Transformations */}
          <div className="flex flex-wrap items-center gap-2 bg-neutral-950 p-2.5 rounded border border-neutral-800 text-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-[#E056FD]" />
              QUICK TRANSFORM PRESETS:
            </span>
            <button
              onClick={() => handleApplyTransform('title_case')}
              className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-[#FF003C] text-neutral-300 hover:text-white rounded text-[11px] font-mono"
            >
              Title Case
            </button>
            <button
              onClick={() => handleApplyTransform('uppercase')}
              className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-[#FF003C] text-neutral-300 hover:text-white rounded text-[11px] font-mono"
            >
              UPPERCASE
            </button>
            <button
              onClick={() => handleApplyTransform('snake_case')}
              className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-[#FF003C] text-neutral-300 hover:text-white rounded text-[11px] font-mono"
            >
              snake_case
            </button>
            <button
              onClick={() => handleApplyTransform('reset')}
              className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white rounded text-[11px] font-mono flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Column Mapping Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-neutral-400 px-2">
              <span className="col-span-1 text-center">USE</span>
              <span className="col-span-4">RAW EXTRACTED COLUMN</span>
              <span className="col-span-1 text-center">&rarr;</span>
              <span className="col-span-6">CUSTOM MAPPED GOOGLE DOC HEADER</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {activeTable?.columns.map((col) => (
                <div
                  key={col.id}
                  className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded border transition-all text-xs ${
                    col.isIncluded
                      ? 'bg-[#12121a] border-neutral-800 hover:border-neutral-700'
                      : 'bg-neutral-950/60 border-neutral-900 opacity-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="col-span-1 flex justify-center">
                    <input
                      type="checkbox"
                      checked={col.isIncluded}
                      onChange={() => handleToggleColumn(col.id)}
                      className="w-4 h-4 accent-[#FF003C] cursor-pointer"
                    />
                  </div>

                  {/* Raw Original Column Name & Sample Data */}
                  <div className="col-span-4 truncate">
                    <div className="font-bold text-neutral-300 truncate" title={col.originalName}>
                      {col.originalName}
                    </div>
                    {col.sampleData && (
                      <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                        Ex: {col.sampleData}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 flex justify-center text-neutral-500">
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF003C]" />
                  </div>

                  {/* Mapped Column Input */}
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={col.mappedName}
                      onChange={(e) => handleColumnNameChange(col.id, e.target.value)}
                      placeholder="Enter custom header name..."
                      className="w-full bg-black border border-neutral-700 focus:border-[#FF003C] text-white px-2.5 py-1.5 rounded text-xs outline-none font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#121218] border-t border-neutral-800 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white text-xs font-bold"
          >
            CANCEL
          </button>

          <CyberButton
            variant="primary"
            size="md"
            onClick={handleSaveAndApply}
            icon={<Check className="w-4 h-4" />}
          >
            APPLY CUSTOM COLUMN MAPPING
          </CyberButton>
        </div>
      </div>
    </div>
  );
};
// ===== END NEW CODE: COMPLEX MULTI-PAGE TABLE & CUSTOM COLUMN MAPPER MODAL =====
