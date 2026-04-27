import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export const config = {
    matcher: ['/admin/:path*'],
};

function redirectToLogin(req: NextRequest, clearCookie = false): NextResponse {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    const response = NextResponse.redirect(url);
    if (clearCookie) response.cookies.delete('session');
    return response;
}

const ADMIN_ONLY_PATHS = ['/admin/settings', '/admin/users'];

export async function middleware(req: NextRequest) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        return redirectToLogin(req, true);
    }

    const token = req.cookies.get('session')?.value;
    if (!token) return redirectToLogin(req);

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

        const isAdminOnly = ADMIN_ONLY_PATHS.some(p => req.nextUrl.pathname.startsWith(p));
        if (isAdminOnly && payload.role !== 'admin') {
            const url = req.nextUrl.clone();
            url.pathname = '/admin';
            url.search = '';
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    } catch {
        return redirectToLogin(req, true);
    }
}
