"use client";

import { useAdminStats } from "@/services/AdminService";
import {
    Users,
    Building2,
    UploadCloud,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldCheck,
    RefreshCw,
    FileText,
    TrendingUp,
    Server,
    Database,
    Cpu,
} from "lucide-react";
import clsx from "clsx";
import { StatCard } from "@/components/ui/StatCard";

// ---------- helpers ----------

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    COMPLETED: { label: "Selesai", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
    FAILED: { label: "Gagal", color: "text-red-500 bg-red-500/10", icon: XCircle },
    PROCESSING: { label: "Proses", color: "text-blue-500 bg-blue-500/10", icon: RefreshCw },
    PENDING: { label: "Antre", color: "text-amber-500 bg-amber-500/10", icon: Clock },
    CANCELLED: { label: "Dibatalkan", color: "text-gray-500 bg-gray-500/10", icon: XCircle },
};

// ---------- sub-components ----------


function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:backdrop-blur-sm shadow-sm dark:shadow-xl overflow-hidden transition-all">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function ImportStatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? { label: status, color: "text-gray-400 bg-gray-400/10", icon: Clock };
    const Icon = cfg.icon;
    return (
        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", cfg.color)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function SystemServiceBadge({ name, icon: Icon }: { name: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 shadow-sm dark:shadow-none">
            <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</span>
            <div className="ml-auto flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Online</span>
            </div>
        </div>
    );
}

// ---------- Skeleton ----------

function Skeleton({ className }: { className?: string }) {
    return <div className={clsx("animate-pulse rounded-xl bg-gray-200 dark:bg-white/10", className)} />;
}

// ---------- Main page ----------

export default function AdminDashboard() {
    const { stats, isLoading, isError, mutate } = useAdminStats();

    const importRate = stats
        ? stats.imports.total > 0
            ? Math.round((stats.imports.completed / stats.imports.total) * 100)
            : 0
        : 0;

    return (
        <div className="min-h-screen bg-transparent p-6 lg:p-8 space-y-8 overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        Superadmin Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitoring sistem, pengguna, dan pipeline data importasi</p>
                </div>
                <button
                    onClick={() => mutate()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all font-semibold shadow-sm dark:shadow-none"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* System health */}
            <SectionCard title="Status Layanan Sistem">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SystemServiceBadge name="API Backend" icon={Server} />
                    <SystemServiceBadge name="Database PostgreSQL" icon={Database} />
                    <SystemServiceBadge name="Redis Cache" icon={Cpu} />
                </div>
            </SectionCard>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)
                ) : (
                    <>
                        <StatCard
                            icon={Users}
                            label="Total Pengguna"
                            value={stats?.users.total ?? 0}
                            sub={`+${stats?.users.recent_30_days ?? 0} dalam 30 hari terakhir`}
                            color="bg-gradient-to-br from-violet-600 to-purple-700"
                        />
                        <StatCard
                            icon={Building2}
                            label="Unit Organisasi"
                            value={stats?.organization.total_units ?? 0}
                            color="bg-gradient-to-br from-blue-600 to-cyan-700"
                        />
                        <StatCard
                            icon={UploadCloud}
                            label="Total Import"
                            value={stats?.imports.total ?? 0}
                            sub={`${stats?.imports.pending ?? 0} sedang antri/proses`}
                            color="bg-gradient-to-br from-amber-500 to-orange-600"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Tingkat Keberhasilan"
                            value={`${importRate}%`}
                            sub={`${stats?.imports.completed ?? 0} selesai · ${stats?.imports.failed ?? 0} gagal`}
                            color="bg-gradient-to-br from-emerald-600 to-teal-700"
                        />
                    </>
                )}
            </div>

            {/* Import success bar */}
            {!isLoading && (stats?.imports.total ?? 0) > 0 && (
                <SectionCard title="Pipeline Import Data">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-gray-400 font-semibold">
                            <span>Tingkat Keberhasilan</span>
                            <span className="text-emerald-400">{importRate}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                                style={{ width: `${importRate}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            {[
                                { label: "Selesai", value: stats?.imports.completed, color: "text-emerald-400" },
                                { label: "Gagal", value: stats?.imports.failed, color: "text-red-400" },
                                { label: "Antri / Proses", value: stats?.imports.pending, color: "text-amber-400" },
                            ].map((item) => (
                                <div key={item.label} className="text-center">
                                    <p className={clsx("text-2xl font-black", item.color)}>{item.value ?? 0}</p>
                                    <p className="text-xs text-gray-500 mt-1 font-semibold">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Bottom: recent imports + recent users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent imports */}
                <SectionCard title="Import Terbaru">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                        </div>
                    ) : (stats?.imports.recent_list.length ?? 0) === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">Belum ada data import</p>
                    ) : (
                        <div className="space-y-2">
                            {stats?.imports.recent_list.map((imp) => (
                                <div
                                    key={imp.id}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{imp.file_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {imp.target_table} · {formatDate(imp.created_at)}
                                        </p>
                                    </div>
                                    <ImportStatusBadge status={imp.status} />
                                    {imp.total_rows != null && (
                                        <span className="text-xs text-gray-500 shrink-0">
                                            {imp.processed_rows ?? 0}/{imp.total_rows} baris
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                {/* Recent users */}
                <SectionCard title="Pengguna Terdaftar Terbaru">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                        </div>
                    ) : (stats?.users.recent_list.length ?? 0) === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">Belum ada pengguna</p>
                    ) : (
                        <div className="space-y-2">
                            {stats?.users.recent_list.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-black text-white">
                                            {u.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 shrink-0">{formatDate(u.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {isError && (
                <div className="text-center text-sm text-red-400 py-4">
                    Gagal memuat data sistem. Pastikan backend berjalan.
                </div>
            )}
        </div>
    );
}
