'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, AlertTriangle, Info, Sparkles, Trash2, ExternalLink, Shield, Radio } from 'lucide-react';
import Link from 'next/link';
import { useDeepPageCms } from '@/lib/deepPageCms';
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  deleteNotification,
  triggerSimulatedAlarm,
  formatRelativeTime,
  type AppNotification,
} from '@/lib/notifications';

export default function DashboardAlertFeed() {
  const cms = useDeepPageCms('overview');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const syncNotifications = useCallback(() => {
    const list = getNotifications();
    setNotifications(list);
  }, []);

  useEffect(() => {
    syncNotifications();
    window.addEventListener('samko:notifications-updated', syncNotifications);
    window.addEventListener('samko:data-changed', syncNotifications);
    window.addEventListener('storage', syncNotifications);

    return () => {
      window.removeEventListener('samko:notifications-updated', syncNotifications);
      window.removeEventListener('samko:data-changed', syncNotifications);
      window.removeEventListener('storage', syncNotifications);
    };
  }, [syncNotifications]);

  const critList = notifications.filter((n) => n.type === 'critical');
  const warnList = notifications.filter((n) => n.type === 'warning');

  const filtered = notifications.filter((n) => {
    if (filter === 'critical') return n.type === 'critical';
    if (filter === 'warning') return n.type === 'warning';
    return true;
  });

  const title = cms.sections?.liveAlerts?.title || 'Live Alerts';

  return (
    <div className="samko-card flex flex-col" style={{ padding: '18px 20px', minHeight: 420 }}>
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-border flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <h2
            className="font-head text-foreground flex items-center gap-2"
            style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            <span>{title}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {notifications.length} Active
            </span>
          </h2>
        </div>

        {/* Toolbar: Simulate button + View all link */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerSimulatedAlarm()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer active:scale-95"
            title="Simulate incoming live facility alarm in real time"
          >
            <Sparkles size={11} className="text-amber-400" />
            <span>Simulate Alarm</span>
          </button>

          <Link
            href="/compliance-tracker"
            style={{ fontSize: 11, color: 'var(--primary)', textDecoration: 'none' }}
            className="hover:underline font-semibold"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
        {(
          [
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'critical', label: '🚨 Critical', count: critList.length },
            { key: 'warning', label: '⚠️ Warnings', count: warnList.length },
          ] as const
        ).map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                background: isActive ? 'var(--surface3)' : 'var(--surface2)',
                color: isActive ? 'var(--primary)' : 'var(--text2)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
              }}
            >
              <span>{tab.label}</span>
              <span
                className="px-1.5 py-0.2 rounded-full text-[9px] font-black"
                style={{
                  background: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? '#000' : 'var(--muted-foreground)',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Notifications List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[340px]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center text-muted-foreground">
            <Shield size={32} className="text-emerald-500/70 mb-2" />
            <p className="text-xs font-bold text-foreground">No Alarms in This View</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              All building systems operational. Dynamic notifications will appear here.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isCrit = item.type === 'critical';
            const isWarn = item.type === 'warning';

            return (
              <div
                key={item.id}
                className={`relative flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                  item.read ? 'bg-surface/50 border-border opacity-80 hover:opacity-100' : 'bg-surface2/90 border-border-strong shadow-sm'
                }`}
                style={{
                  borderLeftWidth: 3.5,
                  borderLeftColor: isCrit
                    ? 'var(--critical)'
                    : isWarn
                    ? 'var(--warning)'
                    : item.type === 'success'
                    ? 'var(--primary)'
                    : '#3b82f6',
                }}
              >
                {/* Severity Icon */}
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                  style={{
                    width: 30,
                    height: 30,
                    background: isCrit
                      ? 'var(--critical-bg)'
                      : isWarn
                      ? 'var(--warning-bg)'
                      : 'var(--info-bg)',
                  }}
                >
                  {isCrit ? (
                    <AlertCircle size={15} style={{ color: 'var(--critical)' }} />
                  ) : isWarn ? (
                    <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
                  ) : (
                    <Info size={15} style={{ color: 'var(--info)' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {item.source || item.type}
                      </span>
                      {item.site && (
                        <span className="text-[10.5px] font-semibold text-primary truncate max-w-[190px]">
                          {item.site}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(item.id)}
                        className="text-muted-foreground hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                        title="Dismiss alert"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  <p className={`text-xs font-bold mt-1 ${isCrit ? 'text-rose-300' : 'text-foreground'}`}>
                    {item.title}
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                    {item.message}
                  </p>

                  {/* Actions row */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {item.actionUrl ? (
                      <Link
                        href={item.actionUrl}
                        onClick={() => markAsRead(item.id)}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline"
                      >
                        <span>{item.actionLabel || 'Action required'}</span>
                        <ExternalLink size={10} />
                      </Link>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Action required</span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (item.read) markAsUnread(item.id);
                        else markAsRead(item.id);
                      }}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {item.read ? 'Mark unread' : 'Mark resolved'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Real-time footer */}
      <div className="pt-2.5 mt-2 border-t border-border flex items-center justify-between text-[10.5px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Radio size={12} className="text-emerald-400 animate-pulse" />
          <span className="font-medium text-emerald-400">Live Telemetry & Sensor Stream</span>
        </div>
        <span>Dynamic real-time sync</span>
      </div>
    </div>
  );
}
