import React from "react";
import { AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import clsx from "clsx";

interface ChurnResultCardProps {
    probability: number;
    prediction: string;
}

export const ChurnResultCard: React.FC<ChurnResultCardProps> = ({ probability, prediction }) => {
    // Format probability to percentage
    const percentage = (probability * 100).toFixed(2);
    
    // Determine risk level based on prediction or probability
    const isHighRisk = prediction === "1" || probability > 0.5;
    const isMediumRisk = probability > 0.3 && probability <= 0.5;
    
    let statusColor = "text-emerald-500";
    let bgPulse = "bg-emerald-500/20";
    let Icon = CheckCircle2;
    let riskText = "Low Risk";

    if (isHighRisk) {
        statusColor = "text-rose-500";
        bgPulse = "bg-rose-500/20";
        Icon = AlertCircle;
        riskText = "High Risk";
    } else if (isMediumRisk) {
        statusColor = "text-amber-500";
        bgPulse = "bg-amber-500/20";
        Icon = TrendingDown;
        riskText = "Medium Risk";
    }

    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon size={120} className={statusColor} />
            </div>
            
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Churn Probability
            </h3>
            
            <div className="flex items-baseline gap-2 mb-4">
                <span className={clsx("text-4xl font-bold tracking-tight", statusColor)}>
                    {percentage}%
                </span>
                <span className="text-sm text-gray-500">likelihood</span>
            </div>

            <div className="flex items-center gap-2">
                <div className={clsx("flex items-center justify-center w-8 h-8 rounded-full", bgPulse)}>
                    <Icon size={16} className={statusColor} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {riskText}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isHighRisk 
                            ? "Immediate retention action recommended."
                            : "Monitor customer activity closely."}
                    </p>
                </div>
            </div>
            
            {/* Progress Bar Visual */}
            <div className="mt-6 h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className={clsx("h-full rounded-full transition-all duration-1000 ease-out", 
                        isHighRisk ? "bg-rose-500" : isMediumRisk ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
