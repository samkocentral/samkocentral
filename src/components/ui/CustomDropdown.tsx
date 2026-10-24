'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface CustomDropdownProps {
  label?: string;
  value?: string | string[];
  options: (DropdownOption | string)[];
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'filter' | 'surface' | 'pill';
  width?: number | string;
  align?: 'left' | 'right' | 'auto';
  icon?: React.ReactNode;
  multiple?: boolean;
}

export default function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  size = 'md',
  variant = 'filter',
  width,
  align = 'auto',
  icon,
  multiple = false,
}: CustomDropdownProps) {
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
    minWidth?: number;
  }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if multi-select is active
  const isMulti = multiple || Array.isArray(value);

  const selectedValues: string[] = Array.isArray(value)
    ? value
    : typeof value === 'string' && value !== ''
    ? [value]
    : [];

  const isAllSelected =
    selectedValues.length === 0 ||
    selectedValues.includes('') ||
    selectedValues.some((v) => v.toLowerCase() === 'all');

  // Compute fixed viewport coordinates to prevent clipping by overflow containers
  useEffect(() => {
    if (!isOpen) return;

    const computeCoords = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // If trigger is scrolled completely off-screen, close menu
      if (rect.bottom < 0 || rect.top > vh) {
        setIsOpen(false);
        return;
      }

      const menuWidth = menuRef.current?.offsetWidth || 210;
      const menuHeight = menuRef.current?.offsetHeight || 260;

      const spaceBelow = vh - rect.bottom - 12;
      const spaceAbove = rect.top - 12;

      // Only open upwards if space below is too small AND space above is larger
      const openUp = spaceBelow < Math.min(menuHeight, 180) && spaceAbove > spaceBelow;
      const maxHeight = openUp ? Math.min(spaceAbove, 320) : Math.min(spaceBelow, 320);

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
        maxHeight: Math.max(160, maxHeight),
        minWidth: Math.max(rect.width, 180),
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

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const hasExplicitAll = normalizedOptions.some(
    (opt) => opt.value === '' || opt.value.toLowerCase() === 'all'
  );

  // Single select selected option
  const singleSelectedOption = !isMulti
    ? normalizedOptions.find((opt) => opt.value === (typeof value === 'string' ? value : ''))
    : null;

  // Display text computation
  let displayText = placeholder;
  if (isMulti) {
    if (isAllSelected) {
      displayText = label ? label : placeholder;
    } else if (selectedValues.length === 1) {
      const match = normalizedOptions.find((opt) => opt.value === selectedValues[0]);
      displayText = match ? match.label : selectedValues[0];
    } else {
      displayText = label ? `${label} (${selectedValues.length})` : `${selectedValues.length} Selected`;
    }
  } else {
    if (singleSelectedOption) {
      displayText = singleSelectedOption.label;
    } else if (label) {
      displayText = label;
    }
  }

  const isPlaceholder = isMulti
    ? isAllSelected && !!label
    : !singleSelectedOption && !!label;

  const hasActiveFilter = isMulti ? !isAllSelected : Boolean(value && value !== '' && value.toLowerCase() !== 'all');

  // Click outside listener
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

  const handleSelect = (val: string) => {
    if (isMulti) {
      const isAllVal = val === '' || val.toLowerCase() === 'all';
      if (isAllVal) {
        onChange([]);
        return;
      }

      const cleanSelected = selectedValues.filter(
        (v) => v !== '' && v.toLowerCase() !== 'all'
      );

      if (cleanSelected.includes(val)) {
        const next = cleanSelected.filter((v) => v !== val);
        onChange(next);
      } else {
        const next = [...cleanSelected, val];
        onChange(next);
      }
    } else {
      onChange(val);
      setIsOpen(false);
    }
  };

  const dropdownMenu = isOpen && mounted && (
    <div
      ref={menuRef}
      className="fixed z-[99999] min-w-[180px] overflow-y-auto rounded-xl border p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: coords.top !== undefined ? `${coords.top}px` : undefined,
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
        left: coords.left !== undefined ? `${coords.left}px` : undefined,
        right: coords.right !== undefined ? `${coords.right}px` : undefined,
        maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '320px',
        minWidth: coords.minWidth ? `${coords.minWidth}px` : '180px',
        maxWidth: 'min(90vw, 360px)',
        background: '#161a22',
        borderColor: 'rgba(232, 201, 122, 0.25)',
        boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Default "All (...)" Option if label provided and not in normalizedOptions */}
      {label && !hasExplicitAll && (
        <button
          type="button"
          onClick={() => handleSelect('')}
          className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all text-left group border-b border-white/10 mb-1 pb-2 ${
            isAllSelected
              ? 'font-semibold'
              : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
          }`}
          style={{
            background: isAllSelected ? 'rgba(232, 201, 122, 0.12)' : 'transparent',
            color: isAllSelected ? 'var(--primary)' : undefined,
          }}
        >
          <div className="flex items-center gap-2.5 truncate">
            {/* Checkbox box */}
            <div
              className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                isAllSelected
                  ? 'border border-[#e8c97a] bg-[#e8c97a] shadow-sm'
                  : 'border border-white/25 bg-white/[0.04] group-hover:border-[#e8c97a]/60 group-hover:bg-white/[0.08]'
              }`}
            >
              {isAllSelected && (
                <Check size={11} strokeWidth={3.5} className="text-[#121316]" />
              )}
            </div>
            <span>All ({label})</span>
          </div>
        </button>
      )}

      {normalizedOptions.map((option) => {
        const isOptionAll =
          option.value === '' || option.value.toLowerCase() === 'all';
        const isSelected = isOptionAll
          ? isAllSelected
          : isMulti
          ? selectedValues.includes(option.value)
          : option.value === (typeof value === 'string' ? value : '');

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-all text-left group ${
              isSelected
                ? 'font-semibold'
                : 'text-foreground/90 hover:bg-white/[0.06] hover:text-foreground'
            }`}
            style={{
              background: isSelected ? 'rgba(232, 201, 122, 0.12)' : 'transparent',
              color: isSelected ? 'var(--primary)' : undefined,
            }}
          >
            <div className="flex items-center gap-2.5 truncate min-w-0">
              {/* Checkbox Box */}
              <div
                className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                  isSelected
                    ? 'border border-[#e8c97a] bg-[#e8c97a] shadow-sm'
                    : 'border border-white/25 bg-white/[0.04] group-hover:border-[#e8c97a]/60 group-hover:bg-white/[0.08]'
                }`}
              >
                {isSelected && (
                  <Check size={11} strokeWidth={3.5} className="text-[#121316]" />
                )}
              </div>

              {option.icon && (
                <span className="flex-shrink-0 text-muted-foreground group-hover:text-foreground">
                  {option.icon}
                </span>
              )}
              {option.color && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: option.color }}
                />
              )}
              <span className="truncate">{option.label}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {option.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/10 text-muted-foreground">
                  {option.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* Footer for multi-select active filters */}
      {isMulti && !isAllSelected && selectedValues.length > 0 && (
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/10 px-2 text-[11px]">
          <span className="text-muted-foreground">{selectedValues.length} selected</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('');
            }}
            className="text-[#e8c97a] hover:underline font-medium cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      style={{ width: width ? width : undefined }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-2 rounded-xl transition-all select-none outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40'
        }`}
        style={{
          background: variant === 'filter' ? 'var(--surface2)' : 'var(--surface)',
          color: isPlaceholder ? 'var(--text2)' : 'var(--foreground)',
          border: isOpen
            ? '1px solid var(--primary)'
            : hasActiveFilter
            ? '1px solid rgba(232, 201, 122, 0.45)'
            : '1px solid var(--border)',
          boxShadow: isOpen
            ? '0 0 0 2px rgba(232, 201, 122, 0.15)'
            : 'none',
          padding: size === 'sm' ? '5px 10px' : '7px 12px',
          fontSize: size === 'sm' ? '12px' : '13px',
          fontWeight: 500,
          minWidth: variant === 'filter' ? '120px' : undefined,
        }}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
          {singleSelectedOption?.color && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: singleSelectedOption.color }}
            />
          )}
          <span className="truncate">{displayText}</span>
          {isMulti && selectedValues.length > 1 && (
            <span
              className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              style={{
                background: 'rgba(232, 201, 122, 0.2)',
                color: 'var(--primary)',
                border: '1px solid rgba(232, 201, 122, 0.35)',
              }}
            >
              {selectedValues.length}
            </span>
          )}
        </span>

        {/* Dropdown Chevron Icon with Smooth Rotation */}
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-200 flex-shrink-0 group-hover:text-primary ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Render menu via Portal to escape any table or overflow container clipping */}
      {mounted && typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
