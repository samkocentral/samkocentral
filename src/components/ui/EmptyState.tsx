import React from 'react';
import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      <div
        className="flex items-center justify-center rounded-xl mb-4"
        style={{
          width: 52,
          height: 52,
          background: 'var(--surface2)',
          color: 'var(--text3)',
        }}
      >
        {icon ?? <FileSearch size={22} />}
      </div>
      <h3
        className="font-head text-foreground"
        style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}
      >
        {title}
      </h3>
      <p className="text-muted-foreground" style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>
        {description}
      </p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}