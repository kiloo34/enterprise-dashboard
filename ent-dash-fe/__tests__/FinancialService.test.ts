import { renderHook } from '@testing-library/react';
import { useFinancialDashboard } from '../services/FinancialService';
import useSWR from 'swr';

jest.mock('swr');

describe('FinancialService', () => {
    it('useFinancialDashboard returns loading state initially', () => {
        (useSWR as jest.Mock).mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: true,
            mutate: jest.fn(),
        });

        const { result } = renderHook(() => useFinancialDashboard());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.metrics).toEqual([]);
    });

    it('useFinancialDashboard returns data correctly', () => {
        const mockData = {
            metrics: [
                {
                    indicator: {
                        id: 1,
                        slug: 'total-revenue',
                        label: 'Total Revenue',
                        category: 'income',
                        level: 1,
                        is_bold: true,
                        is_link: false,
                        is_ratio: false,
                    },
                    report_date: '2024-01-01',
                    value: 1000000,
                    target_nominal: 1100000,
                    history: [900000, 950000, 1000000],
                }
            ]
        };

        (useSWR as jest.Mock).mockReturnValue({
            data: mockData,
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        });

        const { result } = renderHook(() => useFinancialDashboard());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.metrics).toEqual(mockData.metrics);
    });

    it('useFinancialDashboard handles error correctly', () => {
        const mockError = new Error('Failed to fetch');
        (useSWR as jest.Mock).mockReturnValue({
            data: undefined,
            error: mockError,
            isLoading: false,
            mutate: jest.fn(),
        });

        const { result } = renderHook(() => useFinancialDashboard());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(mockError);
    });
});
