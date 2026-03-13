export interface Position {
    id: number;
    name: string;
    level: number;
}

export interface OrganizationUnit {
    id: number;
    name: string;
    level: string;
    code: string;
    parent_id: number | null;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    description?: string;
    owner?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    position_id: number | null;
    organization_unit_id: number | null;
    direct_superior_id: number | null;
    created_at: string;
    updated_at: string;
    position?: Position;
    organization_unit?: OrganizationUnit;
    roles?: Role[];
    permissions?: Permission[];
}

export interface UserFormData {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    position_id?: number | null;
    organization_unit_id?: number | null;
    direct_superior_id?: number | null;
    roles?: number[]; // Array of role IDs
    permissions?: number[]; // Array of permission IDs
}
