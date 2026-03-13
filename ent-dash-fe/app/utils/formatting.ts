export const getNumColorClass = (val: string | number | undefined) => {
    if (val === undefined || val === "-") return "text-gray-900 dark:text-gray-100";
    if (val === "Safe") return "text-green-600 dark:text-green-400 font-bold";

    const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : val;
    if (isNaN(num)) return "text-gray-900 dark:text-gray-100";
    if (num > 0 && num < 100) return "text-green-600 dark:text-green-400";
    if (num < 0) return "text-red-600 dark:text-red-400";
    if (num > 100) return "text-green-600 dark:text-green-400"; // For achievement %
    return "text-gray-900 dark:text-gray-100";
};

export const formatPositive = (val: string | number | undefined) => {
    if (val === undefined) return "-";
    if (typeof val === "number" && val > 0) return `+${val}`;
    return val;
};

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

/**
 * Formats large numbers into human-readable strings (B, M, K)
 */
export const formatBigNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return new Intl.NumberFormat("id-ID").format(num);
};
