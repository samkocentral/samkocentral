'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Plus } from 'lucide-react';
import { ALERTS } from '@/lib/mockData';

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    setCriticalCount(ALERTS.filter((a) => a.type === 'critical').length);
    setWarningCount(ALERTS.filter((a) => a.type === 'warning').length);

    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="flex items-center gap-4 border-b border-border flex-shrink-0"
      style={{ padding: '0 28px', height: 60, background: 'var(--card)' }}
    >
      <div className="flex-1 min-w-0">
        <h1
          className="font-head text-foreground truncate"
          style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground truncate" style={{ fontSize: 11, marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {criticalCount > 0 && (
          <span
            className="status-badge"
            style={{
              background: 'var(--critical-bg)',
              color: 'var(--critical)',
              fontSize: 11,
              opacity: pulse ? 1 : 0.65,
              transition: 'opacity 0.4s ease',
            }}
          >
            <span className="status-dot" />
            {criticalCount} critical
          </span>
        )}
        {warningCount > 0 && (
          <span
            className="status-badge"
            style={{
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              fontSize: 11,
            }}
          >
            <span className="status-dot" />
            {warningCount} warnings
          </span>
        )}

        {actions}

        <button
          className="samko-btn-ghost flex items-center gap-2"
          style={{ padding: '6px 14px', fontSize: 12 }}
        >
          <Upload size={13} />
          Upload Doc
        </button>
        <button
          className="samko-btn-primary flex items-center gap-2"
          style={{ padding: '6px 14px', fontSize: 12 }}
        >
          <Plus size={13} />
          Add Item
        </button>
      </div>
    </header>
  );
}