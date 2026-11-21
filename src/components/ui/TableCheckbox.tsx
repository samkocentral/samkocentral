'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface TableCheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export default function TableCheckbox({
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  title,
  className = '',
}: TableCheckboxProps) {
  const isSelected = checked || indeterminate;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(e);
      }}
      title={title}
      className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all duration-150 outline-none select-none ${
        disabled
          ? 'opacity-30 cursor-not-allowed border-[1.5px] border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/[0.02]'
          : isSelected
            ? 'border-[1.5px] border-[#b4831f] dark:border-[#e8c97a] bg-[#b4831f] dark:bg-[#e8c97a] shadow-sm cursor-pointer'
            : 'border-[1.5px] border-slate-400 dark:border-white/40 bg-white dark:bg-[#1a1f2c] hover:border-[#b4831f] dark:hover:border-[#e8c97a] hover:bg-slate-50 dark:hover:bg-white/[0.08] shadow-xs cursor-pointer'
      } ${className}`}
    >
      {checked && !indeterminate && (
        <Check size={12} strokeWidth={3.5} className="text-white dark:text-[#121316]" />
      )}
      {indeterminate && <Minus size={12} strokeWidth={3.5} className="text-white dark:text-[#121316]" />}
    </button>
  );
}
