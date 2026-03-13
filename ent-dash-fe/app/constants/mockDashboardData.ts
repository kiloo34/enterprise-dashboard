import { DataRow } from "../types";

export const mockDashboardData: DataRow[] = [
    // DPK SECTION
    {
        label: "TOTAL DPK",
        level: 0,
        isBold: true,
        isLink: true,
        valueR1: "10,715", valueR2: "7,640", valueR3: "8,650", valueR4: "9,120", valueR5: "9,420",
        targetNominal: "11,000", targetDeviasi: -285, targetPct: "97.4%",
        dtdNominal: 45, dtdPct: "0.2%", mtdNominal: 120, mtdPct: "1.1%", ytdNominal: 540, ytdPct: "5.4%", yoyNominal: 820, yoyPct: "8.2%"
    },
    {
        label: "GIRO",
        level: 1,
        isBold: true,
        valueR1: "4,440", valueR2: "4,474", valueR3: "3,520", valueR4: "3,840", valueR5: "4,120",
        targetNominal: "4,500", targetDeviasi: -380, targetPct: "91.5%",
        dtdNominal: 5, dtdPct: "0.1%", mtdNominal: -12, mtdPct: "-0.3%", ytdNominal: 210, ytdPct: "4.8%", yoyNominal: 340, yoyPct: "8.1%"
    },
    {
        label: "GIRO PEMDA",
        level: 2,
        valueR1: "3,306", valueR2: "3,257", valueR3: "2,410", valueR4: "2,650", valueR5: "2,840",
        targetNominal: "3,400", targetDeviasi: -560, targetPct: "83.5%",
        dtdNominal: 2, dtdPct: "0.1%", mtdNominal: -8, mtdPct: "-0.2%", ytdNominal: 150, ytdPct: "4.7%", yoyNominal: 220, yoyPct: "7.9%"
    },
    {
        label: "GIRO SWASTA LEMBAGA",
        level: 2,
        valueR1: "1,114", valueR2: "1,189", valueR3: "1,085", valueR4: "1,140", valueR5: "1,245",
        targetNominal: "1,050", targetDeviasi: 195, targetPct: "118.5%",
        dtdNominal: 3, dtdPct: "0.2%", mtdNominal: 4, mtdPct: "0.3%", ytdNominal: 60, ytdPct: "5.1%", yoyNominal: 115, yoyPct: "9.5%"
    },
    {
        label: "GIRO PERORANGAN",
        level: 2,
        valueR1: "20", valueR2: "29", valueR3: "25", valueR4: "50", valueR5: "35",
        targetNominal: "50", targetDeviasi: -15, targetPct: "70.0%",
        dtdNominal: 0.1, dtdPct: "0.3%", mtdNominal: 0.2, mtdPct: "0.4%", ytdNominal: 1.5, ytdPct: "5.0%", yoyNominal: 5, yoyPct: "12.0%"
    },
    {
        label: "TABUNGAN",
        level: 1,
        isBold: true,
        valueR1: "1,891", valueR2: "2,069", valueR3: "1,940", valueR4: "2,120", valueR5: "2,240",
        targetNominal: "2,000", targetDeviasi: 240, targetPct: "112.0%",
        dtdNominal: 4, dtdPct: "0.2%", mtdNominal: 15, mtdPct: "0.7%", ytdNominal: 180, ytdPct: "8.5%", yoyNominal: 310, yoyPct: "14.5%"
    },
    {
        label: "DEPOSITO",
        level: 1,
        isBold: true,
        valueR1: "4,384", valueR2: "1,096", valueR3: "3,215", valueR4: "3,160", valueR5: "3,060",
        targetNominal: "4,500", targetDeviasi: -1440, targetPct: "68.0%",
        dtdNominal: -12, dtdPct: "-0.4%", mtdNominal: -45, mtdPct: "-1.4%", ytdNominal: 150, ytdPct: "5.1%", yoyNominal: 170, yoyPct: "5.8%"
    },
    {
        label: "DEPOSITO PEMDA",
        level: 2,
        valueR1: "3,275", valueR2: "0", valueR3: "2,140", valueR4: "2,050", valueR5: "1,980",
        targetNominal: "3,300", targetDeviasi: -1320, targetPct: "60.0%",
        dtdNominal: -8, dtdPct: "-0.4%", mtdNominal: -30, mtdPct: "-1.5%", ytdNominal: 110, ytdPct: "5.8%", yoyNominal: 120, yoyPct: "6.4%"
    },
    {
        label: "DEPOSITO SWASTA LEMBAGA",
        level: 2,
        valueR1: "185", valueR2: "387", valueR3: "420", valueR4: "450", valueR5: "480",
        targetNominal: "200", targetDeviasi: 280, targetPct: "240.0%",
        dtdNominal: 2, dtdPct: "0.4%", mtdNominal: 5, mtdPct: "1.1%", ytdNominal: 25, ytdPct: "5.5%", yoyNominal: 35, yoyPct: "7.8%"
    },
    {
        label: "DEPOSITO PERORANGAN",
        level: 2,
        valueR1: "924", valueR2: "709", valueR3: "755", valueR4: "660", valueR5: "600",
        targetNominal: "1,000", targetDeviasi: -400, targetPct: "60.0%",
        dtdNominal: -6, dtdPct: "-1.0%", mtdNominal: -20, mtdPct: "-3.2%", ytdNominal: 15, ytdPct: "2.5%", yoyNominal: 15, yoyPct: "2.5%"
    },
    // KREDIT SECTION
    {
        label: "KREDIT",
        level: 0,
        isBold: true,
        valueR1: "5,292", valueR2: "5,015", valueR3: "4,820", valueR4: "5,140", valueR5: "5,340",
        targetNominal: "5,500", targetDeviasi: -160, targetPct: "97.1%",
        dtdNominal: 15, dtdPct: "0.3%", mtdNominal: 45, mtdPct: "0.9%", ytdNominal: 280, ytdPct: "5.5%", yoyNominal: 420, yoyPct: "8.5%"
    },
    {
        label: "TLF",
        level: 1,
        valueR1: "280", valueR2: "0", valueR3: "150", valueR4: "180", valueR5: "210",
        targetNominal: "300", targetDeviasi: -90, targetPct: "70.0%",
        dtdNominal: 2, dtdPct: "1.0%", mtdNominal: 5, mtdPct: "2.4%", ytdNominal: 25, ytdPct: "13.5%", yoyNominal: 40, yoyPct: "23.5%"
    },
    {
        label: "KONSUMER",
        level: 1,
        valueR1: "1,773", valueR2: "1,904", valueR3: "1,980", valueR4: "2,050", valueR5: "2,140",
        targetNominal: "1,850", targetDeviasi: 290, targetPct: "115.7%",
        dtdNominal: 8, dtdPct: "0.4%", mtdNominal: 24, mtdPct: "1.2%", ytdNominal: 160, ytdPct: "8.1%", yoyNominal: 240, yoyPct: "12.6%"
    },
    {
        label: "KORPORASI",
        level: 1,
        valueR1: "2,717", valueR2: "2,502", valueR3: "2,250", valueR4: "2,420", valueR5: "2,560",
        targetNominal: "2,850", targetDeviasi: -290, targetPct: "89.8%",
        dtdNominal: 4, dtdPct: "0.2%", mtdNominal: 12, mtdPct: "0.5%", ytdNominal: 80, ytdPct: "3.2%", yoyNominal: 120, yoyPct: "4.9%"
    },
    {
        label: "MENENGAH",
        level: 1,
        valueR1: "19", valueR2: "0", valueR3: "15", valueR4: "20", valueR5: "25",
        targetNominal: "25", targetDeviasi: 0, targetPct: "100.0%",
        dtdNominal: 0.2, dtdPct: "0.8%", mtdNominal: 0.5, mtdPct: "2.0%", ytdNominal: 3, ytdPct: "13.6%", yoyNominal: 5, yoyPct: "25.0%"
    },
    {
        label: "MIKRO",
        level: 1,
        valueR1: "178", valueR2: "192", valueR3: "210", valueR4: "225", valueR5: "240",
        targetNominal: "180", targetDeviasi: 60, targetPct: "133.3%",
        dtdNominal: 1, dtdPct: "0.4%", mtdNominal: 3.5, mtdPct: "1.5%", ytdNominal: 20, ytdPct: "9.1%", yoyNominal: 35, yoyPct: "17.0%"
    },
    {
        label: "RITEL",
        level: 1,
        valueR1: "325", valueR2: "418", valueR3: "315", valueR4: "345", valueR5: "365",
        targetNominal: "300", targetDeviasi: 65, targetPct: "121.7%",
        dtdNominal: 0.5, dtdPct: "0.1%", mtdNominal: 2, mtdPct: "0.5%", ytdNominal: 12, ytdPct: "3.4%", yoyNominal: 20, yoyPct: "5.8%"
    },
    // LABA/RUGI SECTION
    {
        label: "LABA/RUGI SEBELUM PAJAK",
        level: 0,
        isBold: true,
        valueR1: "73", valueR2: "107", valueR3: "95", valueR4: "115", valueR5: "145",
        targetNominal: "150", targetDeviasi: -5, targetPct: "96.7%",
        dtdNominal: 2, dtdPct: "1.4%", mtdNominal: 10, mtdPct: "7.4%", ytdNominal: 45, ytdPct: "45.0%", yoyNominal: 65, yoyPct: "81.2%"
    },
    {
        label: "PEND BUNGA",
        level: 1,
        valueR1: "61", valueR2: "385", valueR3: "210", valueR4: "245", valueR5: "285",
        targetNominal: "300", targetDeviasi: -15, targetPct: "95.0%",
        dtdNominal: 3, dtdPct: "1.1%", mtdNominal: 12, mtdPct: "4.4%", ytdNominal: 80, ytdPct: "39.0%", yoyNominal: 110, yoyPct: "62.8%"
    },
    {
        label: "PEND OPS SELAIN BUNGA",
        level: 1,
        valueR1: "8", valueR2: "49", valueR3: "35", valueR4: "42", valueR5: "58",
        targetNominal: "60", targetDeviasi: -2, targetPct: "96.7%",
        dtdNominal: 0.5, dtdPct: "0.9%", mtdNominal: 3, mtdPct: "5.5%", ytdNominal: 22, ytdPct: "61.1%", yoyNominal: 34, yoyPct: "141.6%"
    },
    {
        label: "PEND NON OPS",
        level: 1,
        valueR1: "1", valueR2: "-23", valueR3: "12", valueR4: "5", valueR5: "8",
        targetNominal: "10", targetDeviasi: -2, targetPct: "80.0%",
        dtdNominal: 0.1, dtdPct: "1.2%", mtdNominal: 0.4, mtdPct: "5.2%", ytdNominal: 2, ytdPct: "33.3%", yoyNominal: 3, yoyPct: "60.0%"
    },
    {
        label: "BY BUNGA",
        level: 1,
        valueR1: "31", valueR2: "252", valueR3: "180", valueR4: "165", valueR5: "155",
        targetNominal: "160", targetDeviasi: 5, targetPct: "103.2%",
        dtdNominal: -1.2, dtdPct: "-0.8%", mtdNominal: -4, mtdPct: "-2.5%", ytdNominal: -35, ytdPct: "-18.4%", yoyNominal: -45, yoyPct: "-22.5%"
    },
    {
        label: "BY OPS SELAIN BUNGA",
        level: 1,
        valueR1: "28", valueR2: "420", valueR3: "310", valueR4: "295", valueR5: "275",
        targetNominal: "280", targetDeviasi: 5, targetPct: "101.8%",
        dtdNominal: -2.1, dtdPct: "-0.8%", mtdNominal: -8, mtdPct: "-2.8%", ytdNominal: -55, ytdPct: "-16.6%", yoyNominal: -75, yoyPct: "-21.4%"
    },
    {
        label: "BY NON OPS",
        level: 1,
        valueR1: "0", valueR2: "0", valueR3: "1", valueR4: "2", valueR5: "1",
        targetNominal: "2", targetDeviasi: 1, targetPct: "50.0%",
        dtdNominal: 0.0, dtdPct: "0.0%", mtdNominal: 0.1, mtdPct: "10.0%", ytdNominal: 0.5, ytdPct: "100.0%", yoyNominal: 0.8, yoyPct: "400.0%"
    },
    // ASSET SECTION
    {
        label: "TOTAL ASET",
        level: 0,
        isBold: true,
        valueR1: "14,361", valueR2: "13,362", valueR3: "12,450", valueR4: "13,840", valueR5: "14,840",
        targetNominal: "15,000", targetDeviasi: -160, targetPct: "98.9%",
        dtdNominal: 45, dtdPct: "0.3%", mtdNominal: 135, mtdPct: "0.9%", ytdNominal: 680, ytdPct: "4.8%", yoyNominal: 940, yoyPct: "6.7%"
    },
    {
        label: "TOTAL CKPN KREDIT",
        level: 0,
        isBold: true,
        valueR1: "223", valueR2: "473", valueR3: "410", valueR4: "435", valueR5: "455",
        targetNominal: "450", targetDeviasi: -5, targetPct: "101.1%",
        dtdNominal: 2.1, dtdPct: "0.5%", mtdNominal: 6.4, mtdPct: "1.4%", ytdNominal: 32, ytdPct: "7.5%", yoyNominal: 48, yoyPct: "11.7%"
    },
    // RATIOS
    {
        label: "NPL (%)",
        level: 0,
        isBold: true,
        isRatio: true,
        valueR1: "1.24", valueR2: "1.02", valueR3: "1.15", valueR4: "1.18", valueR5: "1.21",
        targetNominal: "1.50", targetDeviasi: -0.29, targetPct: "Safe",
        dtdNominal: "0.01", dtdPct: "0.8%", mtdNominal: "0.03", mtdPct: "2.5%", ytdNominal: "0.15", ytdPct: "14.1%", yoyNominal: "0.22", yoyPct: "22.2%"
    },
    {
        label: "BOPO (%)",
        level: 0,
        isBold: true,
        isRatio: true,
        valueR1: "85.08", valueR2: "160.62", valueR3: "83.45", valueR4: "84.12", valueR5: "82.45",
        targetNominal: "85.00", targetDeviasi: 2.55, targetPct: "97.0%",
        dtdNominal: -0.15, dtdPct: "-0.2%", mtdNominal: -0.45, mtdPct: "-0.5%", ytdNominal: -2.4, ytdPct: "-2.8%", yoyNominal: -3.5, yoyPct: "-4.0%"
    },
    {
        label: "LDR (%)",
        level: 0,
        isBold: true,
        isRatio: true,
        valueR1: "49.39", valueR2: "65.64", valueR3: "55.40", valueR4: "56.12", valueR5: "56.68",
        targetNominal: "60.00", targetDeviasi: -3.32, targetPct: "94.5%",
        dtdNominal: 0.12, dtdPct: "0.2%", mtdNominal: 0.35, mtdPct: "0.6%", ytdNominal: 2.1, ytdPct: "3.8%", yoyNominal: 3.2, yoyPct: "5.9%"
    },
    {
        label: "CASA (%)",
        level: 0,
        isBold: true,
        isRatio: true,
        valueR1: "59.09", valueR2: "85.65", valueR3: "62.45", valueR4: "65.40", valueR5: "68.25",
        targetNominal: "65.00", targetDeviasi: 3.25, targetPct: "105.0%",
        dtdNominal: 0.45, dtdPct: "0.7%", mtdNominal: 1.2, mtdPct: "1.8%", ytdNominal: 5.4, ytdPct: "8.5%", yoyNominal: 8.2, yoyPct: "13.6%"
    },
    {
        label: "ROA (%)",
        level: 0,
        isBold: true,
        isRatio: true,
        valueR1: "3.10", valueR2: "0.80", valueR3: "2.15", valueR4: "2.45", valueR5: "2.85",
        targetNominal: "2.50", targetDeviasi: 0.35, targetPct: "114.0%",
        dtdNominal: 0.05, dtdPct: "1.8%", mtdNominal: 0.15, mtdPct: "5.5%", ytdNominal: 0.8, ytdPct: "39.0%", yoyNominal: 1.2, yoyPct: "72.7%"
    },
    {
        label: "NIM (%)",
        level: 0,
        isBold: true,
        isRatio: true,
        valueR1: "2.84", valueR2: "2.17", valueR3: "2.35", valueR4: "2.55", valueR5: "2.65",
        targetNominal: "2.50", targetDeviasi: 0.15, targetPct: "106.0%",
        dtdNominal: 0.02, dtdPct: "0.8%", mtdNominal: 0.08, mtdPct: "3.1%", ytdNominal: 0.4, ytdPct: "17.7%", yoyNominal: 0.6, yoyPct: "29.2%"
    },
];
