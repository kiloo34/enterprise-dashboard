"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save } from 'lucide-react';
import { Role, Permission, RoleFormData } from '../../types/role';
import { useTranslation } from '../../hooks/useTranslation';
import { FieldError, FormErrors } from '../ui/FormErrors';
import { ApiError } from '../../utils/api';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface RoleFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RoleFormData) => Promise<void>;
    role?: Role;
    permissions: Permission[];
    isSubmitting: boolean;
}

export const RoleForm: React.FC<RoleFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    role,
    permissions,
    isSubmitting
}) => {
    const t = useTranslation("Roles");
    const tc = useTranslation("Common");

    const roleSchema = z.object({
        name: z.string().min(1, t.form.validation.nameRequired).max(255, t.form.validation.nameMax),
        permissions: z.array(z.number()).min(1, t.form.validation.permissionsRequired),
    });

    const { register, handleSubmit, control, reset, setError, formState: { errors } } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '', permissions: [] }
    });
    const [submitError, setSubmitError] = useState<string | null>(null);
    const modalRef = useFocusTrap(isOpen, onClose);

    useEffect(() => {
        if (isOpen) {
            if (role) {
                reset({
                    name: role.name,
                    permissions: role.permissions?.map(p => p.id) || [],
                });
            } else {
                reset({
                    name: '',
                    permissions: [],
                });
            }
        }
    }, [isOpen, role, reset]);

    const handleFormSubmit = async (data: RoleFormData) => {
        setSubmitError(null);
        try {
            await onSubmit(data);
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.fieldErrors) {
                    // Map Laravel field errors back into react-hook-form
                    Object.entries(err.fieldErrors).forEach(([field, messages]) => {
                        setError(field as keyof RoleFormData, { message: messages[0] });
                    });
                }
                setSubmitError(err.message);
            }
        }
    };

    if (!isOpen) return null;

    // Group permissions by prefix for better UI
    const groupedPermissions = permissions.reduce((acc, curr) => {
        let groupKey: keyof typeof t.form.groups = 'other';
        const name = curr.name;

        // Only use fallback logic if owner is not set
        if (!curr.owner) {
            // New granular permission logic
            if (name.startsWith('view-dashboard-keuangan')) groupKey = 'dashboardFinancial';
            else if (name.startsWith('view-dashboard-operasi-rekon-qris')) groupKey = 'opsQris';
            else if (name.startsWith('view-dashboard-operasi-rekon')) groupKey = 'opsOther';
            else if (name.startsWith('view-sts-') || name.startsWith('view-engine-') || name.startsWith('view-job-')) groupKey = 'engine';
            else if (name.startsWith('manage-role') || name.startsWith('manage-permission') || name.startsWith('manage-rbac')) groupKey = 'rbac';
            else if (name.startsWith('manage-user')) groupKey = 'user';
            else if (name.startsWith('manage-mapping')) groupKey = 'mapping';
            else if (name.startsWith('manage-organization')) groupKey = 'organization';
            // Fallback for old dot-notation or others
            else {
                const parts = name.split(/[\.-]/);
                if (parts.length > 1) {
                    const firstPart = parts[0].toLowerCase();
                    if (firstPart in t.form.groups) {
                        groupKey = firstPart as keyof typeof t.form.groups;
                    }
                }
            }
        } else {
            // Map owner string to group key if possible, or use other
            const ownerLower = curr.owner.toLowerCase();
            if (ownerLower.includes('keuangan')) groupKey = 'dashboardFinancial';
            else if (ownerLower.includes('qris')) groupKey = 'opsQris';
            else if (ownerLower.includes('operasi')) groupKey = 'opsOther';
            else if (ownerLower.includes('engine')) groupKey = 'engine';
            else if (ownerLower.includes('rbac')) groupKey = 'rbac';
            else if (ownerLower.includes('user')) groupKey = 'user';
            else if (ownerLower.includes('mapping')) groupKey = 'mapping';
            else if (ownerLower.includes('organisasi') || ownerLower.includes('organization')) groupKey = 'organization';
        }

        const groupName = t.form.groups[groupKey];
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(curr);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="role-form-title"
                className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col my-auto animate-in zoom-in-95 duration-200"
            >

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 id="role-form-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                            {role ? t.form.editTitle : t.form.addTitle}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {role ? t.form.editDesc : t.form.addDesc}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body / Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col">
                    <div className="flex-1 p-6 space-y-6">
                        <FormErrors error={submitError} />

                        {/* Name Input */}
                        <div>
                            <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.name} <span className="text-red-500" aria-hidden>*</span>
                            </label>
                            <input
                                id="role-name"
                                {...register('name')}
                                type="text"
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? 'role-name-error' : undefined}
                                className={`w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200'}`}
                                placeholder={t.form.namePlaceholder}
                            />
                            <FieldError error={errors.name?.message} />
                        </div>

                        {/* Permissions Select (Grouped) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                {t.form.permissions}
                            </label>

                            <Controller
                                name="permissions"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-4">
                                        {Object.entries(groupedPermissions).map(([group, perms]) => (
                                            <div key={group} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                                    {t.form.moduleLabel}: {group}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {perms.map(p => (
                                                        <label key={p.id} className="flex items-start cursor-pointer group">
                                                            <div className="flex items-center h-5">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                                    checked={field.value?.includes(p.id)}
                                                                    onChange={(e) => {
                                                                        const current = field.value || [];
                                                                        const updated = e.target.checked
                                                                            ? [...current, p.id]
                                                                            : current.filter(id => id !== p.id);
                                                                        field.onChange(updated);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="ml-3 text-sm">
                                                                <span
                                                                    className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-500 transition-colors"
                                                                    title={p.description || p.name}
                                                                >
                                                                    {p.name.replace(`${group}.`, '')}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                            <FieldError error={errors.permissions?.message as string} />
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
                        >
                            {tc.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {tc.loading}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {tc.save}
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div >
        </div >
    );
};
