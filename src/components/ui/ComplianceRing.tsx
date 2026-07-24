import React from 'react';

interface ComplianceRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export default function ComplianceRing({ value, size = 64, strokeWidth = 6 }: ComplianceRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  const color = value >= 90 ? 'var(--ok)' : value >= 70 ? 'var(--warning)' : 'var(--critical)';
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          className="ring-fill-transition"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-head tabular-nums"
        style={{ color, fontSize: size > 56 ? 13 : 11, fontWeight: 800 }}
      >
        {value}%
      </div>
    </div>
  );
}