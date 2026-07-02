"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import type { ColumnSchema } from "@/services/DataExplorerService";

interface DynamicFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Record<string, unknown>) => void;
    columns: ColumnSchema[];
    initialData?: Record<string, unknown> | null;
    title: string;
    isLoading?: boolean;
}

/**
 * Renders a form dialog dynamically based on column schema from the backend.
 * Supports create (empty) and edit (pre-filled) modes.
 */
export function DynamicFormDialog({
    isOpen,
    onClose,
    onSubmit,
    columns,
    initialData = null,
    title,
    isLoading = false,
}: DynamicFormDialogProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (isOpen) {
            reset(initialData || {});
        }
    }, [isOpen, initialData, reset]);

    if (!isOpen) return null;

    // Filter out primary key columns for create mode
    const editableColumns = columns.filter((col) => {
        if (!initialData && col.primary_key) return false;
        return true;
    });

    const getInputType = (colType: string): string => {
        const upper = colType.toUpperCase();
        if (upper.includes("INT") || upper.includes("FLOAT") || upper.includes("BIGINT")) return "number";
        if (upper.includes("BOOL")) return "checkbox";
        if (upper.includes("DATE") || upper.includes("TIMESTAMP")) return "datetime-local";
        return "text";
    };

    const handleFormSubmit = (data: Record<string, unknown>) => {
        // Clean up empty strings to null for nullable fields
        const cleaned: Record<string, unknown> = {};
        for (const col of editableColumns) {
            const val = data[col.name];
            if (val === "" && col.nullable) {
                cleaned[col.name] = null;
            } else if (getInputType(col.type) === "number" && val !== null && val !== "") {
                cleaned[col.name] = Number(val);
            } else if (getInputType(col.type) === "checkbox") {
                cleaned[col.name] = Boolean(val);
            } else {
                cleaned[col.name] = val;
            }
        }
        onSubmit(cleaned);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border"
                style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--card-border)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
                    style={{
                        background: "var(--card-bg)",
                        borderColor: "var(--card-border)",
                    }}
                >
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-4 space-y-4">
                    {editableColumns.map((col) => {
                        const inputType = getInputType(col.type);

                        if (inputType === "checkbox") {
                            return (
                                <label key={col.name} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...register(col.name)}
                                        disabled={col.primary_key}
                                        className="w-4 h-4 rounded border accent-blue-500"
                                    />
                                    <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                        {col.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </span>
                                </label>
                            );
                        }

                        return (
                            <div key={col.name}>
                                <label
                                    className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    {col.name.replace(/_/g, " ")}
                                    {!col.nullable && !col.primary_key && (
                                        <span className="text-red-400 ml-1">*</span>
                                    )}
                                </label>
                                <input
                                    type={inputType}
                                    step={inputType === "number" ? "any" : undefined}
                                    {...register(col.name, {
                                        required: !col.nullable && !col.primary_key
                                            ? `${col.name} is required`
                                            : false,
                                    })}
                                    disabled={col.primary_key}
                                    placeholder={col.primary_key ? "(auto)" : ""}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                                    style={{
                                        background: "var(--input-bg)",
                                        color: "var(--input-text)",
                                        borderColor: "var(--input-border)",
                                    }}
                                />
                                {errors[col.name] && (
                                    <p className="text-xs text-red-400 mt-1">
                                        {String(errors[col.name]?.message)}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    {/* Footer */}
                    <div
                        className="flex justify-end gap-3 pt-4 border-t"
                        style={{ borderColor: "var(--card-border)" }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-xl border transition-colors hover:bg-[var(--card-bg-hover)]"
                            style={{
                                color: "var(--text-secondary)",
                                borderColor: "var(--card-border)",
                            }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-500 disabled:opacity-50 shadow-sm"
                        >
                            {isLoading ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Tambah Data"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
