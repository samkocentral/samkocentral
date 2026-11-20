'use client';

import React from 'react';
import { Trash2, CheckSquare, X, ChevronDown } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onDeleteSelected?: () => void;
  isDeleting?: boolean;
  recordName?: string;
  typeOptions?: { value: string; label: string; count?: number }[];
  onSelectByType?: (type: string) => void;
  selectedTypeValue?: string;
  typePlaceholder?: string;
  extraActions?: React.ReactNode;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDeleteSelected,
  isDeleting = false,
  recordName = 'records',
  typeOptions,
  onSelectByType,
  selectedTypeValue = '',
  typePlaceholder = 'Select all of type...',
  extraActions,
}: BulkActionBarProps) {
  // Never render anything when no records are selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className="sticky bottom-4 z-40 mx-auto w-full max-w-4xl px-4 py-3 rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-200 flex items-center justify-between gap-3 flex-wrap backdrop-blur-md"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border-strong)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25), 0 0 0 1px var(--border)',
      }}
    >
      {/* Left: Selected counter and select/deselect buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#b4831f]/15 dark:bg-[#e8c97a]/15 border border-[#b4831f]/30 dark:border-[#e8c97a]/30 text-[#b4831f] dark:text-[#e8c97a] font-bold text-xs">
          <CheckSquare size={14} className="text-[#b4831f] dark:text-[#e8c97a]" />
          <span>
            {selectedCount} of {totalCount} {recordName} selected
          </span>
        </div>

        {onSelectAll && selectedCount < totalCount && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-[#b4831f] dark:text-[#e8c97a] hover:underline font-semibold cursor-pointer transition-colors"
          >
            Select All ({totalCount})
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <X size={12} />
          <span>Clear</span>
        </button>
      </div>

      {/* Right: Select By Type helper + Red Bulk Delete Button */}
      <div className="flex items-center gap-2.5 flex-wrap ml-auto">
        {typeOptions && typeOptions.length > 0 && onSelectByType && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Select by Type:
            </span>
            <div className="min-w-[170px]">
              <CustomDropdown
                size="sm"
                variant="surface"
                placeholder={typePlaceholder}
                value={selectedTypeValue}
                onChange={(val) => onSelectByType(String(val))}
                options={typeOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.count !== undefined ? `${opt.label} (${opt.count})` : opt.label,
                }))}
              />
            </div>
          </div>
        )}

        {extraActions}

        {onDeleteSelected && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={onDeleteSelected}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Delete ${selectedCount} selected ${recordName}`}
          >
            <Trash2 size={13} />
            <span>{isDeleting ? 'Deleting...' : `Delete Selected (${selectedCount})`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
