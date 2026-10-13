import { NextResponse } from 'next/server';

const OLD_HOST = 'khujisherpur-site.pages.dev';
const NEW_ORIGIN = 'https://khujisherpur.com';

export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();

  if (host === OLD_HOST) {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`${NEW_ORIGIN}${pathname}${search}`, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon).*)'],
};
