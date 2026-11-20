'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export interface LoadingPaginationProps {
  currentPage: number;
  totalPages?: number;
  totalRecords: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  recordName?: string;
  className?: string;
}

export default function LoadingPagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  recordName = 'records',
  className = '',
}: LoadingPaginationProps) {
  const derivedTotalPages =
    totalPages !== undefined
      ? totalPages
      : Math.max(1, Math.ceil(totalRecords / (pageSize || 10)));
  const safePage = Math.max(1, Math.min(currentPage, derivedTotalPages || 1));
  const startItem = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalRecords);

  // Show page size dropdown if total records exceed the minimum page size option
  const showPageSizeDropdown = totalRecords > (pageSizeOptions[0] || 10);

  // Only show pagination buttons when there is more than 1 page
  const showPaginationControls = derivedTotalPages > 1;

  return (
    <div
      className={`relative px-4 sm:px-6 py-3 border-t border-border flex items-center justify-between gap-3 flex-wrap flex-shrink-0 transition-colors ${className}`}
      style={{ background: 'var(--surface)' }}
    >
      {/* Animated Loading Shimmer Bar on Top */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-[#b4831f] dark:via-[#e8c97a] to-transparent animate-pulse" />
        </div>
      )}

      {/* Left Area: Record range info and conditional Page Size Dropdown */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-muted-foreground select-none">
          {isLoading && (
            <Loader2 size={13} className="animate-spin text-[#b4831f] dark:text-[#e8c97a] flex-shrink-0" />
          )}
          <span>
            {totalRecords === 0 ? (
              <>Showing 0 of 0 {recordName}</>
            ) : totalRecords <= pageSize ? (
              <>
                Showing <strong className="text-slate-900 dark:text-foreground font-bold">{totalRecords}</strong> of{' '}
                <strong className="text-slate-900 dark:text-foreground font-bold">{totalRecords}</strong>{' '}
                {recordName}
              </>
            ) : (
              <>
                Showing{' '}
                <strong className="text-slate-900 dark:text-foreground font-bold">
                  {startItem}–{endItem}
                </strong>{' '}
                of <strong className="text-slate-900 dark:text-foreground font-bold">{totalRecords}</strong>{' '}
                {recordName}
              </>
            )}
          </span>
        </div>

        {/* Dynamic Page Size Dropdown (Only rendered when records exceed 10) */}
        {showPageSizeDropdown && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-muted-foreground">
            <span className="hidden sm:inline">Rows per page:</span>
            <span className="sm:hidden">Rows:</span>
            <CustomDropdown
              size="sm"
              variant="surface"
              disabled={isLoading}
              value={String(pageSize)}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={pageSizeOptions.map((opt) => ({ value: String(opt), label: String(opt) }))}
            />
          </div>
        )}
      </div>

      {/* Right Area: Dynamic Pagination Controls (Only rendered when more than 1 page) */}
      {showPaginationControls ? (
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* First Page Button */}
          <button
            type="button"
            disabled={safePage <= 1 || isLoading}
            onClick={() => onPageChange(1)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-border text-xs text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-xs"
            title="First Page"
            aria-label="First Page"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            disabled={safePage <= 1 || isLoading}
            onClick={() => onPageChange(safePage - 1)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-border text-xs text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-xs"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Loading 3-dots OR Page X of Y Display */}
          <div className="flex items-center justify-center min-w-[96px] px-2 py-1 select-none">
            {isLoading ? (
              <span className="flex items-center gap-1.5 py-1 px-2" title="Loading records...">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b4831f] dark:bg-[#e8c97a] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#b4831f] dark:bg-[#e8c97a] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#b4831f] dark:bg-[#e8c97a] animate-bounce" />
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-600 dark:text-muted-foreground whitespace-nowrap">
                Page <strong className="text-slate-900 dark:text-foreground font-bold">{safePage}</strong> of{' '}
                <strong className="text-slate-900 dark:text-foreground font-bold">{derivedTotalPages}</strong>
              </span>
            )}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            disabled={safePage >= derivedTotalPages || isLoading}
            onClick={() => onPageChange(safePage + 1)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-border text-xs text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-xs"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            disabled={safePage >= derivedTotalPages || isLoading}
            onClick={() => onPageChange(derivedTotalPages)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-border text-xs text-slate-700 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-xs"
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      ) : (
        /* Single-page indicator when <= 1 page */
        <span className="text-xs font-semibold text-slate-600 dark:text-muted-foreground select-none">
          Page 1 of 1
        </span>
      )}
    </div>
  );
}
