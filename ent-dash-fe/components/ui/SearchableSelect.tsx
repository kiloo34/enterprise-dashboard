"use client";

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface SearchableSelectOption {
    value: string;
    label: string;
    group?: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    onClear?: () => void;
    'aria-label'?: string;
    'aria-labelledby'?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    className,
    disabled = false,
    onClear,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
}: SearchableSelectProps) {
    const uid = useId();
    const listboxId = `listbox-${uid}`;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Filtered options
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.group && opt.group.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group options
    const groupedOptions = filteredOptions.reduce((acc, opt) => {
        const group = opt.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
    }, {} as Record<string, SearchableSelectOption[]>);

    const groupKeys = Object.keys(groupedOptions);
    const flattenedOptions = groupKeys.flatMap(key => groupedOptions[key]);

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return;
        const el = listRef.current.children[activeIndex] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    // Reset active index when search changes
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setActiveIndex(-1);
        }
    }, [isOpen]);

    function selectOption(opt: SearchableSelectOption) {
        onChange(opt.value);
        setIsOpen(false);
        triggerRef.current?.focus();
    }

    // Handle search input keyboard navigation
    function handleSearchKeyDown(e: React.KeyboardEvent) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, filteredOptions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
                break;
            case 'Home':
                e.preventDefault();
                setActiveIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setActiveIndex(filteredOptions.length - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && flattenedOptions[activeIndex]) {
                    selectOption(flattenedOptions[activeIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                triggerRef.current?.focus();
                break;
        }
    }

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <Popover open={isOpen} onOpenChange={(open: boolean) => !disabled && setIsOpen(open)}>
            <PopoverTrigger asChild>
                <div className={cn('relative w-full text-sm', className)}>
                    <button
                        ref={triggerRef}
                        type="button"
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? listboxId : undefined}
                        aria-label={ariaLabel}
                        aria-labelledby={ariaLabelledby}
                        disabled={disabled}
                        className={cn(
                            'flex items-center justify-between w-full p-3 rounded-xl transition-all shadow-sm outline-none backdrop-blur-sm',
                            'bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)]',
                            isOpen ? 'ring-2 ring-[var(--input-focus-ring)] border-blue-500' : 'hover:border-[var(--text-muted)]',
                            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                            !selectedOption ? 'text-[var(--input-placeholder)]' : ''
                        )}
                    >
                        <span className="truncate pr-4 font-medium">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 opacity-60">
                            {selectedOption && onClear && !disabled && (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Clears selected option"
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    onMouseDown={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onClear();
                                        setIsOpen(false);
                                    }}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </div>
                            )}
                            <ChevronDown
                                className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
                                aria-hidden
                            />
                        </div>
                    </button>
                </div>
            </PopoverTrigger>

            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0 z-[150] rounded-xl shadow-2xl border border-[var(--modal-border)] bg-[var(--modal-bg)]"
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }}
            >
                {/* Search Header */}
                <div className="p-2 border-b border-[var(--modal-border)]">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[var(--text-muted)]" aria-hidden />
                        <input
                            ref={searchInputRef}
                            type="text"
                            role="searchbox"
                            aria-label={searchPlaceholder}
                            aria-controls={listboxId}
                            aria-autocomplete="list"
                            aria-activedescendant={
                                activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                            }
                            className={cn(
                                "w-full pl-9 pr-3 py-2 border border-transparent rounded-lg text-sm outline-none transition-all",
                                "bg-[var(--group-card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                                "focus:bg-[var(--modal-bg)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            )}
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                </div>

                {/* Options List */}
                <ul
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    aria-label={ariaLabel || placeholder}
                    className="max-h-60 overflow-y-auto py-1 custom-scrollbar"
                >
                    {filteredOptions.length === 0 ? (
                        <li role="option" aria-selected={false} className="px-4 py-3 text-sm text-[var(--text-muted)] text-center italic">
                            Tidak ada hasil
                        </li>
                    ) : (
                        groupKeys.map((group) => (
                            <React.Fragment key={group}>
                                {group !== 'Other' && (
                                    <li className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[var(--modal-footer-bg)] text-[var(--text-muted)]">
                                        {group}
                                    </li>
                                )}
                                {groupedOptions[group].map((opt) => {
                                    const actualIdx = flattenedOptions.findIndex(f => f.value === opt.value);
                                    const isSelected = opt.value === value;
                                    const isActive = actualIdx === activeIndex;
                                    return (
                                        <li
                                            key={opt.value}
                                            id={`${listboxId}-option-${actualIdx}`}
                                            role="option"
                                            aria-selected={isSelected}
                                            className={cn(
                                                'px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center',
                                                isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-medium'
                                                    : isActive
                                                        ? 'bg-[var(--card-bg-hover)] text-[var(--text-primary)]'
                                                        : 'hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)]'
                                            )}
                                            onMouseEnter={() => setActiveIndex(actualIdx)}
                                            onMouseDown={(e: React.MouseEvent) => {
                                                e.preventDefault();
                                                selectOption(opt);
                                            }}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                        </li>
                                    );
                                })}
                            </React.Fragment>
                        ))
                    )}
                </ul>
            </PopoverContent>
        </Popover>
    );
}

