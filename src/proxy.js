import { NextResponse } from 'next/server';

// Protected routes that require login
const PROTECTED_PATHS = ['/', '/attendance', '/leave'];

export default function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('hrms_session');

  console.log(`[Proxy] Request to: ${pathname}, Session: ${session ? 'Found' : 'Missing'}`);

  const isProtected = PROTECTED_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );

  if (isProtected && !session) {
    console.log(`[Proxy] Redirecting to /login from ${pathname}`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && session) {
    console.log(`[Proxy] Redirecting from /login to / because session exists`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
