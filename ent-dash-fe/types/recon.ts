export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface EngineLog {
    id: string;              // Primary Key tabel log
    timestamp: string;       // Timestamp log direkam
    engineName: string;      // Wildcard pada nama tabel (misal: 'qris' untuk engine_qris_log)
    runId: string;           // Referensi ke ID eksekusi di tabel engine_*_his
    level: LogLevel;         // Level severity
    message: string;         // Pesan log/event
    module: string;          // Modul atau langkah dalam eksekusi
    tableName: string;       // Menyimpan sumber tabel fisik log (engine_*_log)
    historyTable: string;    // Menyimpan sumber tabel fisik histori (engine_*_his)
    processed_rows?: number;
    total_rows?: number;
}

export interface ReconStats {
    totalLogs: number;
    errorTrend: number;
    warningCount: number;
    mostActiveEngine: string;
    mostActivePercent: number;
}
