import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock sonner toast to avoid actual toast rendering
jest.mock('sonner', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
        warning: jest.fn(),
    },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

import { DeleteConfirmationModal } from '../components/ui/DeleteConfirmationModal';

// Mock useTranslation — must match 'Common' namespace used by the modal
jest.mock('../hooks/useTranslation', () => ({
    useTranslation: () => ({
        confirm: 'Konfirmasi Hapus',
        cancel: 'Batal',
        delete: 'Hapus',
        loading: 'Menghapus...',
        noData: 'data ini',
    }),
}));

describe('DeleteConfirmationModal', () => {
    const baseProps = {
        isOpen: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        itemName: 'Role Admin',
        isSubmitting: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when isOpen=true', () => {
        render(<DeleteConfirmationModal {...baseProps} />);
        // The modal uses t.confirm as its default title
        expect(screen.getByText('Konfirmasi Hapus')).toBeInTheDocument();
    });

    it('shows the item name to be deleted', () => {
        render(<DeleteConfirmationModal {...baseProps} />);
        expect(screen.getByText(/Role Admin/i)).toBeInTheDocument();
    });

    it('calls onClose when cancel button is clicked', () => {
        const onClose = jest.fn();
        render(<DeleteConfirmationModal {...baseProps} onClose={onClose} />);
        fireEvent.click(screen.getByText('Batal'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when delete button is clicked', () => {
        const onConfirm = jest.fn();
        render(<DeleteConfirmationModal {...baseProps} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByText('Hapus'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('shows loading text and disables buttons when isSubmitting=true', () => {
        render(<DeleteConfirmationModal {...baseProps} isSubmitting={true} />);
        expect(screen.getByText('Menghapus...')).toBeInTheDocument();
        const cancelBtn = screen.getByText('Batal');
        expect(cancelBtn).toBeDisabled();
    });

    it('does not render when isOpen=false', () => {
        render(<DeleteConfirmationModal {...baseProps} isOpen={false} />);
        expect(screen.queryByText('Hapus Data')).not.toBeInTheDocument();
    });
});
