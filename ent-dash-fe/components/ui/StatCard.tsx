"use client";

import clsx from "clsx";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
}

export function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
}: StatCardProps) {
    return (
        <div
            className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 shadow-sm transition-all hover:shadow-md border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
            <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", color)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
                {sub && <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
            </div>
        </div>
    );
}

