/**
 * Utility for exporting data to various formats (e.g., CSV).
 */

/**
 * Converts an array of objects to a CSV string.
 * @param data Array of objects to convert
 * @returns CSV string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertToCSV(data: any[]): string {
    if (!data || !data.length) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(","),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Handle strings with commas, quotes, or newlines by wrapping in quotes and escaping internal quotes
                if (typeof value === "string") {
                    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }
                return value !== null && value !== undefined ? String(value) : "";
            }).join(",")
        )
    ];

    return csvRows.join("\n");
}

/**
 * Triggers a file download in the browser.
 * @param content The content of the file
 * @param fileName The name of the file
 * @param mimeType The MIME type of the file
 */
export function downloadFile(content: string, fileName: string, mimeType: string = "text/csv;charset=utf-8;") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Exports data to a CSV file and downloads it.
 * @param data Array of objects to export
 * @param fileName The base filename (without .csv extension)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV(data: any[], fileName: string) {
    if (!data || !data.length) {
        console.warn("No data to export");
        return;
    }

    const csvContent = convertToCSV(data);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csvContent, `${fileName}_${dateStr}.csv`);
}
