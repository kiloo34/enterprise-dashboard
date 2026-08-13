"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { TranslationService, TranslationDict } from "../services/TranslationService";
import { translations as staticTranslations } from "../utils/translations";
import { useSettings } from "./SettingsContext";

interface TranslationsContextType {
    /** Nested dict from DB: { namespace: { "dot.key": value } } */
    dbTranslations: TranslationDict | null;
    isLoading: boolean;
}

const TranslationsContext = createContext<TranslationsContextType>({
    dbTranslations: null,
    isLoading: true,
});

/**
 * TranslationsProvider — fetches translations from the DB on mount and whenever
 * the active language changes. Falls back silently to static locale files if
 * the backend is unreachable.
 */
export function TranslationsProvider({ children }: { children: React.ReactNode }) {
    const { language } = useSettings();
    const [dbTranslations, setDbTranslations] = useState<TranslationDict | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadTranslations = useCallback(async (lang: string) => {
        setIsLoading(true);
        try {
            const data = await TranslationService.fetchAll(lang);
            setDbTranslations(data);
        } catch {
            // Silent fallback — static locale files will be used
            setDbTranslations(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTranslations(language);
    }, [language, loadTranslations]);

    return (
        <TranslationsContext.Provider value={{ dbTranslations, isLoading }}>
            {children}
        </TranslationsContext.Provider>
    );
}

export function useTranslationsContext(): TranslationsContextType {
    return useContext(TranslationsContext);
}

/**
 * Resolve a dot-notation key from a flat DB namespace dict.
 * Supports both flat keys ("add") and nested dot keys ("themes.light.label").
 */
export function resolveDbKey(
    namespaceDict: Record<string, string> | undefined,
    dotKey: string,
): string | undefined {
    if (!namespaceDict) return undefined;
    return namespaceDict[dotKey];
}

/**
 * Reconstruct a nested object from the flat DB namespace dict.
 * Used by useTranslation to produce the same shape as the static locale objects.
 *
 * Example: { "themes.light.label": "Light Mode" }
 *   → { themes: { light: { label: "Light Mode" } } }
 */
export function reconstructNestedObject(flat: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [dotKey, value] of Object.entries(flat)) {
        const parts = dotKey.split(".");
        let cursor: Record<string, unknown> = result;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (typeof cursor[part] !== "object" || cursor[part] === null) {
                cursor[part] = {};
            }
            cursor = cursor[part] as Record<string, unknown>;
        }
        cursor[parts[parts.length - 1]] = value;
    }
    return result;
}

export { staticTranslations };
