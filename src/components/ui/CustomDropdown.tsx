'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

interface DropdownCoords {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  maxHeight?: number;
  minWidth?: number;
  width?: number;
}

const isAllString = (s: any): boolean => {
  const clean = String(s ?? '').trim().toLowerCase();
  return (
    clean === 'all' ||
    clean === 'all sites' ||
    clean === 'all properties' ||
    clean === 'all categories' ||
    clean === 'all types' ||
    clean === 'all statuses' ||
    clean.startsWith('all ') ||
    clean.startsWith('all-')
  );
};

const formatAllLabel = (allLbl?: string, lbl?: string): string => {
  if (allLbl) return allLbl;
  if (!lbl) return 'All';
  const clean = lbl.trim();
  if (/^all\s+/i.test(clean)) return clean;
  if (/^all$/i.test(clean)) return 'All';
  return `All ${clean}`;
};

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
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [coords, setCoords] = useState<DropdownCoords>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const isAllSelected =
    selectedValues.length === 0 || selectedValues.some((v) => isAllString(v) || v === '');

  // 1. Clean options
  const rawNormalized: DropdownOption[] = (options || [])
    .filter(Boolean)
    .map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        const str = String(opt);
        return { value: str, label: str };
      }
      return {
        ...opt,
        value: String(opt?.value ?? ''),
        label: String(opt?.label ?? opt?.value ?? ''),
      };
    })
    .filter((opt) => opt.label.trim() !== '');

  // 2. Identify if an "All" option is already in the list
  const isAllOpt = (opt: DropdownOption) => {
    const val = opt.value.trim().toLowerCase();
    const lbl = opt.label.trim().toLowerCase();
    return isAllString(val) || isAllString(lbl);
  };

  const existingAllOpt = rawNormalized.find(isAllOpt);
  const regularOptions = rawNormalized.filter((opt) => !isAllOpt(opt));

  const shouldShowAll =
    showAllOption !== undefined
      ? showAllOption
      : isMulti || (variant === 'filter' && (Boolean(label) || Boolean(allLabel)));

  // 3. Unified "All" Option at the top
  let topAllOption: DropdownOption | null = null;
  if (shouldShowAll) {
    if (existingAllOpt) {
      topAllOption = {
        ...existingAllOpt,
        value: '', // Selecting All clears the selection array
        label: existingAllOpt.label || formatAllLabel(allLabel, label),
      };
    } else if (label || allLabel) {
      topAllOption = {
        value: '',
        label: formatAllLabel(allLabel, label),
      };
    }
  }

  // Helper to compute coordinates stably
  const calculatePosition = useCallback(
    (currentPlacement: 'bottom' | 'top'): DropdownCoords | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const menuWidth = Math.max(rect.width, 200);
      const spaceBelow = Math.max(0, vh - rect.bottom - 12);
      const spaceAbove = Math.max(0, rect.top - 12);

      const wouldOverflowRight = rect.left + menuWidth > vw - 16;
      const isRight =
        align === 'right' || (align === 'auto' && wouldOverflowRight) || rect.right > vw - 120;

      const maxHeight =
        currentPlacement === 'top'
          ? Math.min(320, Math.max(160, spaceAbove - 6))
          : Math.min(320, Math.max(160, spaceBelow - 6));

      return {
        top: currentPlacement === 'bottom' ? rect.bottom + 6 : undefined,
        bottom: currentPlacement === 'top' ? vh - rect.top + 6 : undefined,
        left: isRight ? undefined : Math.max(12, rect.left),
        right: isRight ? Math.max(12, vw - rect.right) : undefined,
        maxHeight,
        minWidth: Math.max(rect.width, 180),
        width: rect.width,
      };
    },
    [align]
  );

  // Synchronous open toggle to lock placement & set coords before paint
  const handleToggleOpen = () => {
    if (disabled) return;

    if (!isOpen) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const spaceBelow = vh - rect.bottom - 12;
        const spaceAbove = rect.top - 12;

        // Lock placement once when opening: top only if space below is too small and space above has more room
        const lockedPlacement: 'bottom' | 'top' =
          spaceBelow < 220 && spaceAbove > spaceBelow ? 'top' : 'bottom';

        setPlacement(lockedPlacement);
        const initialCoords = calculatePosition(lockedPlacement);
        if (initialCoords) {
          setCoords(initialCoords);
        }
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Keep position aligned on scroll or resize WITHOUT flipping direction
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    const handleScrollOrResize = (e?: Event) => {
      // Don't reposition if event originated inside dropdown menu
      if (e && e.target && menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }

      const next = calculatePosition(placement);
      if (!next) return;

      setCoords((prev) => {
        // Prevent unnecessary re-renders if position hasn't changed
        if (
          prev.top === next.top &&
          prev.bottom === next.bottom &&
          prev.left === next.left &&
          prev.right === next.right &&
          prev.maxHeight === next.maxHeight &&
          prev.width === next.width
        ) {
          return prev;
        }
        return next;
      });
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, placement, calculatePosition]);

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

  // Search input focus with preventScroll
  const showSearch = searchable === true || (searchable !== false && regularOptions.length > 12);

  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      // preventScroll is vital to prevent browser from scrolling the window on focus
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, [isOpen, showSearch]);

  const handleSelect = (val: string) => {
    if (isMulti) {
      const isValAll = isAllString(val) || val === '';
      if (isValAll) {
        onChange([]);
        return;
      }

      const cleanSelected = selectedValues.filter((v) => !isAllString(v) && v !== '');

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

  // Single select selected option
  const singleSelectedOption = !isMulti
    ? regularOptions.find((opt) => String(opt.value) === String(value ?? ''))
    : null;

  // Display text computation
  let displayText = placeholder;
  if (isMulti) {
    if (isAllSelected) {
      displayText = topAllOption ? topAllOption.label : (label || allLabel || placeholder);
    } else if (selectedValues.length === 1) {
      const match = regularOptions.find(
        (opt) => String(opt.value) === String(selectedValues[0])
      );
      displayText = match ? match.label : selectedValues[0];
    } else {
      const baseLabel = label ? label.replace(/^All\s+/i, '') : '';
      displayText = baseLabel
        ? `${baseLabel} (${selectedValues.length})`
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
    : Boolean(value && value !== '' && !isAllString(value));

  const searchQ = (searchQuery || '').toLowerCase().trim();
  const filteredOptions = searchQ
    ? regularOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQ) ||
          opt.value.toLowerCase().includes(searchQ)
      )
    : regularOptions;

  const dropdownMenu = isOpen && mounted && (
    <div
      ref={menuRef}
      className={`fixed z-[99999] min-w-[180px] overflow-y-auto rounded-xl border p-1.5 shadow-2xl transition-opacity duration-150 custom-scrollbar ${
        placement === 'top' ? 'origin-bottom' : 'origin-top'
      }`}
      style={{
        top: coords.top !== undefined ? `${coords.top}px` : undefined,
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
        left: coords.left !== undefined ? `${coords.left}px` : undefined,
        right: coords.right !== undefined ? `${coords.right}px` : undefined,
        maxHeight: coords.maxHeight ? `${coords.maxHeight}px` : '300px',
        minWidth: coords.minWidth ? `${coords.minWidth}px` : '180px',
        maxWidth: 'min(95vw, 550px)',
        background: 'var(--card, #161a22)',
        borderColor: 'var(--border-strong, rgba(232, 201, 122, 0.25))',
        boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--border)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Search if enabled */}
      {showSearch && (
        <div className="p-1 mb-1 border-b border-border/80">
          <div className="relative flex items-center">
            <Search
              size={12}
              className="absolute left-2.5 text-muted-foreground pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-100/80 dark:bg-white/[0.04] text-xs text-foreground placeholder-slate-400 dark:placeholder-white/30 rounded-lg pl-7 pr-2 py-1.5 outline-none border border-slate-200 dark:border-white/10 focus:border-[#b4831f] dark:focus:border-[#e8c97a]/60"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Exactly ONE "All" Option at the top if enabled */}
      {topAllOption && (!searchQ || topAllOption.label.toLowerCase().includes(searchQ)) && (
        <button
          type="button"
          onClick={() => handleSelect('')}
          className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all text-left group border-b border-border/80 mb-1 pb-2 cursor-pointer ${
            isAllSelected
              ? 'font-semibold'
              : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-foreground'
          }`}
          style={{
            background: isAllSelected ? 'rgba(232, 201, 122, 0.12)' : 'transparent',
            color: isAllSelected ? 'var(--primary)' : undefined,
          }}
        >
          <div className="flex items-center gap-2.5 truncate">
            {/* Crisp visible checkbox in both light & dark mode */}
            <div
              className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                isAllSelected
                  ? 'border-[1.5px] border-[#b4831f] dark:border-[#e8c97a] bg-[#b4831f] dark:bg-[#e8c97a] shadow-sm'
                  : 'border-[1.5px] border-slate-400 dark:border-white/40 bg-white dark:bg-[#1a1f2c] group-hover:border-[#b4831f] dark:group-hover:border-[#e8c97a] group-hover:bg-slate-50 dark:group-hover:bg-white/[0.08] shadow-xs'
              }`}
            >
              {isAllSelected && (
                <Check size={12} strokeWidth={3.5} className="text-white dark:text-[#121316]" />
              )}
            </div>
            <span>{topAllOption.label}</span>
          </div>
        </button>
      )}

      {filteredOptions.length === 0 && (
        <div className="px-3 py-3 text-xs text-muted-foreground text-center italic">
          No options found
        </div>
      )}

      {filteredOptions.map((option, idx) => {
        const isSelected = isMulti
          ? selectedValues.includes(option.value)
          : String(option.value) === String(value ?? '');

        return (
          <button
            key={`${option.value}-${idx}`}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-all text-left group cursor-pointer ${
              isSelected
                ? 'font-semibold'
                : 'text-foreground/90 hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-foreground'
            }`}
            style={{
              background: isSelected ? 'rgba(232, 201, 122, 0.12)' : 'transparent',
              color: isSelected ? 'var(--primary)' : undefined,
            }}
          >
            <div className="flex items-center gap-2.5 truncate min-w-0">
              {/* Crisp visible checkbox in both light & dark mode */}
              <div
                className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                  isSelected
                    ? 'border-[1.5px] border-[#b4831f] dark:border-[#e8c97a] bg-[#b4831f] dark:bg-[#e8c97a] shadow-sm'
                    : 'border-[1.5px] border-slate-400 dark:border-white/40 bg-white dark:bg-[#1a1f2c] group-hover:border-[#b4831f] dark:group-hover:border-[#e8c97a] group-hover:bg-slate-50 dark:group-hover:bg-white/[0.08] shadow-xs'
                }`}
              >
                {isSelected && (
                  <Check size={12} strokeWidth={3.5} className="text-white dark:text-[#121316]" />
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
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-black/5 dark:bg-white/10 text-muted-foreground">
                  {option.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* Footer for multi-select active filters */}
      {isMulti && !isAllSelected && selectedValues.length > 0 && (
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border/80 px-2 text-[11px]">
          <span className="text-muted-foreground">{selectedValues.length} selected</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('');
            }}
            className="text-[#b4831f] dark:text-[#e8c97a] hover:underline font-semibold cursor-pointer"
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
        onClick={handleToggleOpen}
        className={`group flex items-center justify-between gap-2 transition-all select-none outline-none ${
          width === '100%' ? 'w-full' : ''
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#b4831f]/50 dark:hover:border-[#e8c97a]/50'
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
              ? '1px solid var(--border-strong)'
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
