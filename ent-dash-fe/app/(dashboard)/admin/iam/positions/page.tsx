"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePositions, IAMService, Position } from '@/services/IAMService';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FormInput } from '@/components/ui/FormInput';
import { FormCheckbox } from '@/components/ui/FormCheckbox';
import { toast } from 'sonner';

export default function PositionsPage() {
    const { positions, isLoading, mutate } = usePositions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        level: 1,
        is_active: true,
    });

    const handleOpenDialog = (position?: Position) => {
        if (position) {
            setEditingPosition(position);
            setFormData({
                name: position.name,
                level: position.level,
                is_active: position.is_active,
            });
        } else {
            setEditingPosition(null);
            setFormData({ name: '', level: 1, is_active: true });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingPosition(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingPosition) {
                await IAMService.updatePosition(editingPosition.id, formData);
                toast.success('Position updated successfully');
            } else {
                await IAMService.createPosition(formData);
                toast.success('Position created successfully');
            }
            mutate();
            handleCloseDialog();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save position');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this position?')) return;
        try {
            await IAMService.deletePosition(id);
            toast.success('Position deleted successfully');
            mutate();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete position');
        }
    };

    const columns: DataTableColumn<Position>[] = [
        {
            key: 'name',
            header: 'Position Name',
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'level',
            header: 'Level',
            align: 'center',
            render: (row) => row.level,
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            render: (row) => (
                <StatusBadge 
                    status={row.is_active ? 'success' : 'default'} 
                    label={row.is_active ? 'Active' : 'Inactive'} 
                />
            ),
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
                        title="Edit Position"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Position"
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
                title="Positions"
                description="Manage organizational positions and hierarchy levels."
                actions={
                    <button
                        onClick={() => handleOpenDialog()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Position
                    </button>
                }
            />

            <DataTable
                columns={columns}
                data={positions}
                rowKey={(row) => row.id}
                isLoading={isLoading}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPosition ? 'Edit Position' : 'Create Position'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Position Name</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Software Engineer"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Level</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min={1}
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <FormCheckbox
                                label="Active Status"
                                checked={formData.is_active}
                                onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <p className="text-xs text-gray-500 ml-1">Inactive positions cannot be assigned to new users.</p>
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
