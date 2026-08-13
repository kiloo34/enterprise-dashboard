"use client";

import { useState, useMemo } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { useTranslationsContext } from "@/components/TranslationsProvider";
import { TranslationService } from "@/services/TranslationService";
import { useAuth } from "@/components/AuthContext";

export type EditState = Record<string, string>; // key → draft value

const NAMESPACES = ["Common", "Sidebar", "Settings", "Users", "Roles", "Permissions"];

export function useTranslationEditor() {
    const { dbTranslations } = useTranslationsContext();
    const { user } = useAuth();

    const [activeNamespace, setActiveNamespace] = useState(NAMESPACES[0]);
    const [activeLang, setActiveLang] = useState<"ID" | "EN">("ID");
    const [editStates, setEditStates] = useState<Record<string, EditState>>({}); // namespace+lang → editState
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    const compositeKey = `${activeNamespace}__${activeLang}`;

    // Rows for the active namespace + language
    const rows = useMemo(() => {
        const nsDict = dbTranslations?.[activeNamespace] ?? {};
        return Object.entries(nsDict).map(([key, value]) => ({ key, value }));
    }, [dbTranslations, activeNamespace]);

    const getDraft = (key: string): string => {
        return editStates[compositeKey]?.[key] ?? "";
    };

    const startEdit = (key: string, currentValue: string) => {
        setEditingKey(key);
        setEditStates((prev) => ({
            ...prev,
            [compositeKey]: {
                ...(prev[compositeKey] ?? {}),
                [key]: currentValue,
            },
        }));
    };

    const cancelEdit = () => {
        setEditingKey(null);
    };

    const updateDraft = (key: string, value: string) => {
        setEditStates((prev) => ({
            ...prev,
            [compositeKey]: {
                ...(prev[compositeKey] ?? {}),
                [key]: value,
            },
        }));
    };

    const saveEdit = async (key: string, originalValue: string) => {
        const draft = getDraft(key);
        if (draft === originalValue) { setEditingKey(null); return; }

        const token = typeof window !== "undefined"
            ? (window as unknown as { __getAuthToken?: () => string | null }).__getAuthToken?.() ?? ""
            : "";

        setSaving(key);
        try {
            await TranslationService.bulkUpdate(
                [{ namespace: activeNamespace, key, language: activeLang, value: draft }],
                token,
            );
            toast.success(`Terjemahan "${key}" berhasil disimpan`);
            // Invalidate SWR + TranslationsProvider cache
            await mutate(["/api/translations", activeLang]);
            setEditingKey(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Gagal menyimpan terjemahan");
        } finally {
            setSaving(null);
        }
    };

    return {
        namespaces: NAMESPACES,
        activeNamespace,
        setActiveNamespace,
        activeLang,
        setActiveLang,
        rows,
        editingKey,
        saving,
        getDraft,
        startEdit,
        cancelEdit,
        updateDraft,
        saveEdit,
    };
}
