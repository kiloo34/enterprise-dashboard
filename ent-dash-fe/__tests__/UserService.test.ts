import { UserService, UISettings } from '../services/UserService';
import { api } from '../utils/api';

jest.mock('../utils/api');

describe('UserService', () => {
    it('updateSettings calls api with correct parameters', async () => {
        const settings: UISettings = { theme: 'dark', size: 'comfortable', language: 'ID' };
        const mockResponse = { message: 'Success', uiSettings: settings };
        
        (api as jest.Mock).mockResolvedValue(mockResponse);

        const result = await UserService.updateSettings(settings);

        expect(api).toHaveBeenCalledWith('/api/user/settings', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ uiSettings: settings })
        }));
        expect(result).toEqual(mockResponse);
    });
});
