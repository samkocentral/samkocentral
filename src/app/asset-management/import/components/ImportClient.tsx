'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Download, Eye } from 'lucide-react';
import { HOTELS } from '@/lib/assetData';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: 'Upload Excel' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'Map Columns' },
  { id: 4, label: 'Validate' },
  { id: 5, label: 'Import' },
];

const SAMPLE_COLUMNS = ['Asset ID', 'Asset Name', 'Category', 'Department', 'Location', 'Floor', 'Quantity', 'Unit', 'Condition', 'Maintenance Schedule', 'Notes'];

const SYSTEM_FIELDS = [
  'assetId', 'name', 'category', 'department', 'location', 'floor',
  'quantity', 'unit', 'condition', 'maintenanceSchedule', 'notes',
  'manufacturer', 'model', 'serialNumber', 'purchaseDate', 'warrantyExpiry',
  'responsibleRole', 'responsibleUser', 'riskLevel', 'status',
];

export default function ImportClient() {
  const [step, setStep] = useState<Step>(1);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [selectedHotel, setSelectedHotel] = useState('');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setStep(2);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setStep(2);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-border flex-shrink-0" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="font-head text-xl font-bold">Import / Export</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Excel Import Wizard & Data Export</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-border"
          style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
        >
          <Download size={15} />
          Export Asset Register
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                  style={{
                    background: step === s.id ? 'var(--primary)' : step > s.id ? 'rgba(61,214,140,0.2)' : 'var(--surface2)',
                    color: step === s.id ? '#000' : step > s.id ? '#3dd68c' : 'var(--text2)',
                    border: step > s.id ? '1px solid #3dd68c' : '1px solid var(--border)',
                  }}
                >
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <span
                  className="text-sm font-medium hidden sm:block"
                  style={{ color: step === s.id ? 'var(--foreground)' : 'var(--text2)' }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-3"
                  style={{ background: step > s.id ? '#3dd68c' : 'var(--border)', minWidth: 20 }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div
              className="rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer"
              style={{
                borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
                background: dragOver ? 'rgba(232,201,122,0.04)' : 'var(--surface)',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(232,201,122,0.12)' }}>
                <FileSpreadsheet size={32} style={{ color: '#e8c97a' }} />
              </div>
              <h3 className="font-head font-bold text-lg mb-2">Upload Excel Workbook</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Drag & drop your .xlsx or .xls file here, or click to browse
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: 'var(--primary)', color: '#000' }}>
                <Upload size={16} />
                Choose File
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
              </label>
              <p className="text-xs text-muted-foreground mt-4">Supported: .xlsx, .xls, .csv — Max 50MB</p>
            </div>

            {/* Info */}
            <div className="mt-6 rounded-xl border border-border p-5" style={{ background: 'var(--surface)' }}>
              <h4 className="font-head font-bold text-sm mb-3">Import Guidelines</h4>
              <div className="space-y-2">
                {[
                  'Duplicate Asset IDs will update existing records instead of creating duplicates',
                  'Required columns: Asset ID, Asset Name, Category, Department',
                  'Dates should be in DD/MM/YYYY or YYYY-MM-DD format',
                  'Maintenance frequency: monthly, quarterly, 6-monthly, yearly',
                  'Condition values: excellent, good, fair, poor, critical',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#3dd68c' }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-border p-5 mb-5" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(61,214,140,0.12)' }}>
                  <FileSpreadsheet size={20} style={{ color: '#3dd68c' }} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{fileName}</div>
                  <div className="text-xs text-muted-foreground">File uploaded successfully</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(61,214,140,0.12)', color: '#3dd68c' }}>
                  <CheckCircle2 size={11} /> Ready
                </span>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Assign to Hotel</label>
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg border border-border outline-none w-full max-w-sm"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                >
                  <option value="">Select Hotel…</option>
                  {HOTELS.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Detected <strong style={{ color: 'var(--foreground)' }}>11 columns</strong> and approximately <strong style={{ color: 'var(--foreground)' }}>50+ rows</strong> of data.
              </p>
            </div>

            {/* Sample preview table */}
            <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--surface)' }}>
              <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                <Eye size={14} className="text-muted-foreground" />
                <span className="text-sm font-semibold">Data Preview (first 5 rows)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {SAMPLE_COLUMNS.map((c) => (
                        <th key={c} className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground px-4 py-2.5 border-b border-border whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['FA-001', 'Bed Bases', 'Furniture & Joinery', 'Housekeeping', 'Guest Rooms', 'All Floors', '240', 'Each', 'Good', 'Monthly', ''],
                      ['FA-002', 'Mattresses', 'Furniture & Joinery', 'Housekeeping', 'Guest Rooms', 'All Floors', '240', 'Each', 'Good', 'Monthly', ''],
                      ['FA-020', 'Fire Alarm Detectors', 'Fire Safety', 'Maintenance', 'Guest Rooms', 'All Floors', '120', 'Each', 'Good', '6-Monthly', 'Weekly user test'],
                      ['PE-001', 'Boiler System', 'Plant Equipment', 'Engineering', 'Plant Room', 'Basement', '2', 'Each', 'Good', 'Yearly', 'Annual statutory'],
                      ['REST-001', 'Commercial Oven', 'Kitchen Equipment', 'Kitchen', 'Main Kitchen', 'Ground Floor', '4', 'Each', 'Good', '6-Monthly', ''],
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: j === 0 ? 'var(--primary)' : 'var(--foreground)' }}>
                            {cell || <span className="text-muted-foreground">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--primary)', color: '#000' }}
              >
                Continue to Column Mapping <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Map Columns */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-border p-5 mb-5" style={{ background: 'var(--surface)' }}>
              <h3 className="font-head font-bold text-sm mb-4">Map Excel Columns to System Fields</h3>
              <div className="space-y-3">
                {SAMPLE_COLUMNS.map((col) => (
                  <div key={col} className="flex items-center gap-4">
                    <div className="flex-1 text-sm font-medium">{col}</div>
                    <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                    <select
                      value={mapping[col] || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-border outline-none"
                      style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                    >
                      <option value="">— Skip —</option>
                      {SYSTEM_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                Back
              </button>
              <button onClick={() => setStep(4)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                Validate Data <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Validate */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-border p-5 mb-5" style={{ background: 'var(--surface)' }}>
              <h3 className="font-head font-bold text-sm mb-4">Validation Results</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)' }}>
                  <CheckCircle2 size={16} style={{ color: '#3dd68c' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#3dd68c' }}>48 records ready to import</div>
                    <div className="text-xs text-muted-foreground">All required fields present</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#f59e0b' }}>3 records will update existing assets</div>
                    <div className="text-xs text-muted-foreground">Duplicate Asset IDs detected: FA-001, FA-002, PE-001</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <CheckCircle2 size={16} style={{ color: '#60a5fa' }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#60a5fa' }}>0 validation errors</div>
                    <div className="text-xs text-muted-foreground">All data formats are valid</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                Back
              </button>
              <button onClick={() => setStep(5)} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: '#000' }}>
                Import 48 Records <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 5 && (
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(61,214,140,0.12)' }}>
              <CheckCircle2 size={40} style={{ color: '#3dd68c' }} />
            </div>
            <h3 className="font-head font-bold text-2xl mb-2">Import Complete!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              48 assets imported successfully. 3 existing records updated.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Imported', value: '48', color: '#3dd68c' },
                { label: 'Updated', value: '3', color: '#f59e0b' },
                { label: 'Errors', value: '0', color: '#60a5fa' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border p-4" style={{ background: 'var(--surface)' }}>
                  <div className="font-head font-bold text-2xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-border"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              Import Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
