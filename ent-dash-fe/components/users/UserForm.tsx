"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, AlertCircle } from 'lucide-react';
import { User, UserFormData, Role, Position, OrganizationUnit, Permission } from '../../types/user';
import { useTranslation } from '../../hooks/useTranslation';
import { SearchableSelect } from '../ui/SearchableSelect';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => Promise<void>;
    user?: User;
    roles: Role[];
    permissions: Permission[];
    positions: Position[];
    organizationUnits: OrganizationUnit[];
    users: User[];
    isSubmitting: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    user,
    roles,
    permissions: permissionList,
    positions,
    organizationUnits,
    users,
    isSubmitting
}) => {
    const t = useTranslation("Users");
    const tc = useTranslation("Common");

    const userSchema = z.object({
        name: z.string().min(1, t.form.validation.nameRequired).max(255, t.form.validation.nameMax),
        email: z.string().email(t.form.validation.emailInvalid).max(255, t.form.validation.nameMax),
        password: z.string().min(8, t.form.validation.passwordMin).optional().or(z.literal('')),
        password_confirmation: z.string().optional().or(z.literal('')),
        position_id: z.number().nullable().optional(),
        organization_unit_id: z.number().nullable().optional(),
        direct_superior_id: z.number().nullable().optional(),
        roles: z.array(z.number()).default([]),
        permissions: z.array(z.number()).default([]),
    }).refine((data) => {
        // If password is provided, password_confirmation must match
        if (data.password && data.password !== '') {
            return data.password === data.password_confirmation;
        }
        return true;
    }, {
        message: t.form.validation.passwordMismatch,
        path: ["password_confirmation"],
    });

    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            position_id: null,
            organization_unit_id: null,
            direct_superior_id: null,
            roles: [],
            permissions: [],
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (user) {
                reset({
                    name: user.name,
                    email: user.email,
                    password: '',
                    password_confirmation: '',
                    position_id: user.position_id,
                    organization_unit_id: user.organization_unit_id,
                    direct_superior_id: user.direct_superior_id,
                    roles: user.roles?.map(r => r.id) || [],
                    permissions: user.permissions?.map(p => p.id) || [],
                });
            } else {
                reset({
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                    position_id: null,
                    organization_unit_id: null,
                    direct_superior_id: null,
                    roles: [],
                    permissions: [],
                });
            }
        }
    }, [isOpen, user, reset]);

    // eslint-disable-next-line react-hooks/incompatible-library  
    const selectedPositionId = watch('position_id');
    const selectedOrgUnitId = watch('organization_unit_id');
    const [filteredSuperiors, setFilteredSuperiors] = React.useState<User[]>([]);

    useEffect(() => {
        let available = users.filter(u => u.id !== user?.id);

        const selectedPosition = positions.find(p => p.id === selectedPositionId);
        const selectedOrgUnit = organizationUnits.find(u => u.id === selectedOrgUnitId);

        // Filter valid superiors
        if (selectedPosition && selectedPosition.level) {
            const targetLevel = selectedPosition.level - 1;
            available = available.filter(u => u.position?.level === targetLevel);
        }

        if (selectedOrgUnit && selectedOrgUnit.parent_id) {
            available = available.filter(u => u.organization_unit_id === selectedOrgUnit.parent_id);
        }

        setFilteredSuperiors(available);

        // Auto-select rule: "ketika user officer ditambahkan maka atasan otomatis AVP"
        // Also applies generally if there's only 1 matching superior
        if (available.length === 1 && !user) {
            // Only auto-select when adding a new user, prevent overwriting deliberate edits
            setValue('direct_superior_id', available[0].id);
        }
    }, [selectedPositionId, selectedOrgUnitId, positions, organizationUnits, users, setValue, user]);

    const handleFormSubmit = async (data: UserFormData) => {
        // Clean up empty passwords so we don't send them
        if (data.password === '') {
            delete data.password;
            delete data.password_confirmation;
        }

        // Remove permissions from payload since it's no longer managed via this form
        delete data.permissions;

        await onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col my-auto animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 rounded-t-2xl bg-white dark:bg-gray-900">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {user ? t.form.editTitle : t.form.addTitle}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {user ? t.form.editDesc : t.form.addDesc}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body / Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.name} <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('name')}
                                type="text"
                                className={`w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200'}`}
                                placeholder={t.form.namePlaceholder}
                            />
                            {errors.name && (
                                <p className="mt-2 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.email} <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className={`w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200'}`}
                                placeholder={t.form.emailPlaceholder}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.password} {!user && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                {...register('password')}
                                type="password"
                                className={`w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200'}`}
                                placeholder={user ? t.form.passwordPlaceholderEdit : t.form.passwordPlaceholderAdd}
                            />
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Password Confirm */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.passwordConfirm}
                            </label>
                            <input
                                {...register('password_confirmation')}
                                type="password"
                                className={`w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.password_confirmation ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200'}`}
                                placeholder={t.form.passwordConfirmPlaceholder}
                            />
                            {errors.password_confirmation && (
                                <p className="mt-2 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1 shrink-0" />
                                    {errors.password_confirmation.message}
                                </p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.role}
                            </label>
                            <Controller
                                name="roles"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-3">
                                        {roles.map(role => (
                                            <label key={role.id} className="flex items-center min-w-[200px] p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    checked={field.value?.includes(role.id)}
                                                    onChange={(e) => {
                                                        const current = field.value || [];
                                                        const updated = e.target.checked
                                                            ? [...current, role.id]
                                                            : current.filter(id => id !== role.id);
                                                        field.onChange(updated);
                                                    }}
                                                />
                                                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{role.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            />
                        </div>



                        {/* Position Selection */}
                        <div className="relative z-30">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.position}
                            </label>
                            <Controller
                                name="position_id"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={[
                                            { value: "", label: t.form.positionPlaceholder },
                                            ...positions.map(pos => ({ value: pos.id.toString(), label: pos.name }))
                                        ]}
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(val) => field.onChange(val ? Number(val) : null)}
                                        placeholder={t.form.positionPlaceholder}
                                        searchPlaceholder="Cari posisi..."
                                    />
                                )}
                            />
                        </div>

                        {/* Organization Unit Selection */}
                        <div className="relative z-30">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.unit}
                            </label>
                            <Controller
                                name="organization_unit_id"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={[
                                            { value: "", label: t.form.unitPlaceholder },
                                            ...organizationUnits.map(unit => ({ value: unit.id.toString(), label: `${unit.name} (${unit.code})` }))
                                        ]}
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(val) => field.onChange(val ? Number(val) : null)}
                                        placeholder={t.form.unitPlaceholder}
                                        searchPlaceholder="Cari unit..."
                                    />
                                )}
                            />
                        </div>

                        {/* Direct Superior Selection */}
                        <div className="relative z-30 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.superior}
                            </label>
                            <Controller
                                name="direct_superior_id"
                                control={control}
                                render={({ field }) => (
                                    <SearchableSelect
                                        options={[
                                            { value: "", label: t.form.superiorPlaceholder },
                                            ...filteredSuperiors.map(sup => ({ value: sup.id.toString(), label: sup.name }))
                                        ]}
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(val) => field.onChange(val ? Number(val) : null)}
                                        placeholder={t.form.superiorPlaceholder}
                                        searchPlaceholder="Cari atasan..."
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        >
                            {tc.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm"
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
