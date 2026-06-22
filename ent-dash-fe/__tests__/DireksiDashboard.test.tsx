import React from 'react';
import { render, screen } from '@testing-library/react';
import DireksiDashboard from '../app/(dashboard)/direksi/kinerja-keuangan/page';
import { useFinancialDashboard } from '../services/FinancialService';
import { useAuth } from '../components/AuthContext';

jest.mock('@/services/FinancialService', () => ({
    useFinancialDashboard: jest.fn(),
}));
jest.mock('@/components/AuthContext', () => ({
    useAuth: jest.fn(),
}));
jest.mock('@/hooks/useTranslation', () => ({
    useTranslation: () => ({
        totalAsset: 'Total Aset',
        dpk: 'DPK',
        loan: 'Kredit',
        footerInfo: 'Footer Info',
        scale: 'Scale',
    }),
}));
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => '/direksi/kinerja-keuangan',
}));

// Mock heavy/problematic sub-components
jest.mock('@/components/dashboard/FilterBar', () => ({
    FilterBar: () => <div data-testid="filter-bar" />,
}));
jest.mock('@/components/dashboard/DataTable/DataTable', () => ({
    DataTable: () => <div data-testid="data-table" />,
}));
jest.mock('@/components/dashboard/MetricsGrid', () => ({
    MetricsGrid: ({ metrics }: { metrics: any[] }) => (
        <div data-testid="metrics-grid">
            {metrics.map((m) => (
                <div key={m.title}>{m.title}: {m.value}</div>
            ))}
        </div>
    ),
}));
jest.mock('@/components/dashboard/DPKBreakdownCharts', () => ({
    DPKBreakdownCharts: () => <div data-testid="charts" />,
}));

describe('DireksiDashboard Page', () => {
    beforeEach(() => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { name: 'Pak Direktur', role: 'direksi' },
            isLoading: false,
        });
    });

    it('renders skeletons when loading', () => {
        (useFinancialDashboard as jest.Mock).mockReturnValue({
            metrics: [],
            isLoading: true,
        });

        render(<DireksiDashboard />);
        
        // Check for skeleton elements (animate-pulse)
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders financial metrics when data is loaded', () => {
        const mockMetrics = [
            {
                indicator: { id: 1, label: 'Total Aset', slug: 'total_aset' },
                value: 500000000,
                dtd_pct: 2.5,
                history: [],
                is_ajp: false
            }
        ];

        (useFinancialDashboard as jest.Mock).mockReturnValue({
            metrics: mockMetrics,
            isLoading: false,
        });

        render(<DireksiDashboard />);
        
        expect(screen.getByText(/Total Aset/)).toBeInTheDocument();
        // 500000000 / 1000 = 500000
        expect(screen.getByText(/500.000/)).toBeInTheDocument();
    });
});
