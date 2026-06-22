import React from 'react';
import { render, screen } from '@testing-library/react';
import OperationSummaryDashboard from '../app/(dashboard)/divisi-operasi/summary/page';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

jest.mock('@/components/AuthContext', () => ({
    useAuth: jest.fn(),
}));
jest.mock('@/hooks/useTranslation', () => ({
    useTranslation: jest.fn(),
}));
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => '/divisi-operasi/summary',
}));

jest.mock('@/components/dashboard/FilterBar', () => ({
    FilterBar: () => <div data-testid="filter-bar" />,
}));
jest.mock('@/components/dashboard/MetricCard', () => ({
    MetricCard: ({ title, value }: { title: string, value: string }) => (
        <div data-testid="metric-card">
            {title}: {value}
        </div>
    ),
}));
jest.mock('@/components/ui/PageHeader', () => ({
    PageHeader: ({ title }: { title: string }) => <h1 data-testid="page-header">{title}</h1>,
}));

// Mock Recharts to avoid issues with ResponsiveContainer in Jest
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => null,
    Cell: () => null,
    Tooltip: () => null,
    Legend: () => null,
}));

describe('DivisiOperasiDashboard Page', () => {
    beforeEach(() => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { name: 'Ops Staff', role: 'divisi-operasi', unitCode: 'DIV_OPS' },
            isLoading: false,
        });

        (useTranslation as jest.Mock).mockReturnValue({
            operations: {
                title: 'Operational Summary',
                metrics: {
                    totalQris: 'Total QRIS',
                    successSettlement: 'Success Settlement',
                    unmatchedSuspect: 'Unmatched Suspect',
                },
                charts: {
                    channelDistribution: 'Channel Distribution',
                }
            },
            footerInfo: 'Footer Info',
            scale: 'Scale'
        });
    });

    it('renders the operational summary page correctly', () => {
        render(<OperationSummaryDashboard />);
        
        expect(screen.getByText(/Operational Summary/)).toBeInTheDocument();
        expect(screen.getByText(/Total QRIS/)).toBeInTheDocument();
        expect(screen.getByText(/920M/)).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
});
