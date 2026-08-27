import { NextResponse } from "next/server";

export function middleware(request) {
  // Authentication route protection will be implemented here.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/rooms/:path*",
    "/tenants/:path*",
    "/payments/:path*",
    "/pg-profile/:path*",
    "/settings/:path*"
  ]
};
