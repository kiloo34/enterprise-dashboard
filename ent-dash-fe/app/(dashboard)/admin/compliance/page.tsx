"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Database, AlertOctagon } from 'lucide-react';
import { ComplianceService, ComplianceReport } from '../../../../services/ComplianceService';

export default function ComplianceMonitoringPage() {
    const [report, setReport] = useState<ComplianceReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        ComplianceService.getReport()
            .then(data => {
                if (isMounted) {
                    setReport(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center min-h-[500px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
                <AlertOctagon className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Failed to load compliance report</h3>
                <p className="mt-2 text-sm text-gray-500">Could not connect to the compliance auditor engine.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">UU PDP Compliance Monitoring</h1>
                <p className="text-gray-500 mt-2">
                    Ongoing assessment of system health, data retention policies, and breach anomaly detection.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Health Score Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Health Score</h3>
                        {report.health_score === 100 ? (
                            <ShieldCheck className="h-6 w-6 text-green-500" />
                        ) : (
                            <ShieldAlert className="h-6 w-6 text-yellow-500" />
                        )}
                    </div>
                    <div className="mt-4">
                        <span className={`text-4xl font-bold tracking-tight ${report.health_score === 100 ? 'text-green-600' : report.health_score >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {report.health_score}
                        </span>
                        <span className="text-gray-500 ml-2">/ 100</span>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div 
                            className={`h-full transition-all duration-1000 ${report.health_score === 100 ? 'bg-green-500' : report.health_score >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${report.health_score}%` }}
                        />
                    </div>
                </div>

                {/* Retention Gaps Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Retention Gaps</h3>
                        <Database className={`h-6 w-6 ${report.retention_gaps > 0 ? 'text-red-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="mt-4">
                        <span className={`text-4xl font-bold tracking-tight ${report.retention_gaps > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {report.retention_gaps}
                        </span>
                        <span className="text-gray-500 ml-2">logs &gt; 5 years</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                        {report.retention_gaps > 0 
                            ? "Action required: Data older than 5 years must be purged to comply with UU PDP."
                            : "All data retention policies are currently satisfied."}
                    </p>
                </div>

                {/* Anomalies Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Active Anomalies</h3>
                        <AlertOctagon className={`h-6 w-6 ${report.breach_alerts.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="mt-4">
                        <span className={`text-4xl font-bold tracking-tight ${report.breach_alerts.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {report.breach_alerts.length}
                        </span>
                        <span className="text-gray-500 ml-2">breach alerts</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                        Monitoring excessive DATA_EXPORT actions within the last 24 hours.
                    </p>
                </div>
            </div>

            {/* Anomalies Table */}
            {report.breach_alerts.length > 0 && (
                <div className="mt-8 rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="border-b border-red-100 bg-red-50/50 px-6 py-4 flex items-center justify-between">
                        <h3 className="font-semibold text-red-800 flex items-center text-lg">
                            <AlertOctagon className="w-5 h-5 mr-2" />
                            Data Breach Incident Log
                        </h3>
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2.5 py-1 rounded-full">Requires Immediate Action</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/80 text-xs uppercase text-gray-500 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">User ID</th>
                                    <th className="px-6 py-3 font-semibold">IP Address</th>
                                    <th className="px-6 py-3 font-semibold">Incident Type</th>
                                    <th className="px-6 py-3 font-semibold">Occurrences</th>
                                    <th className="px-6 py-3 font-semibold">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {report.breach_alerts.map((alert, idx) => (
                                    <tr key={idx} className="bg-white hover:bg-red-50/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">User #{alert.user_id}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{alert.ip_address || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-red-600 font-medium">{alert.incident_type}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{alert.count}x attempts</td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold tracking-wide text-red-800">
                                                {alert.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
