import React from 'react';
import { Users, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface UserHeaderTranslations {
    title: string;
    subtitle: string;
    addButton: string;
}

interface UserHeaderProps {
    t: UserHeaderTranslations;
    canCreate: boolean;
    /** Called when the user clicks the Add User button */
    onAdd: () => void;
}

export function UserHeader({ t, canCreate, onAdd }: UserHeaderProps) {
    return (
        <PageHeader
            title={t.title}
            description={t.subtitle}
            icon={Users}
            actions={canCreate ? (
                <button
                    onClick={onAdd}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.addButton}
                </button>
            ) : undefined}
        />
    );
}
