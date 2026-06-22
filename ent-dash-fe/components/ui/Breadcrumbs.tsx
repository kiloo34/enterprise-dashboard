"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BreadcrumbItem {
    label: string;
    href: string;
    active?: boolean;
}

export function Breadcrumbs() {
    const pathname = usePathname();
    
    const breadcrumbs = React.useMemo(() => {
        const paths = pathname.split('/').filter(p => p !== '');
        const items: BreadcrumbItem[] = [
            { label: 'Home', href: '/', active: pathname === '/' }
        ];

        let currentPath = '';
        paths.forEach((path, index) => {
            currentPath += `/${path}`;
            
            // Format label: capitalize and replace hyphens
            const label = path
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            items.push({
                label,
                href: currentPath,
                active: index === paths.length - 1
            });
        });

        return items;
    }, [pathname]);

    if (pathname === '/') return null;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] lg:text-xs font-bold uppercase tracking-wider mb-4">
            {breadcrumbs.map((item, index) => (
                <React.Fragment key={item.href}>
                    {index > 0 && (
                        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-50" />
                    )}
                    <Link
                        href={item.href}
                        className={cn(
                            "transition-colors hover:text-[var(--brand-primary)]",
                            item.active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                        )}
                    >
                        {index === 0 ? (
                            <Home className="w-3 h-3" />
                        ) : (
                            item.label
                        )}
                    </Link>
                </React.Fragment>
            ))}
        </nav>
    );
}
