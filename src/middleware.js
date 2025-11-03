import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/contact-support',
  '/auth/register',
  '/contact-support',
  '/api',
  '/favicon.ico',
  '/site.webmanifest',
  '/_next',
  '/assets/nbs-logo.png',
  '/assets/hero-image.jpg',
  '/assets/stands.jpeg'
];

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return decoded;
  } catch (e) {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  const accessToken = request.cookies.get('token')?.value;

  if (isPublic) {
    return NextResponse.next();
  }

  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (accessToken) {
    const decoded = decodeJwt(accessToken);

    if (!decoded || (decoded.exp && Date.now() >= decoded.exp * 1000)) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      
      response.cookies.delete('token');
      
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|auth).*)',
  ],
};