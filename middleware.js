import { NextResponse } from 'next/server';

const OLD_HOST = 'khujisherpur-site.pages.dev';
const NEW_ORIGIN = 'https://khujisherpur.com';

// সব রেসপন্সে যাবে এমন নিরাপত্তা হেডার
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000',
};

function withSecurity(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();

  if (host === OLD_HOST) {
    const { pathname, search } = request.nextUrl;
    return withSecurity(NextResponse.redirect(`${NEW_ORIGIN}${pathname}${search}`, 301));
  }

  return withSecurity(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon).*)'],
};
