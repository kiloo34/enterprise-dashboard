import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../components/dashboard/MetricCard';

// Mock the useTranslation hook to avoid locale file loading
jest.mock('../hooks/useTranslation', () => ({
    useTranslation: () => ({ safe: 'Aman' }),
}));

describe('MetricCard', () => {
    const baseProps = {
        title: 'Total Nasabah',
        value: '1.234',
        accentColor: 'blue' as const,
    };

    it('renders title and value', () => {
        render(<MetricCard {...baseProps} />);
        expect(screen.getByText('Total Nasabah')).toBeInTheDocument();
        expect(screen.getByText('1.234')).toBeInTheDocument();
    });

    it('renders positive trend with + prefix and up arrow', () => {
        render(<MetricCard {...baseProps} trend={5.2} />);
        expect(screen.getByText(/\+5.2%/)).toBeInTheDocument();
    });

    it('renders negative trend without + prefix', () => {
        render(<MetricCard {...baseProps} trend={-3.1} />);
        expect(screen.getByText(/-3.1%/)).toBeInTheDocument();
    });

    it('does not render trend when trend is undefined', () => {
        const { queryByText } = render(<MetricCard {...baseProps} />);
        expect(queryByText(/%/)).not.toBeInTheDocument();
    });

    it('shows safe badge when isSafe=true', () => {
        render(<MetricCard {...baseProps} isSafe={true} />);
        expect(screen.getByText('Aman')).toBeInTheDocument();
    });

    it('does not show safe badge when isSafe=false', () => {
        const { queryByText } = render(<MetricCard {...baseProps} isSafe={false} />);
        expect(queryByText('Aman')).not.toBeInTheDocument();
    });

    it('renders accent bar at bottom', () => {
        const { container } = render(<MetricCard {...baseProps} accentColor="green" />);
        const accentBar = container.querySelector('.absolute.bottom-0.left-0.right-0.h-1');
        expect(accentBar).toBeInTheDocument();
        expect(accentBar).toHaveClass('bg-green-500');
    });

    it('uses semantic CSS variable for title color', () => {
        render(<MetricCard {...baseProps} />);
        const titleEl = screen.getByText('Total Nasabah');
        expect(titleEl.style.color).toBe('var(--text-muted)');
    });

    it('uses semantic CSS variable for value color', () => {
        render(<MetricCard {...baseProps} />);
        const valueEl = screen.getByText('1.234');
        expect(valueEl.style.color).toBe('var(--text-primary)');
    });
});
