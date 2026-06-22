"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
    const [theme, setThemeState] = useState<Theme>("system");
    const [size, setSizeState] = useState<Size>("comfortable");
    const [language, setLanguageState] = useState<Language>("ID");
    const [mounted, setMounted] = useState(false);

    const applyTheme = useCallback((targetTheme: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        let activeTheme = targetTheme;
        if (targetTheme === "system") {
            activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }

        root.classList.add(activeTheme);
        root.setAttribute("data-theme", activeTheme);
        root.style.colorScheme = activeTheme;
    }, []);

    const applySize = useCallback((targetSize: Size) => {
        const root = window.document.documentElement;
        root.classList.remove("size-compact", "size-comfortable", "size-large");
        root.classList.add(`size-${targetSize}`);
    }, []);

    // Sync settings on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("app-theme") as Theme | null;
        const savedSize = localStorage.getItem("app-size") as Size | null;
        const savedLang = localStorage.getItem("app-lang") as Language | null;

        // Try to get from session (user profile) — pakai key baru 'auth-profile' (tanpa token)
        try {
            const profileJson = sessionStorage.getItem("auth-profile") || sessionStorage.getItem("auth-user"); // fallback
            if (profileJson) {
                const user = JSON.parse(profileJson);
                if (user.uiSettings) {
                    if (user.uiSettings.theme) setThemeState(user.uiSettings.theme as Theme);
                    if (user.uiSettings.size) setSizeState(user.uiSettings.size as Size);
                    if (user.uiSettings.language) setLanguageState(user.uiSettings.language as Language);
                }
            } else {
                // Fallback to local storage
                if (savedTheme) setThemeState(savedTheme);
                if (savedSize) setSizeState(savedSize);
                if (savedLang) setLanguageState(savedLang);
            }
        } catch (e) {
            console.error("Failed to parse auth user JSON during settings init.", e);
        }

        setMounted(true);
    }, []);

    // Apply changes to DOM
    useEffect(() => {
        if (!mounted) return;
        applyTheme(theme);

        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => applyTheme("system");
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
    }, [theme, mounted, applyTheme]);

    useEffect(() => {
        if (!mounted) return;
        applySize(size);
    }, [size, mounted, applySize]);

    // Network & Session Sync
    const syncToApi = async (newTheme: Theme, newSize: Size, newLang: Language) => {
        const profileJson = sessionStorage.getItem("auth-profile") || sessionStorage.getItem("auth-user");
        if (profileJson) {
            try {
                const profile = JSON.parse(profileJson);
                profile.uiSettings = { theme: newTheme, size: newSize, language: newLang };
                sessionStorage.setItem("auth-profile", JSON.stringify(profile));
                await UserService.updateSettings({ theme: newTheme, size: newSize, language: newLang });
            } catch (e) {
                console.error("Failed to sync settings", e);
            }
        }
    };

    const handleSetTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("app-theme", newTheme);
        syncToApi(newTheme, size, language);
    };

    const handleSetSize = (newSize: Size) => {
        setSizeState(newSize);
        localStorage.setItem("app-size", newSize);
        syncToApi(theme, newSize, language);
    };

    const handleSetLanguage = (newLang: Language) => {
        setLanguageState(newLang);
        localStorage.setItem("app-lang", newLang);
        syncToApi(theme, size, newLang);
    };

    return (
        <SettingsContext.Provider
            value={{
                theme, setTheme: handleSetTheme,
                size, setSize: handleSetSize,
                language, setLanguage: handleSetLanguage
            }}
        >
            <div className={!mounted ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
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
