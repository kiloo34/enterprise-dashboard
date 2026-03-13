"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";
import { permissionApi } from "../../utils/api/permissionApi";
import type { Permission } from "../../types/user";
import { toast } from "sonner";
import { useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";

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
        description: z.string().max(500).optional(),
        owner: z.string().max(255).optional(),
    });

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

    type PermissionFormData = z.infer<typeof permissionSchema>;

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {initialData ? t.form.editTitle : t.form.addTitle}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {initialData ? t.form.editDesc : t.form.addDesc}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="permission-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.form.name} <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("name")}
                                type="text"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-gray-100"
                                placeholder={t.form.namePlaceholder}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 text-gray-400 text-xs italic">
                            {t.form.guard}: {initialData?.guard_name || "web"} (Read-only)
                        </div>

                        {/* Owner Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.form.owner}
                            </label>
                            <input
                                {...register("owner")}
                                type="text"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-gray-100"
                                placeholder={t.form.ownerPlaceholder}
                            />
                        </div>

                        {/* Description Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.form.description}
                            </label>
                            <textarea
                                {...register("description")}
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-gray-100 resize-none"
                                placeholder={t.form.descriptionPlaceholder}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        disabled={isSubmitting}
                    >
                        {tc.cancel}
                    </button>
                    <button
                        type="submit"
                        form="permission-form"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            tc.save
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
