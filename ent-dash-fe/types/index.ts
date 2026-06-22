export interface DataRow {
    slug: string;
    label: string;
    level?: number; // 0 = main, 1 = sub, 2 = sub-sub
    isBold?: boolean;
    isHeader?: boolean;
    isRatio?: boolean;
    isLink?: boolean;
    kelompok?: string;
    segment?: string;
    isAjp?: boolean;
    isVisible: boolean;
    isDeleted: boolean;
    valueR1: string | number;
    valueR2: string | number;
    valueR3: string | number;
    valueR4: string | number;
    valueR5: string | number;
    targetNominal: string | number;
    targetDeviasi?: string | number;
    targetPct?: string;
    dtdNominal: string | number;
    dtdPct?: string;
    mtdNominal: string | number;
    mtdPct?: string;
    ytdNominal: string | number;
    ytdPct?: string;
    yoyNominal: string | number;
    yoyPct?: string;
}

export type Theme = "light" | "dark" | "system";
export type Size = "compact" | "comfortable" | "large";
export type Language = "ID" | "EN";
