import { renderHook } from '@testing-library/react';
import { useAdminStats } from '../services/AdminService';
import useSWR from 'swr';

jest.mock('swr');

describe('AdminService', () => {
  it('useAdminStats returns loading state initially', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useAdminStats());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toBeUndefined();
  });

  it('useAdminStats returns data correctly', () => {
    const mockData = {
      users: { total: 100, recent_30_days: 10, recent_list: [] },
      organization: { total_units: 5 },
      imports: { total: 50, completed: 45, pending: 2, failed: 3, recent_list: [] },
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useAdminStats());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stats).toEqual(mockData);
  });

  it('useAdminStats handles error', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: new Error('Failed to fetch'),
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useAdminStats());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
  });
});
