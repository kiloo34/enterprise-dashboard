import { AuthService } from '../services/AuthService';
import { api } from '../utils/api';

jest.mock('../utils/api');

describe('AuthService', () => {
    it('login calls api and returns normalized response', async () => {
        const mockRawResponse = {
            access_token: 'valid-token',
            token_type: 'Bearer',
            expires_in: 3600,
            user: {
                name: 'Test Admin',
                email: 'admin@example.com',
                role: 'admin',
                permissions: ['manage-users'],
                unitCode: 'HQ',
                positionName: 'Manager',
                positionLevel: 1
            }
        };

        (api as jest.Mock).mockResolvedValue(mockRawResponse);

        const response = await AuthService.login('admin@example.com', 'password');

        expect(api).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
        }));

        expect(response).toEqual({
            accessToken: 'valid-token',
            tokenType: 'Bearer',
            user: mockRawResponse.user
        });
    });

    it('logout calls backend logout endpoint', async () => {
        (api as jest.Mock).mockResolvedValue({});
        await AuthService.logout();
        expect(api).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
    });
});
