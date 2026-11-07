'use client';

import React from 'react';
import { Trash2, X, CheckSquare, Layers, AlertTriangle } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export interface TypeOption {
  label: string;
  value: string;
  count?: number;
}

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onDeleteSelected: () => void;
  typeOptions?: TypeOption[];
  onSelectByType?: (typeValue: string) => void;
  selectedTypeValue?: string;
  typePlaceholder?: string;
  recordName?: string;
  isDeleting?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDeleteSelected,
  typeOptions,
  onSelectByType,
  selectedTypeValue = '',
  typePlaceholder = 'Select all by Type...',
  recordName = 'records',
  isDeleting = false,
}: BulkActionBarProps) {
  // Never render anything when no records are selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className="sticky bottom-4 z-40 mx-auto w-full max-w-4xl px-4 py-3 rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-200 flex items-center justify-between gap-3 flex-wrap backdrop-blur-md"
      style={{
        background: 'rgba(22, 26, 34, 0.96)',
        borderColor: 'rgba(232, 201, 122, 0.35)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.85), 0 0 0 1px rgba(232, 201, 122, 0.15)',
      }}
    >
      {/* Left: Selected counter and select/deselect buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#e8c97a]/15 border border-[#e8c97a]/30 text-[#e8c97a] font-bold text-xs">
          <CheckSquare size={14} className="text-[#e8c97a]" />
          <span>
            {selectedCount} of {totalCount} {recordName} selected
          </span>
        </div>

        {onSelectAll && selectedCount < totalCount && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-[#e8c97a] hover:underline font-semibold cursor-pointer transition-colors"
          >
            Select All ({totalCount})
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <X size={13} />
          <span>Deselect All</span>
        </button>
      </div>

      {/* Right: Select By Type helper + Red Bulk Delete Button */}
      <div className="flex items-center gap-2.5 flex-wrap ml-auto">
        {typeOptions && typeOptions.length > 0 && onSelectByType && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Select by Type:</span>
            <div className="min-w-[170px]">
              <CustomDropdown
                value={selectedTypeValue}
                onChange={(val) => onSelectByType(val)}
                options={typeOptions.map((t) => ({
                  value: t.value,
                  label: `${t.label}${t.count !== undefined ? ` (${t.count})` : ''}`,
                }))}
                placeholder={typePlaceholder}
                variant="form"
                size="sm"
                showAllOption={false}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={isDeleting}
          onClick={onDeleteSelected}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Delete ${selectedCount} selected ${recordName}`}
        >
          <Trash2 size={13} strokeWidth={2.5} />
          <span>Delete Selected ({selectedCount})</span>
        </button>
      </div>
    </div>
  );
}
