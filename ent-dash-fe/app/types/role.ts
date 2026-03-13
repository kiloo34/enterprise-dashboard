export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    description?: string;
    owner?: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    permissions?: Permission[];
}

export interface RoleFormData {
    name: string;
    permissions: number[]; // Array of Permission IDs
}
