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
                            'flex items-center justify-between w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm outline-none',
                            isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : 'hover:border-slate-300 dark:hover:border-slate-600',
                            disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : 'cursor-pointer',
                            !selectedOption ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'
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
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
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
                className="w-[var(--radix-popover-trigger-width)] p-0 z-[150] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl"
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }}
            >
                {/* Search Header */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" aria-hidden />
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
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm outline-none transition-all dark:text-white placeholder:text-slate-400"
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
                        <li role="option" aria-selected={false} className="px-4 py-3 text-sm text-slate-400 text-center italic">
                            Tidak ada hasil
                        </li>
                    ) : (
                        groupKeys.map((group) => (
                            <React.Fragment key={group}>
                                {group !== 'Other' && (
                                    <li className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
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
                                                isActive && 'ring-2 ring-inset ring-blue-400',
                                                isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                                                    : isActive
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
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
