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
      className={`w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all duration-150 outline-none select-none ${
        disabled
          ? 'opacity-30 cursor-not-allowed border border-white/10 bg-white/[0.02]'
          : isSelected
            ? 'border border-[#e8c97a] bg-[#e8c97a] shadow-sm cursor-pointer'
            : 'border border-white/25 bg-white/[0.04] hover:border-[#e8c97a]/60 hover:bg-white/[0.08] cursor-pointer'
      } ${className}`}
    >
      {checked && !indeterminate && (
        <Check size={11} strokeWidth={3.5} className="text-[#121316]" />
      )}
      {indeterminate && <Minus size={11} strokeWidth={3.5} className="text-[#121316]" />}
    </button>
  );
}
