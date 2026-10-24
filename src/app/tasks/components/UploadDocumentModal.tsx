'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, Building2, Tag } from 'lucide-react';
import { TASK_PROPERTIES } from '@/data/tasksData';
import { toast } from 'sonner';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProperty?: string;
}

export default function UploadDocumentModal({
  isOpen,
  onClose,
  defaultProperty,
}: UploadDocumentModalProps) {
  const [property, setProperty] = useState(
    defaultProperty && defaultProperty !== 'ALL' ? defaultProperty : 'Crowne Plaza Kingston-South'
  );
  const [category, setCategory] = useState('Gas Safety');
  const [docTitle, setDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !docTitle) {
      toast.error('Please select a file or provide a title');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
      toast.success('Document uploaded successfully', {
        description: `"${docTitle || selectedFile?.name}" archived to ${property}`,
      });
      setSelectedFile(null);
      setDocTitle('');
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all text-foreground"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border-strong)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                background: 'rgba(232,201,122,0.15)',
                color: 'var(--primary)',
                borderColor: 'rgba(232,201,122,0.3)',
              }}
            >
              <UploadCloud size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Upload Document</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Attach proof of compliance, certificate, or maintenance invoice
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface3 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpload}>
          <div className="p-5 space-y-4">
            {/* Property */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-primary" />
                <span>Property</span>
              </label>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all cursor-pointer"
              >
                {TASK_PROPERTIES.map((prop) => (
                  <option key={prop} value={prop}>
                    {prop}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-primary" />
                <span>Document Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all cursor-pointer"
              >
                <option value="Gas Safety">Gas Safety (CP12)</option>
                <option value="Electrical">Electrical (EICR / PAT)</option>
                <option value="Fire Safety">Fire Safety & Risk Assessment</option>
                <option value="Water Hygiene">Water Hygiene / Legionella</option>
                <option value="LOLER Lifts">Lifts & Lifting (LOLER)</option>
                <option value="Maintenance Sign-off">Maintenance Sign-off Sheet</option>
              </select>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText size={13} className="text-primary" />
                <span>Document Name / Reference</span>
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. CP12 Certificate - 2026 British Gas"
                className="w-full text-xs rounded-lg px-3.5 py-2.5 bg-surface2 text-foreground border border-border focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Select File
              </label>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-surface2/50 hover:bg-surface2 transition-all">
                <UploadCloud size={28} className="text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  PDF, XLSX, DOCX, or PNG (up to 25MB)
                </span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-4 border-t flex items-center justify-end gap-2.5"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="samko-btn-ghost"
              style={{ padding: '7px 16px', fontSize: 12 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="samko-btn-primary flex items-center gap-1.5"
              style={{
                padding: '7px 20px',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 2px 10px rgba(232,201,122,0.25)',
              }}
            >
              <UploadCloud size={14} />
              <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
