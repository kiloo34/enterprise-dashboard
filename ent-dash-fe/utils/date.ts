/**
 * Get current date as ISO string (YYYY-MM-DD)
 * accounting for local timezone offset.
 */
export const getTodayIsoString = (): string => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

/**
 * Basic date formatter for UI display
 */
export const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
};
