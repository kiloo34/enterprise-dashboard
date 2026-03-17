"use client";

import React, { useState } from "react";
import { BarChart2, Briefcase, ShieldCheck, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

import { useSettings } from "@/components/SettingsContext";
import { useAuth } from "@/components/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import clsx from "clsx";

export default function LoginPage() {

    const { language, setLanguage } = useSettings();
    const { login } = useAuth();
    const t = useTranslation("Login");
    const { appTitle } = useTranslation("Common");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await login(email, password);
        } catch {
            setError(t.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 relative">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50 flex items-center bg-white/80 backdrop-blur-md rounded-full border border-gray-200 p-1 shadow-lg">
                <button
                    onClick={() => setLanguage("ID")}
                    className={clsx(
                        "px-3 py-1 text-[10px] font-bold rounded-full transition-all",
                        language === "ID" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    ID
                </button>
                <button
                    onClick={() => setLanguage("EN")}
                    className={clsx(
                        "px-3 py-1 text-[10px] font-bold rounded-full transition-all",
                        language === "EN" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    EN
                </button>
            </div>

            {/* Left side - Branding & Info */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-between p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10">
                    <svg width="404" height="784" fill="none" viewBox="0 0 404 784">
                        <defs>
                            <pattern id="b1e6e422-73f8-40a5-b5f9-26c7edb64b11" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="4" height="4" fill="currentColor"></rect>
                            </pattern>
                        </defs>
                        <rect width="404" height="784" fill="url(#b1e6e422-73f8-40a5-b5f9-26c7edb64b11)"></rect>
                    </svg>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg text-blue-600">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-2xl leading-tight">{appTitle}</h1>
                        <p className="text-xs text-blue-200 font-semibold tracking-wider">
                            MONITORING ENGINE
                        </p>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-4xl font-bold mb-6 leading-tight">
                        {t.brandingTitle}
                    </h2>
                    <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                        {t.brandingDesc}
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-blue-700/30 p-4 rounded-xl backdrop-blur-sm border border-blue-500/30">
                            <Briefcase className="w-6 h-6 text-blue-200" />
                            <div>
                                <h3 className="font-semibold text-white">{t.feature1Title}</h3>
                                <p className="text-sm text-blue-200">{t.feature1Desc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-blue-700/30 p-4 rounded-xl backdrop-blur-sm border border-blue-500/30">
                            <ShieldCheck className="w-6 h-6 text-blue-200" />
                            <div>
                                <h3 className="font-semibold text-white">{t.feature2Title}</h3>
                                <p className="text-sm text-blue-200">{t.feature2Desc}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-blue-200">
                    &copy; {new Date().getFullYear()} {t.copyright}
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                <div className="w-full max-w-md mx-auto space-y-8">
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl text-gray-900 leading-tight">{appTitle}</h1>
                            <p className="text-xs text-gray-500 font-semibold tracking-wider">
                                MONITORING ENGINE
                            </p>
                        </div>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.welcome}</h2>
                        <p className="text-gray-500">{t.subtitle}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">{t.email}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        placeholder={t.emailPlaceholder}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">{t.password}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        placeholder={t.passwordPlaceholder}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                                    {t.rememberMe}
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                    {t.forgot}
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t.signingIn}
                                    </>
                                ) : (
                                    t.signIn
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center text-sm text-gray-500">
                        {t.noAccount}{" "}
                        <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
                            {t.contactAdmin}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
