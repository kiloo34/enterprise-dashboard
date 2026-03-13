import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export interface SearchableSelectOption {
    value: string;
    label: string;
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
    /** a11y label used when there is no visible label element */
    'aria-label'?: string;
    /** ID of a visible label element */
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
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // ─── Positioning ─────────────────────────────────────────────────────────
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const maxHeight = 320;

        const style: React.CSSProperties = {
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
        };

        if (spaceBelow >= maxHeight || spaceBelow >= 150) {
            style.top = rect.bottom + 6;
        } else {
            style.bottom = window.innerHeight - rect.top + 6;
        }

        setDropdownStyle(style);
    }, []);

    // ─── Filtered options ─────────────────────────────────────────────────────
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ─── Scroll active item into view ─────────────────────────────────────────
    useEffect(() => {
        if (activeIndex < 0 || !listRef.current) return;
        const el = listRef.current.children[activeIndex] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    // ─── Reset active when search changes ────────────────────────────────────
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery]);

    // ─── Outside click + scroll + resize ─────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        function handleOutside(e: MouseEvent) {
            const t = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(t) &&
                dropdownRef.current && !dropdownRef.current.contains(t)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleOutside);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    // ─── On open: position + focus ────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            updatePosition();
            setTimeout(() => searchInputRef.current?.focus(), 10);
        } else {
            setSearchQuery('');
            setActiveIndex(-1);
        }
    }, [isOpen, updatePosition]);

    // ─── Keyboard: trigger button ─────────────────────────────────────────────
    function handleTriggerKeyDown(e: React.KeyboardEvent) {
        switch (e.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                e.preventDefault();
                if (!disabled) {
                    setIsOpen(true);
                    setActiveIndex(0);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    }

    // ─── Keyboard: search input ───────────────────────────────────────────────
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
                if (activeIndex >= 0 && filteredOptions[activeIndex]) {
                    selectOption(filteredOptions[activeIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                triggerRef.current?.focus();
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    }

    function selectOption(opt: SearchableSelectOption) {
        onChange(opt.value);
        setIsOpen(false);
        triggerRef.current?.focus();
    }

    const selectedOption = options.find(opt => opt.value === value);

    // ─── Dropdown (rendered via portal) ──────────────────────────────────────
    const dropdown = isOpen ? (
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            role="presentation"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
            {/* Search */}
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
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>
            </div>

            {/* Options */}
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
                    filteredOptions.map((opt, idx) => {
                        const isSelected = opt.value === value;
                        const isActive = idx === activeIndex;
                        return (
                            <li
                                key={opt.value}
                                id={`${listboxId}-option-${idx}`}
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
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseDown={e => {
                                    e.preventDefault();
                                    selectOption(opt);
                                }}
                            >
                                <span className="truncate">{opt.label}</span>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    ) : null;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className={cn('relative w-full text-sm', className)}>
            <button
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
                onKeyDown={handleTriggerKeyDown}
                className={cn(
                    'flex items-center justify-between w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm outline-none',
                    isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : 'hover:border-slate-300 dark:hover:border-slate-600',
                    disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : 'cursor-pointer',
                    !selectedOption ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'
                )}
                disabled={disabled}
            >
                <span className="truncate pr-4 font-medium">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0 opacity-60">
                    {selectedOption && onClear && !disabled && (
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Hapus pilihan"
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            onMouseDown={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                onClear();
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onClear();
                                }
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

            {typeof window !== 'undefined' && dropdown
                ? createPortal(dropdown, document.body)
                : null}
        </div>
    );
}
