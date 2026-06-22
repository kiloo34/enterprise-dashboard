import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SearchableSelect, SearchableSelectOption } from './SearchableSelect';
import { FieldError } from 'react-hook-form';

interface FormSearchableSelectProps {
    label: string;
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    error?: FieldError;
    placeholder?: string;
    searchPlaceholder?: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
}

export const FormSearchableSelect: React.FC<FormSearchableSelectProps> = ({
    label,
    options,
    value,
    onChange,
    error,
    placeholder,
    searchPlaceholder,
    required,
    className = "",
    disabled = false
}) => {
    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--label-color)' }}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <SearchableSelect
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                disabled={disabled}
                className={error ? 'border-red-500 ring-1 ring-red-500/20' : ''}
            />
            {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                    {error.message}
                </p>
            )}
        </div>
    );
};
