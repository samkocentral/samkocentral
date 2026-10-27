'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface StatusOption {
  value: string;
  label: string;
  color: string;
  bg?: string;
}

interface StatusDropdownProps {
  value?: string | null;
  options: StatusOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  align?: 'left' | 'right' | 'auto';
}

export default function StatusDropdown({
  value,
  options = [],
  onChange,
  disabled = false,
  className = '',
  title = 'Click to change status',
  align = 'auto',
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    maxHeight?: number;
  }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeValue = typeof value === 'string' ? value : '';
  const currentOption = (options || []).find((o) => o.value === safeValue) || {
    value: safeValue,
    label: safeValue ? safeValue.replace(/-/g, ' ') : (options?.[0]?.label || 'Active'),
    color: options?.[0]?.color || '#3dd68c',
    bg: options?.[0]?.bg || 'rgba(61,214,140,0.12)',
  };

  // Compute fixed viewport coordinates to prevent clipping by tables, headers, or viewport boundaries
  useEffect(() => {
    if (!isOpen) return;

    const computeCoords = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // If trigger is completely scrolled off-screen, close menu
      if (rect.bottom < 0 || rect.top > vh) {
        setIsOpen(false);
        return;
      }

      const menuWidth = menuRef.current?.offsetWidth || 185;
      const menuHeight = menuRef.current?.offsetHeight || 215;

      const spaceBelow = vh - rect.bottom - 12;
      const spaceAbove = rect.top - 12;

      // Only open upwards if space below is too small AND space above is larger
      const openUp = spaceBelow < Math.min(menuHeight, 180) && spaceAbove > spaceBelow;
      const maxHeight = openUp ? Math.min(spaceAbove, 320) : Math.min(spaceBelow, 320);

      // Horizontal alignment:
      const wouldOverflowRight = rect.left + menuWidth > vw - 16;
      const isRight =
        align === 'right' ||
        (align === 'auto' && wouldOverflowRight) ||
        rect.right > vw - 120;

      setCoords({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? vh - rect.top + 6 : undefined,
        left: isRight ? undefined : Math.max(12, rect.left),
        right: isRight ? Math.max(12, vw - rect.right) : undefined,
        maxHeight: Math.max(150, maxHeight),
      });
    };

    computeCoords();
    const rafId = requestAnimationFrame(computeCoords);
    window.addEventListener('resize', computeCoords);
    window.addEventListener('scroll', computeCoords, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', computeCoords);
      window.removeEventListener('scroll', computeCoords, true);
    };
  }, [isOpen, align]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(val);
    setIsOpen(false);
  };

  const bg = currentOption.bg || `${currentOption.color}15`;

  const dropdownMenu = isOpen && mounted && (
    <div
      ref={menuRef}
      className="fixed z-[99999] min-w-[180px] overflow-y-auto rounded-2xl border p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: coords.top !== undefined ? `${coords.top}px` : undefined,
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
        left: coords.left !== undefined ? `${coords.left}px` : undefined,
        right: coords.right !== undefined ? `${coords.right}px` : undefined,
        maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '320px',
        background: '#161a22',
        borderColor: 'rgba(232, 201, 122, 0.25)',
        boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        maxWidth: 'min(90vw, 320px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-white/10 mb-1 flex items-center justify-between">
        <span>Change Status</span>
      </div>

      <div className="space-y-0.5">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => handleSelect(e, opt.value)}
              className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all text-left group ${
                isSelected ? 'font-semibold text-foreground' : 'text-foreground/90 hover:bg-white/[0.06] hover:text-white'
              }`}
              style={{
                background: isSelected ? 'rgba(232, 201, 122, 0.12)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                {/* Checkbox box */}
                <div
                  className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                    isSelected
                      ? 'border border-[#e8c97a] bg-[#e8c97a] text-black shadow-sm'
                      : 'border border-white/25 bg-white/[0.04] group-hover:border-[#e8c97a]/60 group-hover:bg-white/[0.08]'
                  }`}
                >
                  {isSelected && (
                    <Check size={11} strokeWidth={3.5} className="text-[#121316]" />
                  )}
                </div>

                {/* Status Dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: opt.color }}
                />

                {/* Status Label */}
                <span className="capitalize truncate" style={{ color: isSelected ? opt.color : undefined }}>
                  {opt.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pill Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        title={disabled ? 'Read-only access' : title}
        className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all select-none ${
          disabled ? 'opacity-75 cursor-default' : 'cursor-pointer hover:scale-[1.02] active:scale-95'
        }`}
        style={{
          background: bg,
          color: currentOption.color,
          borderColor: isOpen ? currentOption.color : `${currentOption.color}40`,
          boxShadow: isOpen ? `0 0 0 2px ${currentOption.color}25` : 'none',
        }}
      >
        {/* Status Dot */}
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ background: currentOption.color }}
        />

        {/* Label */}
        <span className="capitalize">{currentOption.label}</span>

        {/* Dropdown Chevron Icon with Rotation */}
        {!disabled && (
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 opacity-70 group-hover:opacity-100 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
            style={{ color: currentOption.color }}
          />
        )}
      </button>

      {/* Render via Portal so it cannot be clipped by table overflow or sticky headers */}
      {mounted && typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
