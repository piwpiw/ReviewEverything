import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Protect /admin and /api/admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const isAdminPage = pathname.startsWith('/admin')
        const authHeader = request.headers.get('authorization')
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Bypass check in local dev
        if (!adminPassword && process.env.NODE_ENV !== 'production') {
            return NextResponse.next()
        }

        if (!adminPassword) {
            if (isAdminPage) {
                return NextResponse.next();
            }

            return NextResponse.json(
                {
                    error:
                        'ADMIN_PASSWORD is not configured. Set ADMIN_PASSWORD in Render Environment Variables.',
                },
                { status: 503 },
            );
        }

        if (isAdminPage) {
            return NextResponse.next();
        }

        const malformedAuthHeader = !authHeader || !authHeader.startsWith('Basic ');
        if (malformedAuthHeader) {
            return new NextResponse('Authentication Required', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            })
        }

        const encoded = authHeader.split(' ')[1]
        const decoded = Buffer.from(encoded, 'base64').toString()
        const separatorIndex = decoded.indexOf(':')
        if (separatorIndex < 0) {
            return new NextResponse('Invalid Credentials', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            })
        }

        const user = decoded.substring(0, separatorIndex)
        const password = decoded.substring(separatorIndex + 1)

        if (user !== 'admin' || password !== adminPassword) {
            return new NextResponse('Invalid Credentials', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
}
