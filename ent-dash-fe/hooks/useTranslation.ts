import { useSettings } from "../components/SettingsContext";
import { useTranslationsContext, reconstructNestedObject } from "../components/TranslationsProvider";
import { translations as staticTranslations, TranslationsType } from "../utils/translations";
import { TranslationSchema } from "../utils/locales/types";

/**
 * useTranslation — returns the translation object for the given namespace key.
 *
 * Resolution order:
 * 1. DB-fetched translations (via TranslationsProvider) — live, editable by super-admin
 * 2. Static locale files (id.ts / en.ts) — fallback if backend is unreachable
 *
 * The returned object has the same shape as the static locale objects,
 * so all existing call sites (e.g. `t.title`, `t.themes.light.label`) work unchanged.
 */
export function useTranslation<K extends keyof TranslationsType>(key: K): TranslationSchema[K] {
    const { language } = useSettings();
    const { dbTranslations } = useTranslationsContext();
    const normalizedLang = (language?.toUpperCase() || "ID") as "ID" | "EN";

    // DB namespace dict for this language (flat dot-key → value)
    const dbNamespace = dbTranslations?.[key as string];

    if (dbNamespace && Object.keys(dbNamespace).length > 0) {
        // Reconstruct nested shape from flat DB keys so the returned object
        // is structurally identical to the static locale object.
        const reconstructed = reconstructNestedObject(dbNamespace);
        return reconstructed as TranslationSchema[K];
    }

    // Fallback: static locale file
    const translationGroup = staticTranslations[key];
    return (translationGroup[normalizedLang] || translationGroup["ID"]) as TranslationSchema[K];
}
