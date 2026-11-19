'use client';

import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { openDocumentInNewTab } from '@/components/ui/DocumentUploadField';

interface DocumentTableCellProps {
  documentName?: string | null;
  documentUrl?: string | null;
  fallbackText?: string;
  className?: string;
  onView?: () => void;
}

export default function DocumentTableCell({
  documentName,
  documentUrl,
  fallbackText = '—',
  className = '',
  onView,
}: DocumentTableCellProps) {
  const hasDoc = Boolean(documentName || documentUrl);

  if (!hasDoc) {
    return (
      <span className={`text-muted-foreground/60 font-mono text-xs select-none ${className}`}>
        {fallbackText}
      </span>
    );
  }

  const displayName =
    documentName || (typeof documentUrl === 'string' ? documentUrl.split('/').pop() : 'Document');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      e.preventDefault();
      onView();
      return;
    }
    if (documentUrl) {
      e.preventDefault();
      openDocumentInNewTab(documentUrl, displayName || 'Document');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/25 text-[11px] font-semibold transition-all max-w-[140px] group cursor-pointer ${className}`}
      title={typeof displayName === 'string' ? `Click to View / Open: ${displayName}` : 'View Document'}
    >
      <FileText size={11} className="flex-shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
      <span className="truncate">{displayName}</span>
      <ExternalLink size={10} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
    </button>
  );
}
