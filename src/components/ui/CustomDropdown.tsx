'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface CustomDropdownProps {
  label?: string;
  allLabel?: string;
  value?: string | number | string[];
  options: (DropdownOption | string)[];
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filter' | 'surface' | 'pill' | 'form';
  width?: number | string;
  align?: 'left' | 'right' | 'auto';
  icon?: React.ReactNode;
  multiple?: boolean;
  showAllOption?: boolean;
  searchable?: boolean;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}

export default function CustomDropdown({
  label,
  allLabel,
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
  showAllOption,
  searchable,
  id,
  name,
  style,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    maxHeight?: number;
    minWidth?: number;
    width?: number;
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
      : typeof value === 'number'
        ? [String(value)]
        : [];

  const isAllValue = (v: any) => {
    const s = String(v ?? '')
      .trim()
      .toLowerCase();
    return s === '' || s === 'all' || s.startsWith('all ') || s === 'all properties';
  };

  const isAllSelected = selectedValues.length === 0 || selectedValues.some((v) => isAllValue(v));

  // Compute fixed viewport coordinates to prevent clipping by overflow containers
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

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

      const menuWidth = menuRef.current?.offsetWidth || Math.max(rect.width, 210);
      const menuHeight = menuRef.current?.offsetHeight || 260;

      const spaceBelow = vh - rect.bottom - 12;
      const spaceAbove = rect.top - 12;

      // Only open upwards if space below is too small AND space above is larger
      const openUp = spaceBelow < Math.min(menuHeight, 180) && spaceAbove > spaceBelow;
      const maxHeight = openUp ? Math.min(spaceAbove, 320) : Math.min(spaceBelow, 320);

      const wouldOverflowRight = rect.left + menuWidth > vw - 16;
      const isRight =
        align === 'right' || (align === 'auto' && wouldOverflowRight) || rect.right > vw - 120;

      setCoords({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? vh - rect.top + 6 : undefined,
        left: isRight ? undefined : Math.max(12, rect.left),
        right: isRight ? Math.max(12, vw - rect.right) : undefined,
        maxHeight: Math.max(160, maxHeight),
        minWidth: Math.max(rect.width, 180),
        width: rect.width,
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
  const normalizedOptions: DropdownOption[] = (options || []).filter(Boolean).map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      const str = String(opt);
      return { value: str, label: str };
    }
    return {
      ...opt,
      value: String(opt?.value ?? ''),
      label: String(opt?.label ?? opt?.value ?? ''),
    };
  });

  const hasExplicitAll = normalizedOptions.some(
    (opt) => !opt.value || String(opt.value).toLowerCase() === 'all'
  );

  const shouldShowAll =
    showAllOption !== undefined
      ? showAllOption
      : isMulti || (variant === 'filter' && (Boolean(label) || Boolean(allLabel)));

  // Single select selected option
  const singleSelectedOption = !isMulti
    ? normalizedOptions.find((opt) => String(opt.value) === String(value ?? ''))
    : null;

  // Display text computation
  let displayText = placeholder;
  if (isMulti) {
    if (isAllSelected) {
      const allOpt = normalizedOptions.find((opt) => isAllValue(opt.value));
      displayText = allOpt ? allOpt.label : label ? label : placeholder;
    } else if (selectedValues.length === 1) {
      const match = normalizedOptions.find(
        (opt) => String(opt.value) === String(selectedValues[0])
      );
      displayText = match ? match.label : selectedValues[0];
    } else {
      displayText = label
        ? `${label} (${selectedValues.length})`
        : `${selectedValues.length} Selected`;
    }
  } else {
    if (singleSelectedOption) {
      displayText = singleSelectedOption.label;
    } else if (label && (value === undefined || value === '')) {
      displayText = label;
    } else if (value !== undefined && value !== '') {
      displayText = String(value);
    }
  }

  const isPlaceholder = isMulti
    ? isAllSelected && !!label
    : (!singleSelectedOption || singleSelectedOption.value === '') && !value;

  const hasActiveFilter = isMulti
    ? !isAllSelected
    : Boolean(value && value !== '' && String(value).toLowerCase() !== 'all');

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
      const isValAll = isAllValue(val);
      if (isValAll) {
        onChange([val || 'all']);
        return;
      }

      // Filter out any "all" strings from existing selection when picking an individual item
      const cleanSelected = selectedValues.filter((v) => !isAllValue(v));

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

  const showSearch = searchable === true || (searchable !== false && normalizedOptions.length > 7);

  const searchQ = (searchQuery || '').toLowerCase().trim();
  const filteredOptions = searchQ
    ? normalizedOptions.filter(
        (opt) =>
          String(opt.label || '')
            .toLowerCase()
            .includes(searchQ) ||
          String(opt.value || '')
            .toLowerCase()
            .includes(searchQ)
      )
    : normalizedOptions;

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
        maxWidth: 'min(95vw, 550px)',
        background: '#161a22',
        borderColor: 'rgba(232, 201, 122, 0.25)',
        boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Search */}
      {showSearch && (
        <div className="p-1 mb-1 border-b border-white/10">
          <div className="relative flex items-center">
            <Search
              size={12}
              className="absolute left-2.5 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-white/[0.04] text-xs text-foreground placeholder-white/30 rounded-lg pl-7 pr-2 py-1.5 outline-none border border-white/10 focus:border-[#e8c97a]/60"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Default "All (...)" Option if label or allLabel provided and not in normalizedOptions and shouldShowAll */}
      {shouldShowAll && (label || allLabel) && !hasExplicitAll && (
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
            {/* Checkbox box matching Image 1 */}
            <div
              className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                isAllSelected
                  ? 'border border-[#e8c97a] bg-[#e8c97a] shadow-sm'
                  : 'border border-white/25 bg-white/[0.04] group-hover:border-[#e8c97a]/60 group-hover:bg-white/[0.08]'
              }`}
            >
              {isAllSelected && <Check size={11} strokeWidth={3.5} className="text-[#121316]" />}
            </div>
            <span>{allLabel || `All (${label})`}</span>
          </div>
        </button>
      )}

      {filteredOptions.length === 0 && (
        <div className="px-3 py-3 text-xs text-muted-foreground text-center italic">
          No options found
        </div>
      )}

      {filteredOptions.map((option) => {
        const isOptionAll = isAllValue(option.value);
        const isSelected = isOptionAll
          ? isAllSelected
          : isMulti
            ? selectedValues.includes(option.value)
            : String(option.value) === String(value ?? '');

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
              {/* Checkbox Box matching Image 1 */}
              <div
                className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                  isSelected
                    ? 'border border-[#e8c97a] bg-[#e8c97a] shadow-sm'
                    : 'border border-white/25 bg-white/[0.04] group-hover:border-[#e8c97a]/60 group-hover:bg-white/[0.08]'
                }`}
              >
                {isSelected && <Check size={11} strokeWidth={3.5} className="text-[#121316]" />}
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
      id={id ? `${id}-container` : undefined}
      className={`relative inline-block text-left ${width === '100%' ? 'w-full block' : ''} ${className}`}
      style={{ width: width ? width : undefined }}
    >
      {/* Hidden input for form integration if name is given */}
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={Array.isArray(value) ? value.join(',') : (value ?? '')}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-2 transition-all select-none outline-none ${
          width === '100%' ? 'w-full' : ''
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#e8c97a]/50'
        }`}
        style={{
          width: width === '100%' ? '100%' : width ? width : undefined,
          minHeight: variant === 'form' ? '40px' : size === 'sm' ? '32px' : '38px',
          background:
            variant === 'filter'
              ? 'var(--surface2)'
              : variant === 'form'
                ? 'var(--surface2)'
                : 'var(--surface)',
          color: isPlaceholder ? 'var(--text3)' : 'var(--foreground)',
          borderRadius: variant === 'form' ? '8px' : variant === 'pill' ? '9999px' : '10px',
          border: isOpen
            ? '1px solid var(--primary)'
            : hasActiveFilter && variant === 'filter'
              ? '1px solid rgba(232, 201, 122, 0.45)'
              : variant === 'form'
                ? '1px solid var(--border-strong)'
                : '1px solid var(--border)',
          boxShadow: isOpen ? '0 0 0 2px rgba(232, 201, 122, 0.15)' : 'none',
          padding: variant === 'form' ? '8px 12px' : size === 'sm' ? '4px 8px' : '7px 12px',
          fontSize: variant === 'form' ? '13px' : size === 'sm' ? '12px' : '13px',
          fontWeight: 500,
          minWidth: variant === 'filter' ? '120px' : undefined,
          ...style,
        }}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
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
