import React from 'react';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

// ─── FieldError ───────────────────────────────────────────────────────────────
interface FieldErrorProps {
    /** Error message(s) — string or array of strings (from Laravel) */
    error?: string | string[] | null;
    className?: string;
}

/**
 * Renders an inline validation error message beneath a form field.
 *
 * @example
 * <input {...register('name')} />
 * <FieldError error={errors.name?.message} />
 *
 * // From API response (ApiError.fieldErrors):
 * <FieldError error={apiFieldErrors?.name} />
 */
export function FieldError({ error, className }: FieldErrorProps) {
    if (!error) return null;
    const messages = Array.isArray(error) ? error : [error];
    return (
        <div className={clsx('mt-1.5 space-y-0.5', className)} role="alert">
            {messages.map((msg, i) => (
                <p key={i} className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {msg}
                </p>
            ))}
        </div>
    );
}

// ─── FormErrors ───────────────────────────────────────────────────────────────
interface FormErrorsProps {
    /** Top-level form error (e.g. API 500 message) */
    error?: string | null;
    className?: string;
}

/**
 * Renders a full-width error banner at the top of a form.
 * Use for API-level errors that are not tied to a specific field.
 *
 * @example
 * <FormErrors error={submitError} />
 */
export function FormErrors({ error, className }: FormErrorsProps) {
    if (!error) return null;
    return (
        <div
            role="alert"
            className={clsx(
                'flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm animate-in fade-in duration-300',
                className
            )}
        >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
        </div>
    );
}
