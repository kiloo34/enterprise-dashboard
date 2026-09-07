"use client";

import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useTranslation } from "../../hooks/useTranslation";
import { FinancialMetric } from "@/services/FinancialService";

interface DPKBreakdownChartsProps {
    data: FinancialMetric[];
    dates?: string[];
}

export function DPKBreakdownCharts({ data, dates = [] }: DPKBreakdownChartsProps) {
    const td = useTranslation("Dashboard");
    const tf = td.financial;

    const chartDates = dates.length > 0 ? dates : ["Oct 30", "Oct 31", "Nov 01", "Nov 02", "Nov 03"];

    // Dynamic Data Mapping
    const chartData = useMemo(() => {
        const getHistory = (slug: string) => {
            const metric = data.find(m => m.indicator.slug.toLowerCase() === slug.toLowerCase());
            if (!metric || !metric.history || metric.history.length === 0) {
                return chartDates.map(() => 0);
            }
            return metric.history.map(v => v || 0);
        };
        
        const giroPemdaHist = getHistory("giro_pemda");
        const giroSwastaHist = getHistory("giro_swasta_lembaga");
        const giroPeroranganHist = getHistory("giro_perorangan");
        const tabunganHist = getHistory("tabungan");
        const depoPemdaHist = getHistory("deposito_pemda");
        const depoSwastaHist = getHistory("deposito_swasta_lembaga");
        const depoPeroranganHist = getHistory("deposito_perorangan");

        const giroTrend = chartDates.map((date, i) => ({
            date,
            "Giro Pemda": giroPemdaHist[i] || 0,
            "Giro Swasta": giroSwastaHist[i] || 0,
            "Giro Perorangan": giroPeroranganHist[i] || 0,
        }));

        const tabunganTrend = chartDates.map((date, i) => ({
            date,
            "Tabungan": tabunganHist[i] || 0,
        }));

        const depositoTrend = chartDates.map((date, i) => ({
            date,
            "Deposito Pemda": depoPemdaHist[i] || 0,
            "Deposito Swasta": depoSwastaHist[i] || 0,
            "Deposito Perorangan": depoPeroranganHist[i] || 0,
        }));

        return { giroTrend, tabunganTrend, depositoTrend };
    }, [data, chartDates]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            {/* GIRO CHART */}
            <ChartCard title={tf.giro.title} subtitle={tf.giro.subtitle}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.giroTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGiroPemda" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorGiroSwasta" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-800" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                            itemStyle={{ color: "#374151" }} 
                            formatter={(value: any) => {
                                const val = Number(value);
                                if (isNaN(val)) return ["-", ""];
                                return [`IDR ${val.toLocaleString()}`, ""];
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                        <Area type="monotone" dataKey="Giro Pemda" name={tf.giro.pemda} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorGiroPemda)" />
                        <Area type="monotone" dataKey="Giro Swasta" name={tf.giro.swasta} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGiroSwasta)" />
                        <Area type="monotone" dataKey="Giro Perorangan" name={tf.giro.perorangan} stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* TABUNGAN CHART */}
            <ChartCard title={tf.tabungan.title} subtitle={tf.tabungan.subtitle}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.tabunganTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTabungan" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-800" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                            itemStyle={{ color: "#374151" }}
                            formatter={(value: any) => {
                                const val = Number(value);
                                if (isNaN(val)) return ["-", "Tabungan"];
                                return [`IDR ${val.toLocaleString()}`, tf.tabungan.label];
                            }}
                        />
                        <Area type="monotone" dataKey="Tabungan" name={tf.tabungan.label} stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTabungan)" />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* DEPOSITO CHART */}
            <ChartCard title={tf.deposito.title} subtitle={tf.deposito.subtitle}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.depositoTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorDepoPemda" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDepoSwasta" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-800" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                            itemStyle={{ color: "#374151" }}
                            formatter={(value: any) => {
                                const val = Number(value);
                                if (isNaN(val)) return ["-", ""];
                                return [`IDR ${val.toLocaleString()}`, ""];
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                        <Area type="monotone" dataKey="Deposito Pemda" name={tf.deposito.pemda} stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDepoPemda)" />
                        <Area type="monotone" dataKey="Deposito Swasta" name={tf.deposito.swasta} stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorDepoSwasta)" />
                        <Area type="monotone" dataKey="Deposito Perorangan" name={tf.deposito.perorangan} stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

interface ChartCardProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            <div className="h-[300px] w-full">
                {children}
            </div>
        </div>
    );
}
