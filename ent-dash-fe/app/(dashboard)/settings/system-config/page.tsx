"use client";

import { useState, useMemo } from "react";
import { Settings, RefreshCw, Save, Edit2, X, Check, Lock, Shield, Database, Search } from "lucide-react";
import { useSystemConfigs, SystemConfigService, SystemConfig, ConfigValueType } from "@/services/SystemConfigService";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ConfigValueType, string> = {
    string: "Teks",
    integer: "Angka",
    boolean: "Ya/Tidak",
    list: "Daftar",
    json: "JSON",
};

const TYPE_BADGE_COLOR: Record<ConfigValueType, string> = {
    string: "var(--color-info, #3b82f6)",
    integer: "var(--color-success, #22c55e)",
    boolean: "var(--color-warning, #f59e0b)",
    list: "var(--color-purple, #a855f7)",
    json: "var(--color-danger, #ef4444)",
};

const GROUP_ICONS: Record<string, React.ReactElement> = {
    auth: <Shield size={14} />,
    cors: <Database size={14} />,
    system: <Settings size={14} />,
    security: <Lock size={14} />,
};

function groupKey(key: string) {
    return key.split(".")[0] ?? "other";
}

function groupLabel(group: string) {
    const map: Record<string, string> = {
        auth: "Autentikasi",
        cors: "CORS",
        system: "Sistem",
        security: "Keamanan",
        other: "Lainnya",
    };
    return map[group] ?? group.charAt(0).toUpperCase() + group.slice(1);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ConfigValueType }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: "999px",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: `color-mix(in srgb, ${TYPE_BADGE_COLOR[type]} 15%, transparent)`,
                color: TYPE_BADGE_COLOR[type],
                border: `1px solid color-mix(in srgb, ${TYPE_BADGE_COLOR[type]} 30%, transparent)`,
            }}
        >
            {TYPE_LABELS[type]}
        </span>
    );
}

