'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';

export interface LoadingPaginationProps {
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  recordName?: string;
  className?: string;
}

export default function LoadingPagination({
  currentPage,
  totalRecords,
  pageSize = 10,
  pageSizeOptions = [5, 10, 15, 20, 50],
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  recordName = 'records',
  className = '',
}: LoadingPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // Exact 1-based start and end indices of displayed items
  const startItem = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalRecords);

  // Only show dropdown when there are more than 10 records total
  const showPageSizeDropdown = Boolean(onPageSizeChange && totalRecords > 10);

  // Only show pagination buttons when there is more than 1 page
  const showPaginationControls = totalPages > 1;

  return (
    <div
      className={`relative px-4 sm:px-6 py-3 border-t border-border flex items-center justify-between gap-3 flex-wrap flex-shrink-0 transition-colors ${className}`}
      style={{ background: 'var(--surface)' }}
    >
      {/* Animated Loading Shimmer Bar on Top */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-[#e8c97a] to-transparent animate-pulse" />
        </div>
      )}

      {/* Left Area: Record range info and conditional Page Size Dropdown */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
          {isLoading && (
            <Loader2 size={13} className="animate-spin text-[#e8c97a] flex-shrink-0" />
          )}
          <span>
            {totalRecords === 0 ? (
              <>Showing 0 of 0 {recordName}</>
            ) : totalRecords <= pageSize ? (
              <>
                Showing <strong className="text-foreground font-semibold">{totalRecords}</strong> of{' '}
                <strong className="text-foreground font-semibold">{totalRecords}</strong> {recordName}
              </>
            ) : (
              <>
                Showing <strong className="text-foreground font-semibold">{startItem}–{endItem}</strong> of{' '}
                <strong className="text-foreground font-semibold">{totalRecords}</strong> {recordName}
              </>
            )}
          </span>
        </div>

        {/* Dynamic Page Size Dropdown (Only rendered when records exceed 10) */}
        {showPageSizeDropdown && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Rows per page:</span>
            <span className="sm:hidden">Rows:</span>
            <div className="relative">
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                disabled={isLoading}
                className="bg-surface2 text-foreground font-semibold text-xs rounded-lg px-2.5 py-1 border border-border hover:border-border-strong focus:outline-none focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
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
            className="p-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
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
            className="p-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Loading 3-dots OR Page X of Y Display (no 1 2 3 buttons) */}
          <div className="flex items-center justify-center min-w-[96px] px-2 py-1 select-none">
            {isLoading ? (
              <span className="flex items-center gap-1.5 py-1 px-2" title="Loading records...">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8c97a] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8c97a] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8c97a] animate-bounce" />
              </span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Page <strong className="text-foreground font-semibold">{safePage}</strong> of{' '}
                <strong className="text-foreground font-semibold">{totalPages}</strong>
              </span>
            )}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            disabled={safePage >= totalPages || isLoading}
            onClick={() => onPageChange(safePage + 1)}
            className="p-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            disabled={safePage >= totalPages || isLoading}
            onClick={() => onPageChange(totalPages)}
            className="p-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      ) : (
        /* Subtle single-page indicator when <= 1 page */
        <span className="text-xs text-muted-foreground/60 select-none">
          Page 1 of 1
        </span>
      )}
    </div>
  );
}
