"use client";

import React from "react";
import { Edit2, X, Check, Languages } from "lucide-react";
import { useTranslationEditor } from "./hooks/useTranslationEditor";
import { TableLoadingSkeleton } from "@/components/ui/TableLoadingSkeleton";
import { useTranslationsContext } from "@/components/TranslationsProvider";

export default function TranslationsPage() {
    const { isLoading } = useTranslationsContext();
    const {
        namespaces,
        activeNamespace,
        setActiveNamespace,
        activeLang,
        setActiveLang,
        rows,
        editingKey,
        saving,
        getDraft,
        startEdit,
        cancelEdit,
        updateDraft,
        saveEdit,
    } = useTranslationEditor();

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                    <Languages size={18} color="#fff" />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                        Manajemen Terjemahan
                    </h1>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Edit teks UI per namespace dan bahasa secara langsung dari database.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: namespace list */}
                <aside
                    className="w-full md:w-44 shrink-0 rounded-xl border overflow-hidden"
                    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                >
                    <div className="px-3 py-2 border-b text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: "var(--card-border)", color: "var(--text-muted)" }}>
                        Namespace
                    </div>
                    {namespaces.map((ns) => (
                        <button
                            key={ns}
                            onClick={() => setActiveNamespace(ns)}
                            className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                            style={{
                                fontWeight: activeNamespace === ns ? 700 : 400,
                                background: activeNamespace === ns ? "color-mix(in srgb, #6366f1 10%, transparent)" : "transparent",
                                color: activeNamespace === ns ? "#6366f1" : "var(--text-secondary)",
                                borderLeft: activeNamespace === ns ? "3px solid #6366f1" : "3px solid transparent",
                            }}
                        >
                            {ns}
                        </button>
                    ))}
                </aside>

                {/* Right: translation table */}
                <div className="flex-1 min-w-0">
                    {/* Language toggle */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                            Bahasa:
                        </span>
                        {(["ID", "EN"] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setActiveLang(lang)}
                                className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                                style={{
                                    background: activeLang === lang ? "#6366f1" : "var(--bg-secondary)",
                                    color: activeLang === lang ? "#fff" : "var(--text-muted)",
                                    border: `1px solid ${activeLang === lang ? "#6366f1" : "var(--border)"}`,
                                }}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <TableLoadingSkeleton />
                    ) : (
                        <div
                            className="rounded-xl border overflow-hidden"
                            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                        >
                            {/* Table header */}
                            <div
                                className="grid gap-4 px-4 py-2.5 border-b text-[11px] font-bold uppercase tracking-widest"
                                style={{ gridTemplateColumns: "2fr 3fr 80px", borderColor: "var(--card-border)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}
                            >
                                <span>Key</span>
                                <span>Nilai</span>
                                <span>Aksi</span>
                            </div>

                            {rows.length === 0 && (
                                <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                                    Tidak ada data terjemahan. Pastikan backend sudah berjalan dan seed sudah dieksekusi.
                                </div>
                            )}

                            {rows.map((row) => {
                                const isEditing = editingKey === row.key;
                                const isSaving = saving === row.key;
                                return (
                                    <div
                                        key={row.key}
                                        className="grid gap-4 px-4 py-3 items-start border-b last:border-b-0 transition-colors"
                                        style={{
                                            gridTemplateColumns: "2fr 3fr 80px",
                                            borderColor: "var(--card-border)",
                                        }}
                                    >
                                        {/* Key */}
                                        <code
                                            className="text-xs break-all"
                                            style={{
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                color: "var(--text-primary)",
                                                background: "var(--bg-secondary)",
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                display: "inline-block",
                                            }}
                                        >
                                            {row.key}
                                        </code>

                                        {/* Value */}
                                        {isEditing ? (
                                            <textarea
                                                autoFocus
                                                rows={2}
                                                value={getDraft(row.key)}
                                                onChange={(e) => updateDraft(row.key, e.target.value)}
                                                className="w-full rounded-lg px-3 py-2 text-sm resize-vertical"
                                                style={{
                                                    background: "var(--input-bg)",
                                                    border: "1px solid #6366f1",
                                                    color: "var(--text-primary)",
                                                    outline: "none",
                                                    boxShadow: "0 0 0 3px color-mix(in srgb, #6366f1 15%, transparent)",
                                                }}
                                            />
                                        ) : (
                                            <span className="text-sm break-words" style={{ color: "var(--text-secondary)" }}>
                                                {row.value}
                                            </span>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-start gap-1.5 pt-0.5">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => saveEdit(row.key, row.value)}
                                                        disabled={isSaving}
                                                        title="Simpan"
                                                        className="flex items-center justify-center w-7 h-7 rounded-md transition-opacity"
                                                        style={{
                                                            background: "#22c55e",
                                                            color: "#fff",
                                                            border: "none",
                                                            cursor: isSaving ? "not-allowed" : "pointer",
                                                            opacity: isSaving ? 0.6 : 1,
                                                        }}
                                                    >
                                                        <Check size={13} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        title="Batal"
                                                        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
                                                        style={{
                                                            border: "1px solid var(--border)",
                                                            background: "transparent",
                                                            color: "var(--text-muted)",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(row.key, row.value)}
                                                    title="Edit"
                                                    className="flex items-center justify-center w-7 h-7 rounded-md transition-all"
                                                    style={{
                                                        border: "1px solid var(--border)",
                                                        background: "transparent",
                                                        color: "var(--text-muted)",
                                                        cursor: "pointer",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1";
                                                        (e.currentTarget as HTMLButtonElement).style.color = "#6366f1";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                                                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                                                    }}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
