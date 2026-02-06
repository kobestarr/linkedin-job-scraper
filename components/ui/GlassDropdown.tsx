'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface GlassDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function GlassDropdown({
  trigger,
  children,
  isOpen,
  onOpenChange,
  align = 'left',
  className,
}: GlassDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClickOutside, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="listbox"
          className={cn(
            'dropdown-glass absolute z-50 mt-2',
            align === 'right' ? 'right-0' : 'left-0',
            'animate-filter-in',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownOptionProps {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function DropdownOption({ selected, onClick, children, className }: DropdownOptionProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      data-selected={selected}
      onClick={onClick}
      className={cn('dropdown-option', className)}
    >
      {children}
    </div>
  );
}
