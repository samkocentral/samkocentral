'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bot,
  Shield,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
  X,
  FileCheck,
  Lock,
  Layers,
} from 'lucide-react';
import { getDigitalBotLogs, AuditLogEntry } from '@/data/auditLogsData';

export default function DashboardBotAuditFeed() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'security' | 'sync' | 'compliance'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBotLogs = useCallback(() => {
    const botLogs = getDigitalBotLogs();
    setLogs(botLogs);
  }, []);

  useEffect(() => {
    loadBotLogs();
    const handleDataChanged = () => loadBotLogs();
    window.addEventListener('samko:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('samko:data-changed', handleDataChanged);
    };
  }, [loadBotLogs]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadBotLogs();
      setIsRefreshing(false);
    }, 350);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'security') return log.category === 'SECURITY';
    if (selectedFilter === 'sync') return log.category === 'USER_MANAGEMENT' || log.action === 'UPDATE';
    if (selectedFilter === 'compliance') return log.category === 'COMPLIANCE';
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SECURITY':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          text: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
          label: 'SECURITY',
        };
      case 'UPDATE':
        return {
          bg: 'rgba(232, 201, 122, 0.12)',
          text: '#e8c97a',
          border: 'rgba(232, 201, 122, 0.3)',
          label: 'SYSTEM SYNC',
        };
      case 'COMPLIANCE':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          text: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'COMPLIANCE',
        };
      default:
        return {
          bg: 'rgba(167, 139, 250, 0.12)',
          text: '#a78bfa',
          border: 'rgba(167, 139, 250, 0.3)',
          label: action,
        };
    }
  };

  return (
    <div className="samko-card flex flex-col" style={{ padding: '18px 20px', minHeight: 420 }}>
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-border flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm"
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              borderColor: 'rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
            }}
          >
            <Bot size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="font-head text-foreground"
                style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Digital Bot Audit Logs
              </h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Automated governance, security sweeps & system integrity events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            className="p-1.5 rounded-lg border border-border hover:bg-surface2 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Refresh Bot Audit Stream"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-primary' : ''} />
          </button>
          <Link
            href="/recent-logs?bot=true"
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline transition-colors"
          >
            <span>View all</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Bot Info & Filter Strip */}
      <div className="mb-3 flex items-center justify-between gap-2 p-2 rounded-xl border border-border bg-surface2/60 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
            BOT ID: DB-901
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            digitalbot@samkocentral.com · Daemon v3.2
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          {(['all', 'security', 'sync', 'compliance'] as const).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setSelectedFilter(filterKey)}
              className={`px-2 py-0.5 rounded-md font-medium capitalize transition-all cursor-pointer ${
                selectedFilter === filterKey
                  ? 'bg-primary text-black font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              {filterKey === 'all' ? 'All' : filterKey}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream List */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[300px] pr-1">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-muted-foreground">
            <CheckCircle2 size={24} className="text-emerald-400 mb-2 opacity-80" />
            <p className="text-xs font-semibold">No bot events match current filter</p>
            <p className="text-[11px] opacity-75 mt-0.5">All automated systems running nominally</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getActionBadge(log.action);
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="group flex flex-col p-2.5 rounded-xl border border-border/70 hover:border-[#38bdf8]/50 transition-all cursor-pointer hover:bg-surface2/80"
                style={{ background: 'var(--surface)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border"
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        borderColor: badge.border,
                      }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate group-hover:text-[#38bdf8] transition-colors">
                      {log.actionLabel || log.action}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {log.relativeTime}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {log.details}
                </p>

                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground/80">
                  <span className="truncate max-w-[220px]">
                    🎯 {log.resource}
                  </span>
                  <span className="flex items-center gap-0.5 text-[#38bdf8] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#38bdf8]/35 p-6 shadow-2xl space-y-4"
            style={{ background: '#11141a' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8]">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                      {selectedLog.id}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">
                      {selectedLog.actionLabel || selectedLog.action}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedLog.timestamp} ({selectedLog.relativeTime})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-surface2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-surface2/60">
                <p className="font-semibold text-foreground mb-1">Operational Event Summary</p>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg border border-border bg-surface">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    Service Actor
                  </span>
                  <span className="font-semibold text-foreground">Digital Bot (L1)</span>
                  <p className="text-[10px] text-muted-foreground truncate">{selectedLog.actorEmail}</p>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-surface">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    Daemon Agent
                  </span>
                  <span className="font-semibold text-foreground">{selectedLog.userAgent || 'DigitalBot-Daemon/3.2'}</span>
                  <p className="text-[10px] text-muted-foreground">Internal Daemon Loop</p>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-surface">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    IP & Routing
                  </span>
                  <span className="font-mono text-foreground">{selectedLog.ipAddress}</span>
                  <p className="text-[10px] text-muted-foreground">{selectedLog.location}</p>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-surface">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    Target Resource
                  </span>
                  <span className="font-semibold text-foreground truncate block">{selectedLog.resource}</span>
                  <p className="text-[10px] text-muted-foreground">{selectedLog.property || 'Portfolio-wide'}</p>
                </div>
              </div>

              {/* State Diff (if available) */}
              {selectedLog.diff && selectedLog.diff.length > 0 && (
                <div className="p-3 rounded-xl border border-border bg-surface space-y-1.5">
                  <p className="text-[11px] font-bold text-foreground">State Changes & Verifications</p>
                  {selectedLog.diff.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-border/40 last:border-0">
                      <span className="font-mono text-muted-foreground">{d.field}</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-rose-400/80">{d.previous}</span>
                        <span className="text-emerald-400 font-semibold">{d.current}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Link
                href="/recent-logs?bot=true"
                onClick={() => setSelectedLog(null)}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                Inspect in Full Audit Trail →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-surface2 hover:bg-surface border border-border text-xs font-semibold text-foreground cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

