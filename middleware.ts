import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Passthrough — ensures middleware-manifest is emitted consistently in dev and prod. */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon\\.svg).*)'],
};
