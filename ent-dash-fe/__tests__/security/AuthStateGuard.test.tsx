import { render, waitFor, screen } from '@testing-library/react';
import React, { useEffect, useState } from 'react';

// Simulate a guard that checks auth and shows redirect state
const ProtectedRouteMock = () => {
    const [redirected, setRedirected] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem('auth-user');
        if (!token) {
            setRedirected(true);
        }
    }, []);

    if (redirected) return <div data-testid="redirect-target">Redirecting to login</div>;
    return <div>Protected Dashboard</div>;
};

describe('Auth State Guard Security Testing', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('Redirects back to /login when AuthSession is forcibly cleared', async () => {
        render(<ProtectedRouteMock />);

        // If session is empty, expect redirect state triggered
        await waitFor(() => {
            expect(screen.getByTestId('redirect-target')).toBeInTheDocument();
        });
    });

    it('Shows protected content when session exists', async () => {
        sessionStorage.setItem('auth-user', JSON.stringify({ token: 'valid' }));
        render(<ProtectedRouteMock />);

        await waitFor(() => {
            expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();
        });
    });
});
