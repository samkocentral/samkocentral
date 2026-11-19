'use client';

import React, { useRef } from 'react';
import { UploadCloud, FileText, Eye, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * Safely opens any document URL (data URL, blob URL, or external link)
 * in a new browser tab. Converts data: URLs to blobs to prevent Chrome navigation blocks.
 */
export function openDocumentInNewTab(url?: string | null, name: string = 'Document') {
  if (typeof window === 'undefined') return;

  if (!url || url === '#' || url === '') {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${name}</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#0d1117;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;}div{text-align:center;padding:36px;border:1px solid #30363d;border-radius:16px;background:#161b22;box-shadow:0 20px 40px rgba(0,0,0,0.5);max-width:520px;}h2{color:#e8c97a;font-size:20px;margin-bottom:8px;}p{color:#8b949e;font-size:13px;line-height:1.5;}</style></head><body><div><h2>${name}</h2><p>Samko Central System Document Record.</p><p style="margin-top:16px;color:#64748b;font-size:11px;">Ref: Active Verified Record</p></div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    return;
  }

  // Handle data: URLs safely (bypasses Chrome "Not allowed to navigate top frame to data URL")
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      return;
    } catch (e) {
      console.warn('Failed to convert data URL to blob:', e);
      window.open(url, '_blank');
      return;
    }
  }

  window.open(url, '_blank');
}

export interface DocumentUploadFieldProps {
  label?: string;
  documentName?: string | null;
  documentUrl?: string | null;
  documentSize?: string | null;
  onUpload: (fileData: { name: string; url: string; size?: string; file?: File }) => void;
  onRemove: () => void;
  onView?: () => void;
  accept?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
}

export default function DocumentUploadField({
  label = 'Attach Document / Specification / Invoice (Optional)',
  documentName,
  documentUrl,
  documentSize,
  onUpload,
  onRemove,
  onView,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
  helperText = 'PDF, Word, Excel, or Images up to 25MB',
  className = '',
  disabled = false,
}: DocumentUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const size = `${(file.size / 1024).toFixed(0)} KB`;

    reader.onload = (event) => {
      const dataUrl = (event.target?.result as string) || URL.createObjectURL(file);
      onUpload({ name: file.name, url: dataUrl, size, file });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleView = () => {
    if (onView) {
      onView();
      return;
    }
    const targetUrl = documentUrl;
    openDocumentInNewTab(targetUrl, documentName || 'Document');
  };

  const hasDocument = Boolean(documentName || documentUrl);
  const displayName = documentName || (typeof documentUrl === 'string' ? documentUrl.split('/').pop() : 'Attached Document');
  const displaySize = documentSize || '1.0 MB';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}

      {hasDocument ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-surface2 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground truncate block" title={displayName}>
                  {displayName}
                </span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground flex-shrink-0">
                  {displaySize}
                </span>
              </div>
              <span className="text-[10.5px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={11} /> Attached & Ready
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* VIEW BUTTON */}
            <button
              type="button"
              onClick={handleView}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary text-foreground hover:text-primary bg-surface hover:bg-surface3 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              title="View / Open document in new tab"
            >
              <Eye size={13} className="text-primary" />
              <span>View</span>
            </button>

            {/* RE-UPLOAD / CHANGE BUTTON */}
            <label
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-amber-400 text-foreground hover:text-amber-400 bg-surface hover:bg-surface3 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 ${
                disabled ? 'opacity-50 pointer-events-none' : ''
              }`}
              title="Re-upload or replace this file"
            >
              <RefreshCw size={13} className="text-amber-400" />
              <span>Re-upload</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
              />
            </label>

            {/* DELETE / REMOVE BUTTON */}
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-500/25 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 bg-surface text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Delete / Remove attached document"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/60 bg-surface2/60 hover:bg-surface2 transition-all cursor-pointer group ${
            disabled ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface border border-border group-hover:border-primary/40 text-primary transition-colors flex-shrink-0">
              <UploadCloud size={16} />
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                Upload Document / Certificate
              </span>
              <span className="text-[10.5px] text-muted-foreground">{helperText}</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground group-hover:text-foreground bg-surface group-hover:border-primary/40 transition-colors">
            Browse File
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
        </label>
      )}
    </div>
  );
}
