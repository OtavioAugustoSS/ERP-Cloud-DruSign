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

export async function middleware(req: NextRequest) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        return redirectToLogin(req, true);
    }

    const token = req.cookies.get('session')?.value;
    if (!token) return redirectToLogin(req);

    try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        return NextResponse.next();
    } catch {
        return redirectToLogin(req, true);
    }
}
