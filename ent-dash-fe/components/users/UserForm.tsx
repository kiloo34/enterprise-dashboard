"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save } from 'lucide-react';
import { User, UserFormData, Role, Position, OrganizationUnit, Permission } from '../../types/user';
import { useTranslation } from '../../hooks/useTranslation';

import { FormInput } from '../ui/FormInput';
import { FormCheckbox } from '../ui/FormCheckbox';
import { FormSearchableSelect } from '../ui/FormSearchableSelect';

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

    const selectedPositionId = watch('position_id');
    const selectedOrgUnitId = watch('organization_unit_id');
    const [filteredSuperiors, setFilteredSuperiors] = React.useState<User[]>([]);

    useEffect(() => {
        let available = users.filter(u => u.id !== user?.id);
        const selectedPosition = positions.find(p => p.id === selectedPositionId);
        const selectedOrgUnit = organizationUnits.find(u => u.id === selectedOrgUnitId);

        if (selectedPosition && selectedPosition.level) {
            const targetLevel = selectedPosition.level - 1;
            available = available.filter(u => u.position?.level === targetLevel);
        }

        if (selectedOrgUnit && selectedOrgUnit.parent_id) {
            available = available.filter(u => u.organization_unit_id === selectedOrgUnit.parent_id);
        }

        setFilteredSuperiors(available);

        if (available.length === 1 && !user) {
            setValue('direct_superior_id', available[0].id);
        }
    }, [selectedPositionId, selectedOrgUnitId, positions, organizationUnits, users, setValue, user]);

    const handleFormSubmit = async (data: UserFormData) => {
        if (data.password === '') {
            delete data.password;
            delete data.password_confirmation;
        }
        delete data.permissions;
        await onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="relative w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col my-auto animate-in zoom-in-95 duration-200"
                style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-6 border-b rounded-t-2xl"
                    style={{ borderColor: 'var(--modal-border)', background: 'var(--modal-header-bg)' }}
                >
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {user ? t.form.editTitle : t.form.addTitle}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            {user ? t.form.editDesc : t.form.addDesc}
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
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label={t.form.name}
                            registration={register('name')}
                            required
                            error={errors.name}
                            placeholder={t.form.namePlaceholder}
                        />

                        <FormInput
                            label={t.form.email}
                            registration={register('email')}
                            required
                            error={errors.email}
                            type="email"
                            placeholder={t.form.emailPlaceholder}
                        />

                        <FormInput
                            label={t.form.password}
                            registration={register('password')}
                            required={!user}
                            error={errors.password}
                            type="password"
                            placeholder={user ? t.form.passwordPlaceholderEdit : t.form.passwordPlaceholderAdd}
                        />

                        <FormInput
                            label={t.form.passwordConfirm}
                            registration={register('password_confirmation')}
                            error={errors.password_confirmation}
                            type="password"
                            placeholder={t.form.passwordConfirmPlaceholder}
                        />

                        {/* Role Selection */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--label-color)' }}>
                                {t.form.role}
                            </label>
                            <Controller
                                name="roles"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-3">
                                        {roles.map(role => (
                                            <FormCheckbox
                                                key={role.id}
                                                label={role.name}
                                                checked={!!field.value?.includes(role.id)}
                                                onChange={(checked) => {
                                                    const current = field.value || [];
                                                    const updated = checked
                                                        ? [...current, role.id]
                                                        : current.filter(id => id !== role.id);
                                                    field.onChange(updated);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            />
                        </div>

                        {/* Position Selection */}
                        <div className="relative z-30">
                            <Controller
                                name="position_id"
                                control={control}
                                render={({ field }) => (
                                    <FormSearchableSelect
                                        label={t.form.position}
                                        options={[
                                            { value: "", label: t.form.positionPlaceholder },
                                            ...positions.map(pos => ({ value: pos.id.toString(), label: pos.name }))
                                        ]}
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(val) => field.onChange(val ? Number(val) : null)}
                                        placeholder={t.form.positionPlaceholder}
                                        searchPlaceholder="Cari posisi..."
                                        error={errors.position_id}
                                    />
                                )}
                            />
                        </div>

                        {/* Organization Unit Selection */}
                        <div className="relative z-30">
                            <Controller
                                name="organization_unit_id"
                                control={control}
                                render={({ field }) => (
                                    <FormSearchableSelect
                                        label={t.form.unit}
                                        options={[
                                            { value: "", label: t.form.unitPlaceholder },
                                            ...organizationUnits.map(unit => ({ value: unit.id.toString(), label: `${unit.name} (${unit.code})` }))
                                        ]}
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(val) => field.onChange(val ? Number(val) : null)}
                                        placeholder={t.form.unitPlaceholder}
                                        searchPlaceholder="Cari unit..."
                                        error={errors.organization_unit_id}
                                    />
                                )}
                            />
                        </div>

                        {/* Direct Superior Selection */}
                        <div className="relative z-30 md:col-span-2">
                            <Controller
                                name="direct_superior_id"
                                control={control}
                                render={({ field }) => (
                                    <FormSearchableSelect
                                        label={t.form.superior}
                                        options={[
                                            { value: "", label: t.form.superiorPlaceholder },
                                            ...filteredSuperiors.map(sup => ({ value: sup.id.toString(), label: sup.name }))
                                        ]}
                                        value={field.value ? field.value.toString() : ""}
                                        onChange={(val) => field.onChange(val ? Number(val) : null)}
                                        placeholder={t.form.superiorPlaceholder}
                                        searchPlaceholder="Cari atasan..."
                                        error={errors.direct_superior_id}
                                    />
                                )}
                            />
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div
                        className="p-6 border-t flex items-center justify-end gap-3 rounded-b-2xl"
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
