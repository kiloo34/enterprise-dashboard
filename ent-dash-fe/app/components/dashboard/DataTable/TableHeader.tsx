import React from "react";
import clsx from "clsx";

import { TranslationSchema } from "../../../utils/locales/types";

interface TableHeaderProps {
    translations: TranslationSchema["DataTable"];
    showDetails: boolean;
}

export function TableHeader({ translations, showDetails }: TableHeaderProps) {
    const t = translations;

    return (
        <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <th
                    rowSpan={2}
                    className="p-4 text-left font-bold text-gray-700 dark:text-gray-200 w-1/4 border-r border-gray-200 dark:border-gray-700"
                >
                    {t.headers.keterangan}
                </th>
                <th colSpan={5} className="p-3 font-bold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                    {t.headers.realisasi}
                </th>
                <th colSpan={3} className={clsx("p-3 font-bold text-gray-700 dark:text-gray-200", showDetails && "border-r border-gray-200 dark:border-gray-700")}>
                    {t.headers.target}
                </th>
                {showDetails && (
                    <>
                        <th colSpan={2} className="p-3 font-bold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                            {t.headers.dtd}
                        </th>
                        <th colSpan={2} className="p-3 font-bold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                            {t.headers.mtd}
                        </th>
                        <th colSpan={2} className="p-3 font-bold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                            {t.headers.ytd}
                        </th>
                        <th colSpan={2} className="p-3 font-bold text-gray-700 dark:text-gray-200">
                            {t.headers.yoy}
                        </th>
                    </>
                )}
            </tr>
            <tr className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold">
                <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">30/10</th>
                <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">31/10</th>
                <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">01/11</th>
                <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">02/11</th>
                <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">03/11</th>
                <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">{t.headers.nominal}</th>
                <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">{t.headers.deviasi}</th>
                <th className={clsx("p-3 border-t", showDetails && "border-r border-gray-200 dark:border-gray-700")}>%</th>
                {showDetails && (
                    <>
                        <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">{t.headers.nominal}</th>
                        <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">%</th>
                        <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">{t.headers.nominal}</th>
                        <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">%</th>
                        <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">{t.headers.nominal}</th>
                        <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">%</th>
                        <th className="p-3 border-r border-gray-200 dark:border-gray-700 border-t">{t.headers.nominal}</th>
                        <th className="p-3 border-t">%</th>
                    </>
                )}
            </tr>
        </thead>
    );
}
