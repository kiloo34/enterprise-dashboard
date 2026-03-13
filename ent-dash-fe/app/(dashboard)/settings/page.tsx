"use client";

import React from "react";
import { Monitor, Moon, Sun, Layout, Maximize2, Minimize2, Check, ShieldCheck } from "lucide-react";
import { useSettings } from "../../components/SettingsContext";
import { useTranslation } from "../../hooks/useTranslation";
import { Theme, Size, Language } from "../../types";
import clsx from "clsx";
import { PageHeader } from "../../components/ui/PageHeader";

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
        <div className="max-w-5xl mx-auto py-10 px-6">
            <PageHeader
                title={t.title}
                description={t.subtitle}
                icon={ShieldCheck}
            />

            <div className="flex flex-col gap-12 mt-10">
                {/* Visual Theme Section */}
                <section>
                    <div className="flex flex-col mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.visualTitle}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.visualSubtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {themeOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = theme === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => setTheme(opt.id as Theme)}
                                    className={clsx(
                                        "relative flex flex-col p-6 rounded-2xl border transition-all duration-300 text-left",
                                        isActive
                                            ? "border-blue-600 bg-blue-50/30 ring-4 ring-blue-600/5 dark:bg-blue-900/10 dark:border-blue-500"
                                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors",
                                        isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <div className="flex items-center justify-between mb-1">
                                        <span className={clsx(
                                            "font-bold text-lg",
                                            isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                                        )}>{opt.label}</span>
                                        {isActive && <div className="h-2.5 w-2.5 rounded-full bg-blue-600"></div>}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{opt.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Dashboard Comfort Section */}
                <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.comfortTitle}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.comfortSubtitle}</p>
                    </div>

                    <div className="space-y-4">
                        {sizeOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = size === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => setSize(opt.id as Size)}
                                    className={clsx(
                                        "w-full flex items-center p-5 rounded-2xl border transition-all duration-300 text-left group",
                                        isActive
                                            ? "border-blue-600 bg-blue-50/30 ring-4 ring-blue-600/5 dark:bg-blue-900/10 dark:border-blue-500"
                                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                                    )}
                                >
                                    <div className={clsx(
                                        "p-4 rounded-xl mr-6 transition-all",
                                        isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-gray-600"
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={clsx(
                                            "font-bold text-lg",
                                            isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-800 dark:text-gray-200"
                                        )}>{opt.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{opt.desc}</p>
                                    </div>
                                    <div className={clsx(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        isActive ? "border-blue-600 bg-blue-600" : "border-gray-300 dark:border-gray-600"
                                    )}>
                                        {isActive && <Check className="h-4 w-4 text-white" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Dashboard Language Section */}
                <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.langTitle}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.langSubtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {["ID", "EN"].map((lang) => {
                            const isActive = language === lang;
                            return (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang as Language)}
                                    className={clsx(
                                        "relative flex items-center p-6 rounded-2xl border transition-all duration-300 text-left",
                                        isActive
                                            ? "border-blue-600 bg-blue-50/30 ring-4 ring-blue-600/5 dark:bg-blue-900/10 dark:border-blue-500"
                                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-10 h-10 rounded-lg flex items-center justify-center mr-4 font-bold text-sm",
                                        isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                    )}>
                                        {lang}
                                    </div>
                                    <span className={clsx(
                                        "font-bold text-lg flex-1",
                                        isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                                    )}>{t.languages[lang as keyof typeof t.languages]}</span>
                                    {isActive && <div className="h-2.5 w-2.5 rounded-full bg-blue-600"></div>}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <footer className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-gray-400 text-xs">
                <p>{t.footer}</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-blue-600 transition-colors">{t.privacy}</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">{t.agreement}</a>
                </div>
            </footer>
        </div>
    );
}
