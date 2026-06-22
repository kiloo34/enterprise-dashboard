"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Save } from "lucide-react";
import { permissionApi } from "../../utils/api/permissionApi";
import type { Permission } from "../../types/user";
import { toast } from "sonner";
import { useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";

import { FormInput } from "../ui/FormInput";

interface PermissionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Permission;
}

export function PermissionForm({ isOpen, onClose, onSuccess, initialData }: PermissionFormProps) {
    const t = useTranslation("Permissions");
    const tc = useTranslation("Common");

    const permissionSchema = z.object({
        name: z.string().min(1, t.form.validation.nameRequired).max(255),
        guard_name: z.string().min(1, t.form.validation.guardRequired),
        description: z.string().max(500).optional().or(z.literal('')),
        owner: z.string().max(255).optional().or(z.literal('')),
    });

    type PermissionFormData = z.infer<typeof permissionSchema>;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PermissionFormData>({
        resolver: zodResolver(permissionSchema),
        defaultValues: {
            name: "",
            guard_name: "web",
            description: "",
            owner: "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    guard_name: initialData.guard_name,
                    description: initialData.description || "",
                    owner: initialData.owner || "",
                });
            } else {
                reset({
                    name: "",
                    guard_name: "web",
                    description: "",
                    owner: "",
                });
            }
        }
    }, [isOpen, initialData, reset]);

    if (!isOpen) return null;

    const onSubmit = async (data: PermissionFormData) => {
        try {
            if (initialData) {
                await permissionApi.update(initialData.id, data);
                toast.success(t.form.successUpdate);
            } else {
                await permissionApi.create(data);
                toast.success(t.form.successCreate);
            }
            onSuccess();
            onClose();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || t.form.errorSave;
            toast.error(message);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-md my-auto rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
                style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-6 border-b rounded-t-2xl"
                    style={{ borderColor: 'var(--modal-border)', background: 'var(--modal-header-bg)' }}
                >
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {initialData ? t.form.editTitle : t.form.addTitle}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            {initialData ? t.form.editDesc : t.form.addDesc}
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

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="permission-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FormInput
                            label={t.form.name}
                            registration={register("name")}
                            required
                            error={errors.name}
                            placeholder={t.form.namePlaceholder}
                        />

                        <div className="text-xs italic px-1" style={{ color: 'var(--label-muted)' }}>
                            {t.form.guard}: {initialData?.guard_name || "web"} (Read-only)
                        </div>

                        <FormInput
                            label={t.form.owner}
                            registration={register("owner")}
                            placeholder={t.form.ownerPlaceholder}
                        />

                        <FormInput
                            label={t.form.description}
                            registration={register("description")}
                            multiline
                            rows={3}
                            placeholder={t.form.descriptionPlaceholder}
                        />
                    </form>
                </div>

                {/* Footer */}
                <div
                    className="p-6 border-t flex justify-end gap-3 mt-auto rounded-b-2xl"
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
                        form="permission-form"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 min-w-[120px] justify-center"
                    >
                        {isSubmitting ? tc.loading : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {tc.save}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
