"use client";

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { AuditService, AuditLog } from '@/services/AuditService';
import { Activity } from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        AuditService.getAuditLogs(0, 100)
            .then(data => {
                if (isMounted) {
                    setLogs(data);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) setIsLoading(false);
            });
        return () => { isMounted = false; };
    }, []);

    const columns: DataTableColumn<AuditLog>[] = [
        {
            key: 'timestamp',
            header: 'Timestamp',
            render: (row) => (
                <div className="text-sm whitespace-nowrap text-gray-600">
                    {new Date(row.created_at).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    })}
                </div>
            ),
        },
        {
            key: 'action',
            header: 'Action',
            render: (row) => (
                <div className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-block text-[11px] uppercase tracking-wider border border-blue-100">
                    {row.action}
                </div>
            ),
        },
        {
            key: 'actor',
            header: 'Actor ID',
            render: (row) => (
                <span className="font-medium text-gray-900">
                    {row.user_id ? `User #${row.user_id}` : 'System'}
                </span>
            )
        },
        {
            key: 'target',
            header: 'Target Resource',
            render: (row) => (
                <div className="text-sm">
                    <span className="font-medium text-gray-700">{row.target_type}</span>
                    {row.target_id && <span className="text-gray-400 ml-1.5 font-mono text-xs">[{row.target_id}]</span>}
                </div>
            ),
        },
        {
            key: 'network',
            header: 'Network Trace',
            render: (row) => (
                <div className="flex flex-col text-xs font-mono text-gray-500">
                    {row.ip_address ? <span>IP: {row.ip_address}</span> : <span className="text-gray-300">Internal</span>}
                    {row.endpoint && <span className="mt-0.5 truncate max-w-[200px]">{row.method} {row.endpoint}</span>}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            render: (row) => (
                row.status_code ? (
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold tracking-wide ${row.status_code >= 400 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {row.status_code}
                    </span>
                ) : <span className="text-gray-300">-</span>
            ),
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Forensic Audit Logs"
                description="Monitor system activity, data access events, and network traces for UU PDP compliance."
                actions={
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                        <Activity className="w-4 h-4" /> Export CSV Report
                    </button>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={logs}
                    rowKey={(row) => row.id}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
