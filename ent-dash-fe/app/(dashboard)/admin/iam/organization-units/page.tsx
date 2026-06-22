"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useOrgUnits, IAMService, OrgUnit } from '@/services/IAMService';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FormInput } from '@/components/ui/FormInput';
import { toast } from 'sonner';

export default function OrgUnitsPage() {
    const { orgUnits, isLoading, mutate } = useOrgUnits();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrgUnit, setEditingOrgUnit] = useState<OrgUnit | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        pluck_code: '',
        type: 'Division',
    });

    const handleOpenDialog = (orgUnit?: OrgUnit) => {
        if (orgUnit) {
            setEditingOrgUnit(orgUnit);
            setFormData({
                name: orgUnit.name,
                pluck_code: orgUnit.pluck_code,
                type: orgUnit.type,
            });
        } else {
            setEditingOrgUnit(null);
            setFormData({ name: '', pluck_code: '', type: 'Division' });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingOrgUnit(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingOrgUnit) {
                await IAMService.updateOrgUnit(editingOrgUnit.id, formData);
                toast.success('Organization Unit updated successfully');
            } else {
                await IAMService.createOrgUnit(formData);
                toast.success('Organization Unit created successfully');
            }
            mutate();
            handleCloseDialog();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save organization unit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this organization unit?')) return;
        try {
            await IAMService.deleteOrgUnit(id);
            toast.success('Organization Unit deleted successfully');
            mutate();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete organization unit');
        }
    };

    const columns: DataTableColumn<OrgUnit>[] = [
        {
            key: 'name',
            header: 'Organization Name',
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'pluck_code',
            header: 'Pluck Code',
            render: (row) => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{row.pluck_code}</span>,
        },
        {
            key: 'type',
            header: 'Type',
            render: (row) => row.type,
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleOpenDialog(row)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Org Unit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Org Unit"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Organization Units"
                description="Manage organizational units (Branches, Divisions, etc.)"
                actions={
                    <button
                        onClick={() => handleOpenDialog()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Org Unit
                    </button>
                }
            />

            <DataTable
                columns={columns}
                data={orgUnits}
                rowKey={(row) => row.id}
                isLoading={isLoading}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingOrgUnit ? 'Edit Org Unit' : 'Create Org Unit'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Organization Name</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. KC Jakarta"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Pluck Code</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.pluck_code}
                                onChange={(e) => setFormData({ ...formData, pluck_code: e.target.value })}
                                placeholder="e.g. JKT01"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Type</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                required
                            >
                                <option value="Branch">Branch</option>
                                <option value="Division">Division</option>
                                <option value="Department">Department</option>
                                <option value="Group">Group</option>
                            </select>
                        </div>
                        <DialogFooter className="pt-4">
                            <button
                                type="button"
                                onClick={handleCloseDialog}
                                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
