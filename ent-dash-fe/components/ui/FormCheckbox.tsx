import React from 'react';

interface FormCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
    label,
    checked,
    onChange,
    className = ""
}) => {
    return (
        <label
            className={`flex items-center min-w-[200px] p-3 rounded-xl cursor-pointer transition-colors ${className}`}
            style={{
                border: '1px solid var(--card-border)',
                background: checked ? 'rgba(26,86,219,0.06)' : 'transparent',
            }}
        >
            <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="ml-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </label>
    );
};
