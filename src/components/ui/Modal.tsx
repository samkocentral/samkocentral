'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, subtitle, children, width = 560 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="samko-card scale-in flex flex-col"
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between border-b border-border flex-shrink-0"
          style={{ padding: '18px 22px' }}
        >
          <div>
            <h2
              id="modal-title"
              className="font-head text-foreground"
              style={{ fontSize: 16, fontWeight: 700 }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground" style={{ fontSize: 12, marginTop: 3 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              width: 28,
              height: 28,
              background: 'var(--surface2)',
              color: 'var(--text2)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Close modal"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 22px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}