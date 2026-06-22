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
                row.isRatio 
                    ? "bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-100/40 dark:hover:bg-blue-900/20" 
                    : "hover:bg-[var(--card-bg-hover)]"
            )}
            style={{ 
                borderBottom: '1px solid var(--card-border)' 
            }}
        >
            <td
                className={clsx(
                    "p-4 text-left border-r",
                    row.isBold ? "font-bold" : "font-medium",
                    row.level === 1 && "pl-8",
                    row.level === 2 && "pl-14 text-sm",
                    row.isLink && "text-blue-600 dark:text-blue-400 cursor-pointer hover:underline",
                    row.isRatio && "font-bold"
                )}
                style={{ 
                    borderColor: 'var(--card-border)',
                    color: row.isBold ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
            >
                <div>
                    <div className="flex items-center gap-2">
                        {row.label}
                        {row.isRatio && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">Ratio</span>}
                        {row.isAjp && <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">AJP</span>}
                    </div>
                    {row.level !== 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {row.kelompok && <span className="text-[9px] uppercase font-medium" style={{ color: 'var(--text-muted)' }}>{row.kelompok}</span>}
                            {row.segment && <span className="text-[9px] text-blue-400/80 dark:text-blue-500/80 uppercase font-bold tracking-tight">| {row.segment}</span>}
                        </div>
                    )}
                </div>
            </td>
            <td className="p-4 border-r" style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>{row.valueR1}</td>
            <td className="p-4 border-r" style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>{row.valueR2}</td>
            <td className="p-4 border-r" style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>{row.valueR3}</td>
            <td className="p-4 border-r" style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>{row.valueR4}</td>
            <td className="p-4 border-r font-bold" style={{ borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}>{row.valueR5}</td>
            <td className="p-4 border-r" style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>{row.targetNominal}</td>
            <td className={clsx("p-4 border-r font-semibold", getNumColorClass(row.targetDeviasi))} style={{ borderColor: 'var(--card-border)' }}>
                {formatPositive(row.targetDeviasi)}
            </td>
            <td className={clsx("p-4 font-bold", showDetails && "border-r", getNumColorClass(row.targetPct))} style={{ borderColor: 'var(--card-border)' }}>
                {formatPositive(row.targetPct)}
            </td>
            {showDetails && (
                <>
                    <td className={clsx("p-4 border-r", getNumColorClass(row.dtdNominal))} style={{ borderColor: 'var(--card-border)' }}>
                        {formatPositive(row.dtdNominal)}
                    </td>
                    <td className={clsx("p-4 border-r font-medium", getNumColorClass(row.dtdPct))} style={{ borderColor: 'var(--card-border)' }}>
                        {formatPositive(row.dtdPct)}
                    </td>
                    <td className={clsx("p-4 border-r", getNumColorClass(row.mtdNominal))} style={{ borderColor: 'var(--card-border)' }}>
                        {formatPositive(row.mtdNominal)}
                    </td>
                    <td className={clsx("p-4 border-r font-medium", getNumColorClass(row.mtdPct))} style={{ borderColor: 'var(--card-border)' }}>
                        {formatPositive(row.mtdPct)}
                    </td>
                    <td className={clsx("p-4 border-r", getNumColorClass(row.ytdNominal))} style={{ borderColor: 'var(--card-border)' }}>
                        {formatPositive(row.ytdNominal)}
                    </td>
                    <td className={clsx("p-4 border-r font-medium", getNumColorClass(row.ytdPct))} style={{ borderColor: 'var(--card-border)' }}>
                        {formatPositive(row.ytdPct)}
                    </td>
                    <td className={clsx("p-4 border-r", getNumColorClass(row.yoyNominal))} style={{ borderColor: 'var(--card-border)' }}>
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
