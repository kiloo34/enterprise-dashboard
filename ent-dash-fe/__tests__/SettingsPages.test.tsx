import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '../app/(dashboard)/settings/page';
import { useSettings } from '../components/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';

jest.mock('../components/SettingsContext', () => ({
    useSettings: jest.fn(),
}));

jest.mock('../hooks/useTranslation', () => ({
    useTranslation: jest.fn(),
}));

describe('SettingsPage', () => {
    const mockSetTheme = jest.fn();
    const mockSetSize = jest.fn();
    const mockSetLanguage = jest.fn();

    beforeEach(() => {
        (useSettings as jest.Mock).mockReturnValue({
            theme: 'light',
            setTheme: mockSetTheme,
            size: 'comfortable',
            setSize: mockSetSize,
            language: 'ID',
            setLanguage: mockSetLanguage,
        });

        (useTranslation as jest.Mock).mockReturnValue({
            title: 'Settings',
            subtitle: 'Manage your preferences',
            visualTitle: 'Visual Theme',
            visualSubtitle: 'Choose your theme',
            themes: { light: { label: 'Light', desc: 'Light mode' }, dark: { label: 'Dark', desc: 'Dark mode' }, system: { label: 'System', desc: 'System mode' } },
            comfortTitle: 'Comfort',
            comfortSubtitle: 'Choose your size',
            views: { compact: { label: 'Compact', desc: 'Small' }, comfortable: { label: 'Comfortable', desc: 'Medium' }, large: { label: 'Large', desc: 'Big' } },
            langTitle: 'Language',
            langSubtitle: 'Choose your language',
            languages: { ID: 'Indonesian', EN: 'English' },
            footer: 'Footer',
            privacy: 'Privacy',
            agreement: 'Agreement',
        });
    });

    it('renders settings page correctly', () => {
        render(<SettingsPage />);
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Visual Theme')).toBeInTheDocument();
        expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('calls setTheme when a theme option is clicked', () => {
        render(<SettingsPage />);
        const darkThemeButton = screen.getByText('Dark').closest('button');
        if (darkThemeButton) {
            fireEvent.click(darkThemeButton);
            expect(mockSetTheme).toHaveBeenCalledWith('dark');
        }
    });
});
