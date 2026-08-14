"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Search, ChevronRight, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { Role, Permission, RoleFormData } from '../../types/role';
import { useTranslation } from '../../hooks/useTranslation';
import { FormErrors } from '../ui/FormErrors';
import { ApiError } from '../../utils/api';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { FormInput } from '../ui/FormInput';
import { FormCheckbox } from '../ui/FormCheckbox';

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

    const { register, handleSubmit, control, reset, setError, watch, setValue, formState: { errors } } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '', permissions: [] }
    });
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [permissionSearch, setPermissionSearch] = useState("");
    const modalRef = useFocusTrap(isOpen, onClose);

    const selectedPermissions = watch("permissions") || [];

    useEffect(() => {
        if (isOpen) {
            setPermissionSearch("");
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
                    Object.entries(err.fieldErrors).forEach(([field, messages]) => {
                        setError(field as keyof RoleFormData, { message: messages[0] });
                    });
                }
                setSubmitError(err.message);
            }
        }
    };

    if (!isOpen) return null;

    // Filter permissions based on search
    const filteredPermissions = permissions.filter(p => 
        p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        (p.owner && p.owner.toLowerCase().includes(permissionSearch.toLowerCase()))
    );

    // Group permissions by prefix for better UI
    const groupedPermissions = filteredPermissions.reduce((acc, curr) => {
        let groupKey: keyof typeof t.form.groups = 'other';
        const name = curr.name;

        if (!curr.owner) {
            if (name.startsWith('view-dashboard-keuangan')) groupKey = 'dashboardFinancial';
            else if (name.startsWith('view-dashboard-operasi-rekon-qris')) groupKey = 'opsQris';
            else if (name.startsWith('view-dashboard-operasi-rekon')) groupKey = 'opsOther';
            else if (name.startsWith('view-sts-') || name.startsWith('view-engine-') || name.startsWith('view-job-')) groupKey = 'engine';
            else if (name.startsWith('manage-role') || name.startsWith('manage-permission') || name.startsWith('manage-rbac')) groupKey = 'rbac';
            else if (name.startsWith('manage-user')) groupKey = 'user';
            else if (name.startsWith('manage-mapping')) groupKey = 'mapping';
            else if (name.startsWith('manage-organization')) groupKey = 'organization';
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
                className="relative w-full max-w-2xl my-auto rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
                style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-6 border-b"
                    style={{ borderColor: 'var(--modal-border)', background: 'var(--modal-header-bg)' }}
                >
                    <div>
                        <h2 id="role-form-title" className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {role ? t.form.editTitle : t.form.addTitle}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            {role ? t.form.editDesc : t.form.addDesc}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body / Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col">
                    <div className="flex-1 p-6 space-y-6">
                        <FormErrors error={submitError} />

                        <FormInput
                            label={t.form.name}
                            registration={register('name')}
                            required
                            error={errors.name}
                            placeholder={t.form.namePlaceholder}
                        />

                        {/* Permissions Select (Grouped) */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <label className="block text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--label-color)' }}>
                                    {t.form.permissions} <span className="text-red-500">*</span>
                                </label>
                                
                                <div className="relative group w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
                                    <input 
                                        type="text"
                                        placeholder="Cari hak akses..."
                                        value={permissionSearch}
                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/50 transition-all font-semibold"
                                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                                    />
                                </div>
                            </div>

                            {/* Selected Summary */}
                            {selectedPermissions.length > 0 && (
                                <div className="p-4 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-1" style={{ borderColor: 'var(--brand-primary)', background: 'color-mix(in srgb, var(--brand-primary) 5%, transparent)' }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-4 h-4 text-[var(--brand-primary)]" />
                                        <span className="text-xs font-bold uppercase tracking-tight" style={{ color: 'var(--brand-primary)' }}>
                                            {selectedPermissions.length} Hak Akses Terpilih
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPermissions.map(id => {
                                            const p = permissions.find(p => p.id === id);
                                            if (!p) return null;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = selectedPermissions.filter(sid => sid !== id);
                                                        setValue("permissions", updated);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white dark:bg-gray-800 border shadow-sm hover:border-red-400 hover:text-red-500 transition-all group"
                                                    style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                                                >
                                                    {p.name.split('.').pop()}
                                                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <Controller
                                name="permissions"
                                control={control}
                                render={({ field }) => (
                                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {Object.entries(groupedPermissions).length === 0 ? (
                                            <div className="py-12 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--card-border)' }}>
                                                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Tidak ada hak akses yang cocok dengan "{permissionSearch}"</p>
                                            </div>
                                        ) : (
                                            Object.entries(groupedPermissions).map(([group, perms]) => (
                                                <div
                                                    key={group}
                                                    className="rounded-xl overflow-hidden border transition-all"
                                                    style={{
                                                        background: 'var(--group-card-bg)',
                                                        borderColor: 'var(--group-card-border)',
                                                    }}
                                                >
                                                    <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--group-card-border)', background: 'rgba(0,0,0,0.02)' }}>
                                                        <ChevronRight className="w-3 h-3 opacity-50" />
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                                                            {group}
                                                        </h4>
                                                    </div>
                                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {perms.map(p => {
                                                            const isChecked = !!field.value?.includes(p.id);
                                                            const isMatchingSearch = permissionSearch !== "" && p.name.toLowerCase().includes(permissionSearch.toLowerCase());
                                                            
                                                            return (
                                                                <FormCheckbox
                                                                    key={p.id}
                                                                    label={p.name.split('.').pop() || p.name}
                                                                    checked={isChecked}
                                                                    onChange={(checked) => {
                                                                        const current = field.value || [];
                                                                        const updated = checked
                                                                            ? [...current, p.id]
                                                                            : current.filter(id => id !== p.id);
                                                                        field.onChange(updated);
                                                                    }}
                                                                    className={clsx(
                                                                        "transition-all duration-300",
                                                                        isMatchingSearch && "ring-2 ring-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 rounded-lg p-1 -m-1"
                                                                    )}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            />
                            {errors.permissions && <p className="mt-2 text-sm text-red-500 font-semibold">{errors.permissions.message}</p>}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                        className="p-6 border-t flex items-center justify-end gap-3 sticky bottom-0 rounded-b-2xl"
                        style={{ borderColor: 'var(--modal-border)', background: 'var(--modal-footer-bg)' }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-medium rounded-xl border transition-all"
                            style={{
                                background: 'var(--btn-secondary-bg)',
                                color: 'var(--btn-secondary-text)',
                                borderColor: 'var(--btn-secondary-border)',
                            }}
                        >
                            {tc.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-[var(--color-brand-blue)] border border-transparent rounded-xl hover:bg-[var(--color-brand-blue-hover)] focus:ring-2 focus:ring-[var(--color-brand-blue)] focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm"
                        >
                            {isSubmitting ? tc.loading : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {tc.save}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
