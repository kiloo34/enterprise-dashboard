"use client";

import React, { useState } from "react";
import { GitMerge, RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import {
    useNetworkStats,
    triggerReconcile,
    type ReconNetwork,
    type NetworkReconStats,
} from "@/services/ReconService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function calcMatchRate(stats: NetworkReconStats | null): string {
    if (!stats) return "—";
    const total = stats.settledAmount + stats.unsettledAmount;
    if (total === 0) return "0%";
    return `${Math.round((stats.settledAmount / total) * 100)}%`;
}

// ── Network Card ─────────────────────────────────────────────────────────────

interface NetworkCardProps {
    network: ReconNetwork;
    label: string;
    description: string;
}

function NetworkCard({ network, label, description }: NetworkCardProps) {
    const { stats, isLoading, mutate } = useNetworkStats(network);
    const [triggering, setTriggering] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleConfirmTrigger = async () => {
        setConfirmOpen(false);
        setTriggering(true);
        try {
            const result = await triggerReconcile(network);
            toast.success(`Rekonsiliasi ${label} berhasil dipicu`, {
                description: `Task ID: ${result.task_id}`,
            });
            setTimeout(() => mutate(), 3000);
        } catch {
            toast.error(`Gagal memicu rekonsiliasi ${label}`);
        } finally {
            setTriggering(false);
        }
    };

    const hasDiscrepancy = stats && stats.totalDiscrepancyAmount > 0;
    const badgeStatus = isLoading ? "pending" : hasDiscrepancy ? "failed" : "success";
    const badgeLabel = isLoading ? "Loading" : hasDiscrepancy ? "Ada Selisih" : "Seimbang";

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex-1 min-w-0 pr-3">
                        <CardTitle className="text-base">{label}</CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {description}
                        </p>
                    </div>
                    <StatusBadge status={badgeStatus} label={badgeLabel} />
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Total Transaksi</p>
                            <p className="font-bold text-xl text-slate-900 dark:text-white">
                                {isLoading ? "—" : (stats?.totalTransactions ?? 0).toLocaleString("id-ID")}
                            </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Match Rate</p>
                            <p className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                                {isLoading ? "—" : calcMatchRate(stats)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Settled</p>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                {isLoading ? "—" : formatCurrency(stats?.settledAmount ?? 0)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-3">
                            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Selisih</p>
                            <p className="font-semibold text-sm text-rose-600 dark:text-rose-400 truncate">
                                {isLoading ? "—" : formatCurrency(stats?.totalDiscrepancyAmount ?? 0)}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => mutate()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                        </button>

                        <button
                            onClick={() => setConfirmOpen(true)}
                            disabled={triggering}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                            <Play className="w-3.5 h-3.5" />
                            {triggering ? "Memproses..." : "Trigger Rekon"}
                        </button>
                    </div>
                </CardContent>
            </Card>

            <DeleteConfirmationModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmTrigger}
                title={`Trigger Rekonsiliasi ${label}?`}
                message={
                    <>
                        Proses rekonsiliasi <strong>{label}</strong> akan dijalankan di background worker.
                        Hasilnya bisa dilihat di halaman dashboard operasi setelah proses selesai.
                        Jangan trigger ulang jika proses sedang berjalan.
                    </>
                }
                isSubmitting={triggering}
            />
        </>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const NETWORKS: NetworkCardProps[] = [
    {
        network: "aj",
        label: "QRIS Artajasa",
        description: "Rekonsiliasi transaksi jaringan QRIS via Artajasa (CBS / Biller / eBiller)",
    },
    {
        network: "rintis",
        label: "QRIS Rintis",
        description: "Rekonsiliasi transaksi jaringan QRIS via Rintis / Prima",
    },
    {
        network: "onus",
        label: "QRIS On-Us",
        description: "Rekonsiliasi transaksi QRIS On-Us (intra-bank)",
    },
];

export default function EngineReconciliationPage() {
    return (
        <div className="min-h-screen p-6 lg:p-8 space-y-8">
            <PageHeader
                title="Monitoring Rekonsiliasi"
                description="Pantau status dan trigger proses rekonsiliasi QRIS per jaringan secara manual."
                icon={GitMerge}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {NETWORKS.map((n) => (
                    <NetworkCard key={n.network} {...n} />
                ))}
            </div>
        </div>
    );
}
