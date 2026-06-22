"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUsers, usePositions, useOrgUnits, useRoles, IAMService, User } from '@/services/IAMService';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FormInput } from '@/components/ui/FormInput';
import { FormCheckbox } from '@/components/ui/FormCheckbox';
import { toast } from 'sonner';

export default function UsersPage() {
    const { users, isLoading, mutate } = useUsers();
    const { positions } = usePositions();
    const { orgUnits } = useOrgUnits();
    const { roles } = useRoles();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        is_active: true,
        is_superuser: false,
        position_id: '' as string | number,
        organization_unit_id: '' as string | number,
        role_ids: [] as number[],
    });

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Leave blank for edit unless changing
                is_active: user.is_active,
                is_superuser: user.is_superuser,
                position_id: user.position?.id || '',
                organization_unit_id: user.organization_unit?.id || '',
                role_ids: user.roles ? user.roles.map(r => r.id) : [],
            });
        } else {
            setEditingUser(null);
            setFormData({ 
                name: '', 
                email: '', 
                password: '', 
                is_active: true, 
                is_superuser: false,
                position_id: '',
                organization_unit_id: '',
                role_ids: [],
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: any = {
                name: formData.name,
                email: formData.email,
                is_active: formData.is_active,
                is_superuser: formData.is_superuser,
                position_id: formData.position_id ? Number(formData.position_id) : null,
                organization_unit_id: formData.organization_unit_id ? Number(formData.organization_unit_id) : null,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (editingUser) {
                await IAMService.updateUser(editingUser.id, payload);
                if (formData.role_ids.length >= 0) { // Actually we should only assign if we fetched them correctly, but let's always sync roles
                    await IAMService.assignUserRoles(editingUser.id, formData.role_ids);
                }
                toast.success('User updated successfully');
            } else {
                if (!formData.password) throw new Error("Password is required for new users.");
                const newUser = await IAMService.createUser(payload);
                if (formData.role_ids.length > 0) {
                    await IAMService.assignUserRoles(newUser.id, formData.role_ids);
                }
                toast.success('User created successfully');
            }
            mutate();
            handleCloseDialog();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await IAMService.deleteUser(id);
            toast.success('User deleted successfully');
            mutate();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        }
    };

    const columns: DataTableColumn<User>[] = [
        {
            key: 'name',
            header: 'User',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-sm text-gray-500">{row.email}</div>
                </div>
            ),
        },
        {
            key: 'position',
            header: 'Position',
            render: (row) => row.position?.name || '-',
        },
        {
            key: 'organization',
            header: 'Organization Unit',
            render: (row) => row.organization_unit?.name || '-',
        },
        {
            key: 'role_type',
            header: 'System Role',
            align: 'center',
            render: (row) => (
                <div className="flex flex-col items-center gap-1">
                    {row.roles && row.roles.map(r => (
                        <span key={r.id} className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700">
                            {r.name}
                        </span>
                    ))}
                    {row.is_superuser && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-700">
                            Superuser
                        </span>
                    )}
                </div>
            ),
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
                        title="Edit User"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete User"
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
                title="Users"
                description="Manage system users, their positions, and organization unit assignments."
                actions={
                    <button
                        onClick={() => handleOpenDialog()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add User
                    </button>
                }
            />

            <DataTable
                columns={columns}
                data={users}
                rowKey={(row) => row.id}
                isLoading={isLoading}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                                <input
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Position</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.position_id}
                                    onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {positions?.map(pos => (
                                        <option key={pos.id} value={pos.id}>{pos.name} (Level {pos.level})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Organization Unit</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.organization_unit_id}
                                    onChange={(e) => setFormData({ ...formData, organization_unit_id: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {orgUnits?.map(org => (
                                        <option key={org.id} value={org.id}>{org.name} - {org.pluck_code}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Assigned Roles</label>
                            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50/50">
                                {roles?.map(role => (
                                    <label key={role.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border shadow-sm hover:border-blue-300">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            checked={formData.role_ids.includes(role.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData(prev => ({ ...prev, role_ids: [...prev.role_ids, role.id] }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, role_ids: prev.role_ids.filter(id => id !== role.id) }));
                                                }
                                            }}
                                        />
                                        <span className="text-sm">{role.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                {editingUser ? "New Password (leave blank to keep current)" : "Password"}
                            </label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                        </div>

                        <div className="flex gap-6 mt-2">
                            <div className="flex flex-col gap-1">
                                <FormCheckbox
                                    label="Active User"
                                    checked={formData.is_active}
                                    onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <p className="text-xs text-gray-500 ml-1">Can log in to the system</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <FormCheckbox
                                    label="Superuser"
                                    checked={formData.is_superuser}
                                    onChange={(checked) => setFormData({ ...formData, is_superuser: checked })}
                                />
                                <p className="text-xs text-gray-500 ml-1">Has full system access</p>
                            </div>
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
