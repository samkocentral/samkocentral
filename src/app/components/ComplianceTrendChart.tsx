'use client';

import React from 'react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar,  } from 'recharts';

interface TrendDataPoint {
  week: string;
  score: number;
  critical: number;
  warnings: number;
}

interface Props {
  data: TrendDataPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-lg"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border-strong)',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        minWidth: 160,
      }}
    >
      <div
        className="font-head text-muted-foreground mb-2"
        style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase' }}
      >
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={`tip-${i}`} className="flex items-center justify-between gap-4" style={{ marginBottom: 4 }}>
          <div className="flex items-center gap-1.5">
            <span
              className="rounded-full"
              style={{ width: 6, height: 6, background: p.color, display: 'inline-block' }}
            />
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>
              {p.name}
            </span>
          </div>
          <span className="text-foreground font-medium tabular-nums" style={{ fontSize: 12 }}>
            {p.name === 'Compliance %' ? `${p.value}%` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ComplianceTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: 'var(--text3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          domain={[60, 100]}
          tick={{ fill: 'var(--text3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 10]}
          tick={{ fill: 'var(--text3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="score"
          name="Compliance %"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#complianceGrad)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
        />
        <Bar
          yAxisId="right"
          dataKey="critical"
          name="Critical items"
          fill="var(--critical)"
          opacity={0.5}
          radius={[2, 2, 0, 0]}
          barSize={6}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}