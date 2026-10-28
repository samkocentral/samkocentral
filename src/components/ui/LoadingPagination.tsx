'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

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
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  recordName = 'records',
  className = '',
}: LoadingPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // How many items are shown on the current page
  const displayedCount =
    totalRecords === 0
      ? 0
      : safePage === totalPages
      ? totalRecords - (safePage - 1) * pageSize
      : Math.min(pageSize, totalRecords);

  return (
    <div
      className={`relative px-6 py-3.5 border-t border-border flex items-center justify-between gap-4 flex-wrap flex-shrink-0 transition-colors ${className}`}
      style={{ background: 'var(--surface)' }}
    >
      {/* Animated Loading Shimmer Bar on Top */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-[#e8c97a] to-transparent animate-pulse" />
        </div>
      )}

      {/* Left: Showing X of Y items */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        {isLoading && (
          <Loader2 size={13} className="animate-spin text-[#e8c97a] flex-shrink-0" />
        )}
        <span>
          Showing {displayedCount} of {totalRecords} {recordName}
        </span>
      </div>

      {/* Right: < Page X of Y > Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous Page Button */}
        <button
          type="button"
          disabled={safePage <= 1 || isLoading}
          onClick={() => onPageChange(safePage - 1)}
          className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Current Page of Total */}
        <span className="text-xs font-bold text-foreground px-2 select-none tracking-wide">
          Page {safePage} of {totalPages}
        </span>

        {/* Next Page Button */}
        <button
          type="button"
          disabled={safePage >= totalPages || isLoading}
          onClick={() => onPageChange(safePage + 1)}
          className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.03)' }}
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
