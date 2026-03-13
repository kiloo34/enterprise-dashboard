import { useSettings } from "../components/SettingsContext";
import { translations, TranslationsType } from "../utils/translations";
import { TranslationSchema } from "../utils/locales/types";

export function useTranslation<K extends keyof TranslationsType>(key: K): TranslationSchema[K] {
    const { language } = useSettings();
    const normalizedLang = (language?.toUpperCase() || "ID") as "ID" | "EN";

    // Fallback logic to ensure we always return a valid translation object
    const translationGroup = translations[key];
    return (translationGroup[normalizedLang] || translationGroup["ID"]) as TranslationSchema[K];
}
