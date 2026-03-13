import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageError } from '../app/components/ui/PageError';

describe('PageError', () => {
    it('renders the default error title when no props provided', () => {
        render(<PageError />);
        expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    });

    it('shows HTTP 404 badge and not-found title when code=404', () => {
        render(<PageError code={404} />);
        expect(screen.getByText(/HTTP 404/)).toBeInTheDocument();
        expect(screen.getByText('Data Tidak Ditemukan')).toBeInTheDocument();
    });

    it('shows HTTP 401 badge and unauthorized title when code=401', () => {
        render(<PageError code={401} />);
        expect(screen.getByText(/HTTP 401/)).toBeInTheDocument();
        expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });

    it('shows HTTP 403 badge and unauthorized title when code=403', () => {
        render(<PageError code={403} />);
        expect(screen.getByText(/HTTP 403/)).toBeInTheDocument();
        expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });

    it('uses custom title and message when provided', () => {
        render(<PageError title="Custom Title" message="Custom message here" />);
        expect(screen.getByText('Custom Title')).toBeInTheDocument();
        expect(screen.getByText('Custom message here')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
        const onRetry = jest.fn();
        render(<PageError onRetry={onRetry} />);
        fireEvent.click(screen.getByText('Muat Ulang'));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button when onRetry is not provided', () => {
        render(<PageError />);
        expect(screen.queryByText('Muat Ulang')).not.toBeInTheDocument();
    });

    it('does not render HTTP badge when code is not provided', () => {
        render(<PageError />);
        expect(screen.queryByText(/HTTP/)).not.toBeInTheDocument();
    });
});
