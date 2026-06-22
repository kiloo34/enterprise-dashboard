import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
    return (
        <div
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 lg:p-8 rounded-3xl shadow-sm relative overflow-hidden group transition-all border backdrop-blur-sm"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500" />
            
            <div className="relative z-10">
                <Breadcrumbs />
                <div className="flex items-center gap-6">
                    {Icon && (
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center border border-blue-100 dark:border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm mt-2 max-w-2xl font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {actions && (
                <div className="w-full lg:w-auto relative z-10 flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
