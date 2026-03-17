import { memo } from "react";
import clsx from "clsx";
import { DataRow } from "../../../types";
import { getNumColorClass, formatPositive } from "../../../utils/formatting";

interface TableRowProps {
    row: DataRow;
    showDetails: boolean;
}

export const TableRow = memo(({ row, showDetails }: TableRowProps) => {
    return (
        <tr
            className={clsx(
                "transition-colors",
                row.isRatio ? "bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-100/40 dark:hover:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
        >
            <td
                className={clsx(
                    "p-4 text-left border-r border-gray-200 dark:border-gray-700",
                    (row.isBold || row.isRatio) ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400",
                    row.level === 1 && "pl-8 text-gray-500 dark:text-gray-500 italic",
                    row.level === 2 && "pl-12 text-gray-400 dark:text-gray-600 text-xs italic",
                    row.isLink && "text-blue-600 dark:text-blue-400 cursor-pointer hover:underline",
                    row.isRatio && "font-bold"
                )}
            >
                <div>
                    <div className="flex items-center gap-2">
                        {row.label}
                        {row.isRatio && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Ratio</span>}
                        {row.isAjp && <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">AJP</span>}
                    </div>
                    {row.level !== 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {row.kelompok && <span className="text-[9px] text-gray-400 dark:text-gray-500 uppercase font-medium">{row.kelompok}</span>}
                            {row.segment && <span className="text-[9px] text-blue-400/80 dark:text-blue-500/80 uppercase font-bold tracking-tight">| {row.segment}</span>}
                        </div>
                    )}
                </div>
            </td>
            <td className="p-4 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{row.valueR1}</td>
            <td className="p-4 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{row.valueR2}</td>
            <td className="p-4 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{row.valueR3}</td>
            <td className="p-4 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{row.valueR4}</td>
            <td className="p-4 border-r border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-gray-100">{row.valueR5}</td>
            <td className="p-4 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{row.targetNominal}</td>
            <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700 font-semibold", getNumColorClass(row.targetDeviasi))}>
                {formatPositive(row.targetDeviasi)}
            </td>
            <td className={clsx("p-4 font-bold", showDetails && "border-r border-gray-200 dark:border-gray-700", getNumColorClass(row.targetPct))}>
                {formatPositive(row.targetPct)}
            </td>
            {showDetails && (
                <>
                    <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700", getNumColorClass(row.dtdNominal))}>
                        {formatPositive(row.dtdNominal)}
                    </td>
                    <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700 font-medium", getNumColorClass(row.dtdPct))}>
                        {formatPositive(row.dtdPct)}
                    </td>
                    <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700", getNumColorClass(row.mtdNominal))}>
                        {formatPositive(row.mtdNominal)}
                    </td>
                    <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700 font-medium", getNumColorClass(row.mtdPct))}>
                        {formatPositive(row.mtdPct)}
                    </td>
                    <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700", getNumColorClass(row.ytdNominal))}>
                        {formatPositive(row.ytdNominal)}
                    </td>
                    <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700 font-medium", getNumColorClass(row.ytdPct))}>
                        {formatPositive(row.ytdPct)}
                    </td>
                    <td className={clsx("p-4 border-r border-gray-200 dark:border-gray-700", getNumColorClass(row.yoyNominal))}>
                        {formatPositive(row.yoyNominal)}
                    </td>
                    <td className={clsx("p-4 font-medium", getNumColorClass(row.yoyPct))}>
                        {formatPositive(row.yoyPct)}
                    </td>
                </>
            )}
        </tr>
    );
});

TableRow.displayName = "TableRow";
