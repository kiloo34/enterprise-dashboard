import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Users } from 'lucide-react';

jest.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useRouter: () => ({ push: jest.fn() }),
}));

describe('PageHeader', () => {
    it('renders title correctly', () => {
        render(<PageHeader title="Manajemen User" />);
        expect(screen.getByText('Manajemen User')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(
            <PageHeader
                title="Dashboard"
                description="Kelola semua data di sini"
            />
        );
        expect(screen.getByText('Kelola semua data di sini')).toBeInTheDocument();
    });

    it('does not render description when omitted', () => {
        const { queryByText } = render(<PageHeader title="No Desc" />);
        expect(queryByText('Kelola')).not.toBeInTheDocument();
    });

    it('renders icon container when icon prop is provided', () => {
        const { container } = render(<PageHeader title="With Icon" icon={Users} />);
        // Icon wrapper div should be present
        const iconWrapper = container.querySelector('.w-14.h-14.rounded-2xl');
        expect(iconWrapper).toBeInTheDocument();
    });

    it('does not render icon container when icon prop is absent', () => {
        const { container } = render(<PageHeader title="No Icon" />);
        const iconWrapper = container.querySelector('.w-14.h-14');
        expect(iconWrapper).not.toBeInTheDocument();
    });

    it('renders actions when provided', () => {
        const action = <button>Tambah User</button>;
        render(<PageHeader title="With Actions" actions={action} />);
        expect(screen.getByText('Tambah User')).toBeInTheDocument();
    });

    it('uses h1 for the title for SEO semantics', () => {
        render(<PageHeader title="SEO Title" />);
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('SEO Title');
    });

    it('uses semantic CSS variable for title color', () => {
        render(<PageHeader title="Token Test" />);
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1.style.color).toBe('var(--text-primary)');
    });
});
