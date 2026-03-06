import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const missingAdminPasswordHtml = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Page Access Blocked</title>
    <style>
      body { margin: 0; background: #020617; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .wrap { max-width: 840px; margin: 8vh auto; padding: 24px; border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 16px; background: rgba(15, 23, 42, 0.85); }
      ul { padding-left: 18px; line-height: 1.7; }
      h1 { margin: 0 0 8px; }
      code { background: #0f172a; padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(148, 163, 184, 0.3); }
      p { line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>관리자 API 접근 차단</h1>
      <p><strong>배포 환경 변수</strong>에 ADMIN_PASSWORD가 없어 관리자 API가 차단되어 있습니다.</p>
      <ul>
        <li>ADMIN_PASSWORD</li>
        <li>DATABASE_URL / DIRECT_URL</li>
        <li>CRON_SECRET</li>
        <li>NEXT_PUBLIC_KAKAO_JS_KEY or NEXT_PUBLIC_NAVER_CLIENT_ID</li>
      </ul>
      <p>다음 값이 배포 환경 변수에 설정되어 있으면 관리자 기능이 즉시 사용 가능합니다.</p>
    </div>
  </body>
</html>`;
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Protect /admin and /api/admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const isAdminPage = pathname.startsWith('/admin')
        const authHeader = request.headers.get('authorization')
        const adminPassword = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET;

        // Bypass check in local dev
        if (!adminPassword && process.env.NODE_ENV !== 'production') {
            return NextResponse.next()
        }

        if (!adminPassword) {
            if (isAdminPage) {
                return new NextResponse(missingAdminPasswordHtml, {
                    status: 503,
                    headers: {
                        'content-type': 'text/html; charset=utf-8',
                    },
                })
            }

            return NextResponse.json(
                {
                    error:
                        'ADMIN_PASSWORD(CRON_SECRET 대체값)가 설정되어 있지 않습니다. 배포 환경 변수에 관리자 인증값을 등록하세요.',
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


