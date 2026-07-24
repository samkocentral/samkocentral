import React from 'react';

type BadgeVariant = 'ok' | 'warning' | 'critical' | 'info' | 'maintenance' | 'low' | 'medium' | 'high';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

const VARIANT_CONFIG: Record<BadgeVariant, { bg: string; color: string; defaultLabel: string }> = {
  ok: { bg: 'var(--ok-bg)', color: 'var(--ok)', defaultLabel: 'Compliant' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning)', defaultLabel: 'Due Soon' },
  critical: { bg: 'var(--critical-bg)', color: 'var(--critical)', defaultLabel: 'Overdue' },
  info: { bg: 'var(--info-bg)', color: 'var(--info)', defaultLabel: 'Info' },
  maintenance: { bg: 'rgba(167,139,250,0.12)', color: 'var(--purple)', defaultLabel: 'Maintenance' },
  low: { bg: 'var(--ok-bg)', color: 'var(--ok)', defaultLabel: 'Low' },
  medium: { bg: 'var(--warning-bg)', color: 'var(--warning)', defaultLabel: 'Medium' },
  high: { bg: 'var(--critical-bg)', color: 'var(--critical)', defaultLabel: 'High' },
};

export default function StatusBadge({
  variant,
  label,
  showDot = true,
  size = 'md',
}: StatusBadgeProps) {
  const config = VARIANT_CONFIG[variant];
  const displayLabel = label ?? config.defaultLabel;

  return (
    <span
      className="status-badge"
      style={{
        background: config.bg,
        color: config.color,
        fontSize: size === 'sm' ? 10 : 11,
        padding: size === 'sm' ? '2px 7px' : '3px 9px',
      }}
    >
      {showDot && <span className="status-dot" />}
      {displayLabel}
    </span>
  );
}