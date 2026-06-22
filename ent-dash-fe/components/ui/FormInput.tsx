import React from 'react';
import { AlertCircle } from 'lucide-react';
import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface FormInputProps {
    label: string;
    registration: UseFormRegisterReturn;
    error?: FieldError;
    type?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    multiline?: boolean;
    rows?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    registration,
    error,
    type = 'text',
    placeholder,
    required,
    disabled = false,
    className = "",
    multiline = false,
    rows = 3
}) => {
    const inputClass = `w-full px-4 py-2 rounded-xl text-sm outline-none transition-all
        bg-[var(--input-bg)] border text-[var(--input-text)]
        placeholder:text-[var(--input-placeholder)]
        focus:ring-2 ${
            error
                ? 'border-red-500 focus:ring-red-500/20'
                : 'border-[var(--input-border)] focus:ring-[var(--input-focus-ring)] focus:border-[var(--color-brand-blue)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--label-color)' }}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {multiline ? (
                <textarea
                    {...registration}
                    rows={rows}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClass + " resize-none"}
                />
            ) : (
                <input
                    {...registration}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClass}
                />
            )}
            {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                    {error.message}
                </p>
            )}
        </div>
    );
};
