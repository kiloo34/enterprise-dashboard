import { render, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';

const ProtectedRouteMock = () => {
    useEffect(() => {
        const token = sessionStorage.getItem('auth-user');
        if (!token) {
            window.location.href = '/login';
        }
    }, []);

    return <div>Protected Dashboard</div>;
};

describe('Auth State Guard Security Testing', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        // Clear auth sessions
        sessionStorage.clear();

        // Mock window.location properly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).location;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).location = {
            ...originalLocation,
            assign: jest.fn(),
            replace: jest.fn(),
            reload: jest.fn(),
            href: 'http://localhost/dashboard',
        };
    });

    afterEach(() => {
        window.location = originalLocation as unknown as string & Location;
    });

    it('Redirects back to /login when AuthSession is forcibly cleared', async () => {
        render(<ProtectedRouteMock />);

        // If session is empty, expect redirect fired
        await waitFor(() => {
            expect(window.location.href).toBe('/login');
        });
    });
});
