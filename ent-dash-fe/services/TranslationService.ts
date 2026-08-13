/**
 * TranslationService — fetches UI translation strings from the backend DB.
 *
 * The GET /api/translations endpoint is PUBLIC (no auth required), so this
 * service uses a plain fetch rather than the authenticated `api()` util.
 * This allows translations to load on the login page before the user authenticates.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type TranslationDict = Record<string, Record<string, string>>;

export class TranslationService {
    /**
     * Fetch all translations for a given language.
     * Returns a nested dict: { namespace: { "dot.key": value } }
     */
    static async fetchAll(lang: string): Promise<TranslationDict> {
        const url = `${BASE_URL}/translations?lang=${lang.toUpperCase()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`Failed to fetch translations: ${res.status}`);
        }
        return res.json();
    }

    /**
     * Fetch translations for a single namespace.
     * Returns { "dot.key": value }
     */
    static async fetchNamespace(namespace: string, lang: string): Promise<Record<string, string>> {
        const url = `${BASE_URL}/translations/${namespace}?lang=${lang.toUpperCase()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`Failed to fetch translations for ${namespace}: ${res.status}`);
        }
        return res.json();
    }

    /**
     * Bulk update translation strings. Requires super-admin auth token.
     */
    static async bulkUpdate(
        items: Array<{ namespace: string; key: string; language: string; value: string }>,
        token: string,
    ): Promise<void> {
        const url = `${BASE_URL}/translations`;
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.detail || `Failed to update translations: ${res.status}`);
        }
    }

    /**
     * Fetch available language codes from the backend.
     */
    static async fetchLanguages(): Promise<string[]> {
        const url = `${BASE_URL}/translations/languages`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return ["ID", "EN"];
        return res.json();
    }
}
