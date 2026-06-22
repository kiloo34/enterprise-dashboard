"use client";

import { useState, useRef } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
    BarChart2,
    Activity,
    Layers,
    GitBranch,
    ExternalLink,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Monitor,
    Shield,
} from "lucide-react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "grafana" | "prometheus" | "redpanda" | "traefik";

interface MonitoringTab {
    id: TabId;
    label: string;
    icon: React.ElementType;
    src?: string;       // iframe URL — undefined means no iframe (Traefik)
    externalUrl: string;
    description: string;
    color: string;
    badge?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TABS: MonitoringTab[] = [
    {
        id: "grafana",
        label: "Grafana",
        icon: BarChart2,
        src: "/monitoring/grafana",
        externalUrl: "http://localhost:3001",
        description: "Metrics dashboard & visualization",
        color: "from-orange-500 to-amber-600",
        badge: "Metrics",
    },
    {
        id: "prometheus",
        label: "Prometheus",
        icon: Activity,
        src: "/monitoring/prometheus",
        externalUrl: "http://localhost:9090",
        description: "Time-series metrics & alerting",
        color: "from-red-500 to-rose-600",
        badge: "TSDB",
    },
    {
        id: "redpanda",
        label: "Redpanda",
        icon: Layers,
        src: "/monitoring/redpanda",
        externalUrl: "http://localhost:8081",
        description: "Kafka-compatible event streaming console",
        color: "from-purple-500 to-violet-600",
        badge: "Kafka",
    },
    {
        id: "traefik",
        label: "Traefik",
        icon: GitBranch,
        src: undefined, // cannot be embedded — X-Frame-Options: DENY
        externalUrl: "http://localhost:8080",
        description: "API Gateway & reverse proxy dashboard",
        color: "from-cyan-500 to-blue-600",
        badge: "Gateway",
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function IframeLoader() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Memuat antarmuka monitoring…
            </p>
        </div>
    );
}

function IframeError({ url, onRetry }: { url: string; onRetry: () => void }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900/80">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <div className="text-center">
                <p className="text-base font-bold text-gray-800 dark:text-white">Gagal Memuat</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Pastikan service berjalan dan dapat diakses di{" "}
                    <code className="text-xs bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded">{url}</code>
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Coba Lagi
                </button>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-semibold rounded-xl transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Buka Tab Baru
                </a>
            </div>
        </div>
    );
}

function TraefikCard({ tab }: { tab: MonitoringTab }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            {/* Icon */}
            <div className={clsx("w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-xl", tab.color)}>
                <tab.icon className="w-10 h-10 text-white" />
            </div>

            <div className="text-center max-w-md">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Traefik Dashboard</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Traefik Dashboard tidak dapat di-embed karena menggunakan header keamanan{" "}
                    <code className="text-xs bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">
                        X-Frame-Options: DENY
                    </code>
                    . Buka di tab baru untuk mengakses antarmuka penuh.
                </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {[
                    { label: "URL", value: "localhost:8080", icon: Monitor },
                    { label: "Protocol", value: "HTTP (insecure)", icon: Shield },
                    { label: "Auth", value: "Tidak ada", icon: CheckCircle2 },
                ].map(({ label, value, icon: Icon }) => (
                    <div
                        key={label}
                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-center"
                    >
                        <Icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
                    </div>
                ))}
            </div>

            {/* Action button */}
            <a
                href={tab.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    "flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
                    tab.color
                )}
            >
                <ExternalLink className="w-4 h-4" />
                Buka Traefik Dashboard
            </a>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function MonitoringContent() {
    const [activeTab, setActiveTab] = useState<TabId>("grafana");
    const [loadingState, setLoadingState] = useState<Record<TabId, "idle" | "loading" | "ready" | "error">>({
        grafana: "loading",
        prometheus: "idle",
        redpanda: "idle",
        traefik: "idle",
    });
    const [iframeKey, setIframeKey] = useState<Record<TabId, number>>({
        grafana: 0, prometheus: 0, redpanda: 0, traefik: 0,
    });

    const currentTab = TABS.find(t => t.id === activeTab)!;

    function handleTabChange(id: TabId) {
        setActiveTab(id);
        setLoadingState(prev => ({
            ...prev,
            [id]: prev[id] === "idle" ? "loading" : prev[id],
        }));
    }

    function handleIframeLoad(id: TabId) {
        setLoadingState(prev => ({ ...prev, [id]: "ready" }));
    }

    function handleIframeError(id: TabId) {
        setLoadingState(prev => ({ ...prev, [id]: "error" }));
    }

    function handleRetry(id: TabId) {
        setLoadingState(prev => ({ ...prev, [id]: "loading" }));
        setIframeKey(prev => ({ ...prev, [id]: prev[id] + 1 }));
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-transparent overflow-hidden">
            {/* ── Header ── */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            System Monitoring
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Observability tools — hanya tersedia untuk Super Admin
                        </p>
                    </div>
                    <a
                        href={currentTab.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all font-semibold shadow-sm"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Buka Tab Baru
                    </a>
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
                    {TABS.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={clsx(
                                    "flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 border",
                                    isActive
                                        ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white border-gray-200 dark:border-white/20 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 border-transparent hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"
                                )}
                            >
                                <div className={clsx(
                                    "w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                    tab.color
                                )}>
                                    <tab.icon className="w-3.5 h-3.5 text-white" />
                                </div>
                                {tab.label}
                                {tab.badge && (
                                    <span className={clsx(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                        isActive
                                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                            : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                                    )}>
                                        {tab.badge}
                                    </span>
                                )}
                                {/* Loading dot */}
                                {loadingState[tab.id] === "loading" && tab.id === activeTab && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── iframe Container ── */}
            <div className="flex-1 px-6 pb-6 min-h-0">
                <div className="relative w-full h-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                    {TABS.map((tab) => (
                        <div
                            key={tab.id}
                            className={clsx(
                                "absolute inset-0 transition-opacity duration-200",
                                tab.id === activeTab ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                            )}
                        >
                            {tab.src ? (
                                <>
                                    {/* Loading overlay */}
                                    {loadingState[tab.id] === "loading" && <IframeLoader />}

                                    {/* Error overlay */}
                                    {loadingState[tab.id] === "error" && (
                                        <IframeError url={tab.externalUrl} onRetry={() => handleRetry(tab.id)} />
                                    )}

                                    {/* iframe */}
                                    <iframe
                                        key={iframeKey[tab.id]}
                                        src={tab.id === activeTab ? tab.src : undefined}
                                        className="w-full h-full border-0"
                                        title={tab.label}
                                        onLoad={() => handleIframeLoad(tab.id)}
                                        onError={() => handleIframeError(tab.id)}
                                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                                    />
                                </>
                            ) : (
                                // Traefik: no iframe, show info card
                                <TraefikCard tab={tab} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Page Export (with super-admin guard) ─────────────────────────────────────

export default function SystemMonitoringPage() {
    return (
        <ProtectedRoute allowedRoles={["super-admin"]}>
            <MonitoringContent />
        </ProtectedRoute>
    );
}
