"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, Size, Language } from "../types";
import { UserService } from "../services/UserService";

interface SettingsContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    size: Size;
    setSize: (size: Size) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Lazy initialization for states
    const [theme, setTheme] = useState<Theme>("system");
    const [size, setSize] = useState<Size>("comfortable");
    const [language, setLanguage] = useState<Language>("ID");
    const [isMounted, setIsMounted] = useState(false);

    // Sync settings on mount
    useEffect(() => {
        let savedTheme = localStorage.getItem("app-theme") as Theme | null;
        let savedSize = localStorage.getItem("app-size") as Size | null;
        let savedLang = localStorage.getItem("app-lang") as Language | null;

        try {
            const authUserJson = sessionStorage.getItem("auth-user");
            if (authUserJson) {
                const user = JSON.parse(authUserJson);
                if (user.uiSettings) {
                    if (user.uiSettings.theme) savedTheme = user.uiSettings.theme as Theme;
                    if (user.uiSettings.size) savedSize = user.uiSettings.size as Size;
                    if (user.uiSettings.language) savedLang = user.uiSettings.language as Language;

                    // Priority save to local storage
                    if (savedTheme) localStorage.setItem("app-theme", savedTheme);
                    if (savedSize) localStorage.setItem("app-size", savedSize);
                    if (savedLang) localStorage.setItem("app-lang", savedLang);
                }
            }
        } catch (e) {
            console.error("Failed to parse auth user JSON during settings init.", e);
        }

        setTimeout(() => {
            if (savedTheme) setTheme(savedTheme);
            if (savedSize) setSize(savedSize);
            if (savedLang) setLanguage(savedLang);
            setIsMounted(true);
        }, 0);
    }, []);

    // Network & Session Optimistic Sync
    const syncSettingToApi = async (newTheme: Theme, newSize: Size, newLang: Language) => {
        const authUserJson = sessionStorage.getItem("auth-user");
        if (authUserJson) {
            try {
                // Optimistically update session storage
                const user = JSON.parse(authUserJson);
                user.uiSettings = { theme: newTheme, size: newSize, language: newLang };
                sessionStorage.setItem("auth-user", JSON.stringify(user));

                // Send to backend
                await UserService.updateSettings({ theme: newTheme, size: newSize, language: newLang });
            } catch (e) {
                console.error("Failed to sync UI settings to Backend API", e);
            }
        }
    };

    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        syncSettingToApi(newTheme, size, language);
    };

    const handleSetSize = (newSize: Size) => {
        setSize(newSize);
        syncSettingToApi(theme, newSize, language);
    };

    const handleSetLanguage = (newLang: Language) => {
        setLanguage(newLang);
        syncSettingToApi(theme, size, newLang);
    };

    // Handle theme changes
    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("app-theme", theme);

        const root = window.document.documentElement;

        const applyTheme = () => {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            const activeTheme = theme === "system" ? systemTheme : theme;

            if (activeTheme === "dark") {
                root.classList.add("dark");
                document.body.classList.add("dark");
                root.setAttribute("data-theme", "dark");
                root.style.colorScheme = "dark";
            } else {
                root.classList.remove("dark");
                document.body.classList.remove("dark");
                root.setAttribute("data-theme", "light");
                root.style.colorScheme = "light";
            }
        };

        applyTheme();

        // Listen for system changes if in system mode
        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => applyTheme();
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
    }, [theme, isMounted]);

    // Handle size changes
    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("app-size", size);

        const root = window.document.documentElement;
        root.classList.remove("size-compact", "size-comfortable", "size-large");
        root.classList.add(`size-${size}`);
    }, [size, isMounted]);

    // Handle language changes
    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem("app-lang", language);
    }, [language, isMounted]);

    return (
        <SettingsContext.Provider
            value={{
                theme, setTheme: handleSetTheme,
                size, setSize: handleSetSize,
                language, setLanguage: handleSetLanguage
            }}
        >
            <div className={!isMounted ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
                {children}
            </div>
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
