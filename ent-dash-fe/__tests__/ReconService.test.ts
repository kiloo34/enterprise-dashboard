import { renderHook } from '@testing-library/react';
import { useReconLogs, useReconStats } from '../services/ReconService';
import useSWR from 'swr';

jest.mock('swr');

describe('ReconService', () => {
  it('useReconLogs returns data correctly', () => {
    const mockLogs = [
      { id: '1', timestamp: '2024-01-01', engineName: 'qris', level: 'INFO', message: 'test' }
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: mockLogs,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useReconLogs({}));

    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.isLoading).toBe(false);
  });

  it('useReconStats returns data correctly', () => {
    const mockStats = {
      totalLogs: 100,
      errorTrend: 5,
      warningCount: 2,
      mostActiveEngine: 'qris',
      mostActivePercent: 40,
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockStats,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    });

    const { result } = renderHook(() => useReconStats());

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.isLoading).toBe(false);
  });
});