function ConfigRow({
    config,
    onSave,
}: {
    config: SystemConfig;
    onSave: (key: string, value: string) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(config.value);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (draft === config.value) { setEditing(false); return; }
        setSaving(true);
        try {
            await onSave(config.key, draft);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => { setDraft(config.value); setEditing(false); };

    return (
        <tr
            style={{
                borderBottom: "1px solid var(--border)",
                transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover, rgba(255,255,255,0.03))")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
            {/* Key */}
            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <code
                        style={{
                            fontSize: "0.8rem",
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            color: "var(--text-primary)",
                            background: "var(--bg-secondary)",
                            padding: "2px 6px",
                            borderRadius: 4,
                        }}
                    >
                        {config.key}
                    </code>
                    {config.is_sensitive && (
                        <Lock size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    )}
                </div>
                {config.description && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                        {config.description}
                    </p>
                )}
            </td>

            {/* Type */}
            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                <TypeBadge type={config.value_type} />
            </td>

            {/* Value */}
            <td style={{ padding: "14px 16px", verticalAlign: "middle", minWidth: 240 }}>
                {editing ? (
                    config.value_type === "boolean" ? (
                        <select
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            style={{
                                background: "var(--input-bg)",
                                border: "1px solid var(--color-primary, #6366f1)",
                                color: "var(--text-primary)",
                                borderRadius: 8,
                                padding: "6px 10px",
                                fontSize: "0.85rem",
                                width: "100%",
                            }}
                        >
                            <option value="true">true</option>
                            <option value="false">false</option>
                        </select>
                    ) : (
                        <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            rows={config.value_type === "list" ? 3 : 1}
                            style={{
                                width: "100%",
                                background: "var(--input-bg)",
                                border: "1px solid var(--color-primary, #6366f1)",
                                color: "var(--text-primary)",
                                borderRadius: 8,
                                padding: "6px 10px",
                                fontSize: "0.83rem",
                                fontFamily: config.value_type === "json" ? "'JetBrains Mono', monospace" : "inherit",
                                resize: "vertical",
                                outline: "none",
                                boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-primary, #6366f1) 15%, transparent)",
                            }}
                        />
                    )
                ) : (
                    <span
                        style={{
                            fontFamily: config.value_type === "json" || config.value_type === "list"
                                ? "'JetBrains Mono', monospace"
                                : "inherit",
                            fontSize: "0.83rem",
                            color: config.is_sensitive ? "var(--text-muted)" : "var(--text-primary)",
                            wordBreak: "break-word",
                        }}
                    >
                        {config.is_sensitive ? "••••••••" : config.value}
                    </span>
                )}
            </td>

            {/* Updated by */}
            <td style={{ padding: "14px 16px", verticalAlign: "middle", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                {config.updated_by ?? "—"}
            </td>

            {/* Actions */}
            <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                {!config.is_editable ? (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4 }}>
                        <Lock size={12} /> Read-only
                    </span>
                ) : editing ? (
                    <div style={{ display: "flex", gap: 6 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            title="Simpan"
                            style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 30, height: 30, borderRadius: 6, border: "none", cursor: "pointer",
                                background: "var(--color-success, #22c55e)", color: "#fff",
                                opacity: saving ? 0.6 : 1, transition: "opacity 0.2s",
                            }}
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={handleCancel}
                            title="Batal"
                            style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)",
                                cursor: "pointer", background: "transparent", color: "var(--text-muted)",
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => { setDraft(config.value); setEditing(true); }}
                        title="Edit"
                        style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)",
                            cursor: "pointer", background: "transparent", color: "var(--text-muted)",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary, #6366f1)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary, #6366f1)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                        }}
                    >
                        <Edit2 size={14} />
                    </button>
                )}
            </td>
        </tr>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SystemConfigPage() {
    const { configs, isLoading, isError } = useSystemConfigs();
    const [saving, setSaving] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [search, setSearch] = useState("");

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (key: string, value: string) => {
        setSaving(key);
        try {
            await SystemConfigService.updateOne(key, { value });
            showToast(`Berhasil menyimpan '${key}'`, true);
        } catch {
            showToast(`Gagal menyimpan '${key}'`, false);
        } finally {
            setSaving(null);
        }
    };

    const handleRefreshCache = async () => {
        setRefreshing(true);
        try {
            await SystemConfigService.refreshCache();
            showToast("Cache konfigurasi berhasil diperbarui", true);
        } catch {
            showToast("Gagal memperbarui cache", false);
        } finally {
            setRefreshing(false);
        }
    };

    // Group + filter
    const filtered = useMemo(() =>
        configs.filter(c =>
            c.key.toLowerCase().includes(search.toLowerCase()) ||
            (c.description ?? "").toLowerCase().includes(search.toLowerCase())
        ),
        [configs, search]
    );

    const grouped = useMemo(() => {
        const map: Record<string, SystemConfig[]> = {};
        for (const cfg of filtered) {
            const g = groupKey(cfg.key);
            (map[g] = map[g] ?? []).push(cfg);
        }
        return map;
    }, [filtered]);

    return (
        <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
                    }}>
                        <Settings size={20} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            Konfigurasi Sistem
                        </h1>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Kelola konfigurasi aplikasi secara dinamis tanpa restart layanan
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleRefreshCache}
                    disabled={refreshing}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)",
                        background: "var(--card-bg)", color: "var(--text-secondary)",
                        cursor: refreshing ? "not-allowed" : "pointer", fontSize: "0.83rem",
                        transition: "all 0.2s",
                    }}
                >
                    <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                    Refresh Cache
                </button>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 24, maxWidth: 380 }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                    type="text"
                    placeholder="Cari konfigurasi..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        width: "100%", padding: "9px 12px 9px 36px",
                        background: "var(--input-bg)", border: "1px solid var(--border)",
                        borderRadius: 8, color: "var(--text-primary)", fontSize: "0.85rem",
                        outline: "none", boxSizing: "border-box",
                        transition: "border-color 0.2s",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--color-primary, #6366f1)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
            </div>

            {/* Loading / Error */}
            {isLoading && (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
                    Memuat konfigurasi...
                </div>
            )}
            {isError && (
                <div style={{
                    padding: "16px", borderRadius: 10, background: "color-mix(in srgb, #ef4444 10%, transparent)",
                    border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)",
                    color: "#ef4444", fontSize: "0.85rem",
                }}>
                    Gagal memuat konfigurasi. Pastikan Anda memiliki akses super-admin.
                </div>
            )}

            {/* Config Groups */}
            {!isLoading && !isError && Object.entries(grouped).map(([group, items]) => (
                <div
                    key={group}
                    style={{
                        marginBottom: 24,
                        background: "var(--card-bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        overflow: "hidden",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    {/* Group Header */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg-secondary)",
                    }}>
                        <span style={{ color: "var(--color-primary, #6366f1)" }}>
                            {GROUP_ICONS[group] ?? <Settings size={14} />}
                        </span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            {groupLabel(group)}
                        </span>
                        <span style={{
                            marginLeft: "auto", fontSize: "0.72rem", padding: "1px 7px",
                            borderRadius: 999, background: "var(--bg-tertiary, rgba(99,102,241,0.1))",
                            color: "var(--text-muted)",
                        }}>
                            {items.length}
                        </span>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    {["Kunci / Deskripsi", "Tipe", "Nilai", "Diubah Oleh", "Aksi"].map(h => (
                                        <th key={h} style={{
                                            padding: "10px 16px", textAlign: "left",
                                            fontSize: "0.72rem", fontWeight: 600,
                                            color: "var(--text-muted)", letterSpacing: "0.07em",
                                            textTransform: "uppercase",
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(cfg => (
                                    <ConfigRow key={cfg.key} config={cfg} onSave={handleSave} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
                    padding: "12px 20px", borderRadius: 10,
                    background: toast.ok
                        ? "color-mix(in srgb, #22c55e 15%, var(--card-bg))"
                        : "color-mix(in srgb, #ef4444 15%, var(--card-bg))",
                    border: `1px solid ${toast.ok ? "#22c55e" : "#ef4444"}`,
                    color: toast.ok ? "#22c55e" : "#ef4444",
                    fontSize: "0.85rem", fontWeight: 500,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    animation: "slideInUp 0.25s ease",
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    {toast.ok ? <Check size={14} /> : <X size={14} />}
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
