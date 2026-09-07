'use client';

import { useState, useEffect } from 'react';
import { getSchemas, getTables, getTableColumns, ColumnDefinition } from '@/services/DataDictionaryService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Database, TableProperties, Key, LayoutList, Search } from 'lucide-react';

export default function DataDictionaryPage() {
    const [schemas, setSchemas] = useState<string[]>([]);
    const [selectedSchema, setSelectedSchema] = useState<string>('');
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [columns, setColumns] = useState<ColumnDefinition[]>([]);
    const [isLoadingSchemas, setIsLoadingSchemas] = useState(true);
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [isLoadingColumns, setIsLoadingColumns] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { fetchSchemas(); }, []);

    useEffect(() => {
        if (selectedSchema) { fetchTables(selectedSchema); }
        else { setTables([]); setSelectedTable(''); setColumns([]); }
    }, [selectedSchema]);

    useEffect(() => {
        if (selectedSchema && selectedTable) { fetchColumns(selectedSchema, selectedTable); }
        else { setColumns([]); }
    }, [selectedSchema, selectedTable]);

    const fetchSchemas = async () => {
        setIsLoadingSchemas(true);
        setError(null);
        try {
            const data = await getSchemas();
            setSchemas(data);
            if (data.length > 0) setSelectedSchema(data[0]);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch schemas');
        } finally {
            setIsLoadingSchemas(false);
        }
    };

    const fetchTables = async (schema: string) => {
        setIsLoadingTables(true);
        try {
            const data = await getTables(schema);
            setTables(data);
            setSelectedTable('');
        } catch (err: any) {
            setError(err.message || 'Failed to fetch tables');
        } finally {
            setIsLoadingTables(false);
        }
    };

    const fetchColumns = async (schema: string, table: string) => {
        setIsLoadingColumns(true);
        try {
            const data = await getTableColumns(schema, table);
            setColumns(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch columns');
        } finally {
            setIsLoadingColumns(false);
        }
    };

    const filteredTables = tables.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Data Dictionary"
                description="Explore database schemas, tables, and column metadata."
                icon={Database}
            />

            {error && (
                <div className="p-4 rounded-xl border text-sm font-medium flex items-center gap-2"
                    style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: 'rgb(239,68,68)' }}>
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: '75vh' }}>

                {/* ── LEFT PANE ── */}
                <div className="lg:col-span-1 rounded-2xl border flex flex-col overflow-hidden"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>

                    {/* Schema selector */}
                    <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <LayoutList className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                Database Explorer
                            </span>
                        </div>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-1 block"
                            style={{ color: 'var(--text-muted)' }}>
                            Schema
                        </label>
                        <select
                            className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-all"
                            style={{
                                background: 'var(--card-bg-hover)',
                                borderColor: 'var(--card-border)',
                                color: 'var(--text-primary)',
                            }}
                            value={selectedSchema}
                            onChange={(e) => setSelectedSchema(e.target.value)}
                            disabled={isLoadingSchemas}
                        >
                            {isLoadingSchemas
                                ? <option>Loading schemas...</option>
                                : schemas.map(s => <option key={s} value={s}>{s}</option>)
                            }
                        </select>
                    </div>

                    {/* Table search */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                            style={{ background: 'var(--card-bg-hover)', borderColor: 'var(--card-border)' }}>
                            <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search tables..."
                                className="bg-transparent outline-none text-sm flex-1 min-w-0"
                                style={{ color: 'var(--text-primary)' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table list */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {isLoadingTables ? (
                            <div className="p-4 text-center text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>
                                Loading tables...
                            </div>
                        ) : filteredTables.length === 0 ? (
                            <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                {selectedSchema ? 'No tables found.' : 'Select a schema first.'}
                            </div>
                        ) : (
                            <ul className="space-y-0.5">
                                {filteredTables.map(table => {
                                    const isActive = selectedTable === table;
                                    return (
                                        <li key={table}>
                                            <button
                                                onClick={() => setSelectedTable(table)}
                                                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 group"
                                                style={{
                                                    background: isActive ? 'var(--primary-muted, rgba(59,130,246,0.15))' : 'transparent',
                                                    color: isActive ? 'var(--primary, #3b82f6)' : 'var(--text-secondary)',
                                                    fontWeight: isActive ? 600 : 400,
                                                }}
                                            >
                                                <TableProperties className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="truncate">{table}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANE ── */}
                <div className="lg:col-span-3 rounded-2xl border flex flex-col overflow-hidden"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>

                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between"
                        style={{ borderColor: 'var(--card-border)' }}>
                        <div>
                            <div className="flex items-center gap-2">
                                <TableProperties className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {selectedTable || 'Table Definition'}
                                </h2>
                            </div>
                            {selectedTable && (
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Schema: <span style={{ color: 'var(--text-secondary)' }}>{selectedSchema}</span>
                                </p>
                            )}
                        </div>
                        {selectedTable && (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full border"
                                style={{
                                    background: 'rgba(59,130,246,0.1)',
                                    borderColor: 'rgba(59,130,246,0.25)',
                                    color: '#3b82f6',
                                }}>
                                {columns.length} columns
                            </span>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto">
                        {!selectedTable ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3"
                                style={{ color: 'var(--text-muted)' }}>
                                <Database className="w-16 h-16 opacity-20" />
                                <p className="text-sm">Select a table from the left to view its definition.</p>
                            </div>
                        ) : isLoadingColumns ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary, #3b82f6)' }} />
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 z-10 text-xs uppercase tracking-wider"
                                    style={{ background: 'var(--card-bg-hover)', color: 'var(--text-muted)' }}>
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Column Name</th>
                                        <th className="px-6 py-3 font-semibold">Data Type</th>
                                        <th className="px-6 py-3 font-semibold text-center">Nullable</th>
                                        <th className="px-6 py-3 font-semibold">Default Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {columns.map((col, i) => (
                                        <tr key={i} className="border-t transition-colors"
                                            style={{ borderColor: 'var(--card-border)' }}>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    {col.primary_key && (
                                                        <Key className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" title="Primary Key" />
                                                    )}
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {col.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-xs font-mono px-2 py-1 rounded"
                                                    style={{
                                                        background: 'rgba(59,130,246,0.1)',
                                                        color: '#60a5fa',
                                                    }}>
                                                    {col.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {col.nullable ? (
                                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Yes</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-red-400">No</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                                    {col.default || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
