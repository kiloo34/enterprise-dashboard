"use client";

import React from "react";
import { Monitor, Moon, Sun, Layout, Maximize2, Minimize2, Check } from "lucide-react";
import { useSettings } from "@/components/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Theme, Size, Language } from "@/types";
import clsx from "clsx";

export default function SettingsPage() {
    const { theme, setTheme, size, setSize, language, setLanguage } = useSettings();
    const t = useTranslation("Settings");

    const themeOptions = [
        { id: "light", icon: Sun, ...t.themes.light },
        { id: "dark", icon: Moon, ...t.themes.dark },
        { id: "system", icon: Monitor, ...t.themes.system },
    ];

    const sizeOptions = [
        { id: "compact", icon: Minimize2, ...t.views.compact },
        { id: "comfortable", icon: Layout, ...t.views.comfortable },
        { id: "large", icon: Maximize2, ...t.views.large },
    ];

    return (
        <div>

            {/* ── Appearance (Theme) ──────────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-8 py-8 border-b" style={{ borderColor: "var(--card-border)" }}>
                {/* Left: label */}
                <div className="md:w-72 shrink-0">
                    <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                        {t.visualTitle}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {t.visualSubtitle}
                    </p>
                </div>

                {/* Right: controls */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = theme === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => setTheme(opt.id as Theme)}
                                className={clsx(
                                    "relative flex flex-col p-5 rounded-2xl border transition-all duration-300 text-left",
                                    isActive
                                        ? "ring-4 ring-[var(--brand-primary)]/5"
                                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                                )}
                                style={isActive ? { borderColor: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)" } : {}}
                            >
                                <div
                                    className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                                        isActive ? "text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                    )}
                                    style={isActive ? { background: "var(--brand-primary)" } : {}}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={clsx("font-bold text-sm", isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300")}>
                                        {opt.label}
                                    </span>
                                    {isActive && <div className="h-2 w-2 rounded-full" style={{ background: "var(--brand-primary)" }} />}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{opt.desc}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Dashboard Comfort (Size) ────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-8 py-8 border-b" style={{ borderColor: "var(--card-border)" }}>
                {/* Left: label */}
                <div className="md:w-72 shrink-0">
                    <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                        {t.comfortTitle}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {t.comfortSubtitle}
                    </p>
                </div>

                {/* Right: controls */}
                <div className="flex-1 space-y-3">
                    {sizeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = size === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => setSize(opt.id as Size)}
                                className={clsx(
                                    "w-full flex items-center p-4 rounded-2xl border transition-all duration-300 text-left group",
                                    isActive
                                        ? "ring-4 ring-[var(--brand-primary)]/5"
                                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                                )}
                                style={isActive ? { borderColor: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)" } : {}}
                            >
                                <div
                                    className={clsx(
                                        "p-3 rounded-xl mr-4 transition-all",
                                        isActive ? "text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-600"
                                    )}
                                    style={isActive ? { background: "var(--brand-primary)" } : {}}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={clsx("font-bold text-sm", isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-800 dark:text-gray-200")}>
                                        {opt.label}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                                </div>
                                <div className={clsx(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    isActive ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]" : "border-gray-300 dark:border-gray-600"
                                )}>
                                    {isActive && <Check className="h-3 w-3 text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Language ────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-8 py-8" style={{ borderColor: "var(--card-border)" }}>
                {/* Left: label */}
                <div className="md:w-72 shrink-0">
                    <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                        {t.langTitle}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {t.langSubtitle}
                    </p>
                </div>

                {/* Right: controls */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(["ID", "EN"] as Language[]).map((lang) => {
                        const isActive = language === lang;
                        return (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={clsx(
                                    "relative flex items-center p-5 rounded-2xl border transition-all duration-300 text-left",
                                    isActive
                                        ? "border-blue-600 ring-4 ring-blue-600/5 dark:border-blue-500"
                                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                                )}
                                style={isActive ? { background: "color-mix(in srgb, #2563eb 8%, transparent)" } : {}}
                            >
                                <div className={clsx(
                                    "w-9 h-9 rounded-lg flex items-center justify-center mr-4 font-bold text-xs shrink-0",
                                    isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                )}>
                                    {lang}
                                </div>
                                <span className={clsx(
                                    "font-bold text-sm flex-1",
                                    isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                                )}>
                                    {t.languages[lang]}
                                </span>
                                {isActive && <div className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
