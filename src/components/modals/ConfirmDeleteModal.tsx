'use client';

import React from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemIdentifier?: string;
  itemName: string;
  registerName?: string;
  customWarning?: string;
  isDeleting?: boolean;
  confirmButtonText?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemIdentifier,
  itemName,
  registerName = 'register',
  customWarning,
  isDeleting = false,
  confirmButtonText = 'Delete Permanently',
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-foreground"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with warning icon and title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400 flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-head font-bold text-base text-foreground">{title}</h3>
              {itemIdentifier && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{itemIdentifier}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface2 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning text */}
        <p className="text-xs leading-relaxed text-muted-foreground mb-5">
          {customWarning || (
            <>
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground font-semibold">"{itemName}"</strong> from the{' '}
              {registerName}? This action cannot be undone.
            </>
          )}
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-surface2 transition-colors cursor-pointer"
            style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md shadow-rose-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 size={13} /> {confirmButtonText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

