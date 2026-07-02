"use client";

import React, { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { Database, Plus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { DynamicFormDialog } from "@/components/data-explorer/DynamicFormDialog";
import {
    DataExplorerService,
    TableInfo,
    ColumnSchema,
    PaginatedResult,
} from "@/services/DataExplorerService";

export default function DataExplorerPage() {
    // ── State ─────────────────────────────────────────────────────────────
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ table: string; id: number } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // ── Data Fetching ─────────────────────────────────────────────────────

    const { data: tables } = useSWR<TableInfo[]>(
        "explorer-tables",
        () => DataExplorerService.getTables(),
    );

    const { data: schema } = useSWR<ColumnSchema[]>(
        selectedTable ? `explorer-schema-${selectedTable}` : null,
        () => DataExplorerService.getSchema(selectedTable),
    );

    const { data: records, mutate: mutateRecords, isLoading } = useSWR<PaginatedResult>(
        selectedTable ? `explorer-data-${selectedTable}-${page}-${searchQuery}` : null,
        () =>
            DataExplorerService.getRecords(selectedTable, {
                page,
                page_size: pageSize,
                search: searchQuery,
            }),
        { refreshInterval: 10000 },
    );

    // ── Table Columns (Dynamic) ───────────────────────────────────────────

    const columns: DataTableColumn<Record<string, unknown>>[] = useMemo(() => {
        if (!schema) return [];

        const dataCols: DataTableColumn<Record<string, unknown>>[] = schema
            .slice(0, 8) // Show max 8 columns to prevent overflow
            .map((col) => ({
                key: col.name,
                header: col.name.replace(/_/g, " ").toUpperCase(),
                render: (row: Record<string, unknown>) => {
                    const val = row[col.name];
                    if (val === null || val === undefined) {
                        return <span style={{ color: "var(--text-muted)" }}>—</span>;
                    }
                    if (typeof val === "boolean") {
                        return (
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    val
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-red-500/10 text-red-400"
                                }`}
                            >
                                {val ? "Active" : "Inactive"}
                            </span>
                        );
                    }
                    const str = String(val);
                    return (
                        <span className="truncate max-w-[200px] block" title={str}>
                            {str.length > 40 ? `${str.slice(0, 40)}…` : str}
                        </span>
                    );
                },
            }));

        // Actions column
        dataCols.push({
            key: "_actions",
            header: "AKSI",
            align: "center",
            width: "w-28",
            render: (row: Record<string, unknown>) => {
                const pk = schema.find((c) => c.primary_key);
                const id = pk ? Number(row[pk.name]) : 0;
                return (
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => {
                                setEditingRecord(row);
                                setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10 text-blue-400"
                            title="Edit"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setDeleteTarget({ table: selectedTable, id })}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                            title="Hapus"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            },
        });

        return dataCols;
    }, [schema, selectedTable]);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleTableChange = useCallback((key: string) => {
        setSelectedTable(key);
        setPage(1);
        setSearchQuery("");
    }, []);

    const handleFormSubmit = useCallback(
        async (data: Record<string, unknown>) => {
            setIsSaving(true);
            try {
                if (editingRecord) {
                    const pk = schema?.find((c) => c.primary_key);
                    const id = pk ? Number(editingRecord[pk.name]) : 0;
                    await DataExplorerService.updateRecord(selectedTable, id, data);
                    toast.success("Data berhasil diperbarui");
                } else {
                    await DataExplorerService.createRecord(selectedTable, data);
                    toast.success("Data berhasil ditambahkan");
                }
                setIsFormOpen(false);
                setEditingRecord(null);
                mutateRecords();
            } catch (error) {
                toast.error("Gagal menyimpan data");
                console.error(error);
            } finally {
                setIsSaving(false);
            }
        },
        [editingRecord, schema, selectedTable, mutateRecords],
    );

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        try {
            await DataExplorerService.deleteRecord(deleteTarget.table, deleteTarget.id);
            toast.success("Data berhasil dihapus");
            setDeleteTarget(null);
            mutateRecords();
        } catch (error) {
            toast.error("Gagal menghapus data");
            console.error(error);
        }
    }, [deleteTarget, mutateRecords]);

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <PageHeader
                title="Data Explorer"
                description="Jelajahi, tambah, edit, dan hapus data dari tabel engine secara langsung."
                icon={Database}
            />

            {/* Controls Bar */}
            <div
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl border"
                style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--card-border)",
                }}
            >
                {/* Table Selector */}
                <div className="flex-1 min-w-[200px]">
                    <select
                        value={selectedTable}
                        onChange={(e) => handleTableChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        style={{
                            background: "var(--input-bg)",
                            color: "var(--input-text)",
                            borderColor: "var(--input-border)",
                        }}
                    >
                        <option value="">— Pilih Tabel —</option>
                        {tables?.map((t) => (
                            <option key={t.key} value={t.key}>
                                {t.display_name} ({t.schema}.{t.table_name})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search */}
                {selectedTable && (
                    <div className="relative flex-1 max-w-xs">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: "var(--text-muted)" }}
                        />
                        <input
                            type="text"
                            placeholder="Cari data..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            style={{
                                background: "var(--input-bg)",
                                color: "var(--input-text)",
                                borderColor: "var(--input-border)",
                            }}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                {selectedTable && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => mutateRecords()}
                            className="p-2.5 rounded-xl border transition-colors hover:bg-[var(--card-bg-hover)]"
                            style={{ borderColor: "var(--card-border)", color: "var(--text-muted)" }}
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setEditingRecord(null);
                                setIsFormOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white transition-all hover:bg-blue-500 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Data
                        </button>
                    </div>
                )}
            </div>

            {/* Data Table */}
            {selectedTable ? (
                <DataTable
                    columns={columns}
                    data={records?.data || []}
                    rowKey={(row) => {
                        const pk = schema?.find((c) => c.primary_key);
                        return pk ? String(row[pk.name]) : JSON.stringify(row);
                    }}
                    isLoading={isLoading}
                    emptyText="Tidak ada data di tabel ini"
                    emptyIcon={<Database className="w-8 h-8" style={{ color: "var(--text-muted)" }} />}
                    defaultPageSize={pageSize}
                />
            ) : (
                <div
                    className="flex flex-col items-center justify-center py-24 rounded-2xl border"
                    style={{
                        background: "var(--card-bg)",
                        borderColor: "var(--card-border)",
                    }}
                >
                    <Database className="w-12 h-12 mb-4" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Pilih tabel dari dropdown di atas untuk mulai menjelajahi data.
                    </p>
                </div>
            )}

            {/* Schema Info */}
            {schema && selectedTable && (
                <div
                    className="rounded-2xl border p-4"
                    style={{
                        background: "var(--card-bg)",
                        borderColor: "var(--card-border)",
                    }}
                >
                    <h3
                        className="text-xs font-medium uppercase tracking-wider mb-3"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Skema Kolom ({schema.length} kolom)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {schema.map((col) => (
                            <span
                                key={col.name}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                                    col.primary_key
                                        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                                        : "border-[var(--card-border)] bg-[var(--modal-footer-bg)]"
                                }`}
                                style={
                                    !col.primary_key
                                        ? { color: "var(--text-secondary)" }
                                        : undefined
                                }
                            >
                                {col.primary_key && "🔑 "}
                                {col.name}
                                <span style={{ color: "var(--text-muted)" }}>
                                    ({col.type.toLowerCase()})
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Dynamic Form Dialog */}
            {schema && (
                <DynamicFormDialog
                    isOpen={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingRecord(null);
                    }}
                    onSubmit={handleFormSubmit}
                    columns={schema}
                    initialData={editingRecord}
                    title={editingRecord ? "Edit Data" : "Tambah Data Baru"}
                    isLoading={isSaving}
                />
            )}

            {/* Delete Confirmation */}
            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Hapus Data"
                message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
            />
        </div>
    );
}
