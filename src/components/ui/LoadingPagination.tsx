'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';

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
  pageSize,
  pageSizeOptions = [5, 7, 10, 20],
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  recordName = 'records',
  className = '',
}: LoadingPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalRecords);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    pages.push(1);

    if (safePage > 3) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }

    if (safePage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`relative px-6 py-3.5 border-t border-border flex items-center justify-between gap-4 flex-wrap flex-shrink-0 transition-colors ${className}`}
      style={{ background: 'var(--surface)' }}
    >
      {/* Animated Loading Shimmer Bar on Top */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden z-20">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-[#e8c97a] to-transparent animate-pulse" />
        </div>
      )}

      {/* Left: Range and Record Count */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          {isLoading && <Loader2 size={13} className="animate-spin text-amber-400 flex-shrink-0" />}
          <span>
            Showing <strong className="text-foreground font-semibold">{startIndex}</strong> to{' '}
            <strong className="text-foreground font-semibold">{endIndex}</strong> of{' '}
            <strong className="text-foreground font-semibold">{totalRecords}</strong> {recordName}
          </span>
        </div>

        {/* Page Size Selector Pills */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/80">
            <span className="text-[11px] text-muted-foreground">Per page:</span>
            <div className="inline-flex items-center gap-1">
              {pageSizeOptions.map((opt) => {
                const isActive = pageSize === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onPageSizeChange(opt)}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer"
                    style={{
                      background: isActive ? 'rgba(232, 201, 122, 0.2)' : 'var(--surface2)',
                      color: isActive ? 'var(--primary)' : 'var(--text2)',
                      border: isActive
                        ? '1px solid rgba(232, 201, 122, 0.45)'
                        : '1px solid var(--border)',
                    }}
                    title={`Show ${opt} ${recordName} per page`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page */}
        <button
          type="button"
          disabled={safePage <= 1 || isLoading}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          disabled={safePage <= 1 || isLoading}
          onClick={() => onPageChange(safePage - 1)}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`${p}-${idx}`} className="px-1 text-xs text-muted-foreground select-none">
                  …
                </span>
              );
            }
            const isCurrent = p === safePage;
            return (
              <button
                key={p}
                type="button"
                disabled={isLoading && isCurrent}
                onClick={() => onPageChange(p)}
                className="min-w-7 h-7 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                style={{
                  background: isCurrent ? 'var(--primary)' : 'var(--surface2)',
                  color: isCurrent ? '#000' : 'var(--text2)',
                  border: isCurrent
                    ? '1px solid var(--primary)'
                    : '1px solid var(--border)',
                  boxShadow: isCurrent ? '0 1px 4px rgba(232, 201, 122, 0.25)' : 'none',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          disabled={safePage >= totalPages || isLoading}
          onClick={() => onPageChange(safePage + 1)}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          disabled={safePage >= totalPages || isLoading}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface2 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
