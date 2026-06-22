import { api } from '../../utils/api';

// Mock the global window and sessionStorage
const mockGetAuthToken = jest.fn();
const mockSetAuthToken = jest.fn();

Object.defineProperty(window, '__getAuthToken', {
  value: mockGetAuthToken,
  writable: true,
});

Object.defineProperty(window, '__setAuthToken', {
  value: mockSetAuthToken,
  writable: true,
});

const mockGetItem = jest.spyOn(Storage.prototype, 'getItem');

// Mock global fetch
global.fetch = jest.fn();

describe('API Security Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should retrieve token from memory (__getAuthToken)', async () => {
    mockGetAuthToken.mockReturnValue('memory-token-123');

    await api('/test-endpoint', { showErrorToast: false });

    expect(mockGetAuthToken).toHaveBeenCalled();
    
    // Check that fetch was called with the correct Authorization header
    const fetchCallArgs = (global.fetch as jest.Mock).mock.calls[0];
    const fetchHeaders = fetchCallArgs[1].headers;
    
    expect(fetchHeaders.get('Authorization')).toBe('Bearer memory-token-123');
  });

  it('should NEVER fallback to sessionStorage for auth tokens', async () => {
    mockGetAuthToken.mockReturnValue(null);

    await api('/test-endpoint', { showErrorToast: false });

    // Make sure we didn't try to read 'auth-user' or 'auth-profile' from sessionStorage
    const calls = mockGetItem.mock.calls;
    const authStorageCalls = calls.filter(
      (call) => call[0] === 'auth-user' || call[0] === 'auth-profile'
    );
    
    expect(authStorageCalls.length).toBe(0);
  });
});
