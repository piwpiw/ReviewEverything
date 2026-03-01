import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Protect /admin and /api/admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const authHeader = request.headers.get('authorization')
        const adminPassword = process.env.ADMIN_PASSWORD

        // Bypass check in local dev
        if (!adminPassword && process.env.NODE_ENV !== 'production') {
            return NextResponse.next()
        }

        if (!adminPassword) {
            return new NextResponse('Server Misconfigured: ADMIN_PASSWORD is required', {
                status: 500,
                headers: {},
            })
        }

        if (!authHeader) {
            return new NextResponse('Authentication Required', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            })
        }

        const auth = authHeader.split(' ')[1]
        const [user, password] = Buffer.from(auth, 'base64').toString().split(':')

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
