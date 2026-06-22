import { getRedirectPath, UserInfoSubset } from '../components/AuthContext';

describe('AuthContext Utility - getRedirectPath', () => {
    it('redirects to /login if user is null', () => {
        expect(getRedirectPath(null)).toBe('/login');
    });

    it('redirects to /admin/dashboard for super-admin role', () => {
        const user: UserInfoSubset = { role: 'super-admin', unitCode: 'ANY' };
        expect(getRedirectPath(user)).toBe('/admin/dashboard');
    });

    it('redirects to /admin/dashboard for admin role', () => {
        const user: UserInfoSubset = { role: 'admin', unitCode: 'ANY' };
        expect(getRedirectPath(user)).toBe('/admin/dashboard');
    });

    it('redirects to /direksi/kinerja-keuangan for DIR_UTAMA unit', () => {
        const user: UserInfoSubset = { role: 'direksi', unitCode: 'DIR_UTAMA' };
        expect(getRedirectPath(user)).toBe('/direksi/kinerja-keuangan');
    });

    it('redirects to /divisi-operasi/summary for DIV_OPS unit', () => {
        const user: UserInfoSubset = { role: 'divisi-operasi', unitCode: 'DIV_OPS' };
        expect(getRedirectPath(user)).toBe('/divisi-operasi/summary');
    });

    it('falls back to /direksi/kinerja-keuangan for unknown unit', () => {
        const user: UserInfoSubset = { role: 'member', unitCode: 'UNKNOWN' };
        expect(getRedirectPath(user)).toBe('/direksi/kinerja-keuangan');
    });
});
