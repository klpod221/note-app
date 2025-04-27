import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Nếu không có token => redirect
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Nếu cần kiểm tra role (ví dụ chỉ admin)
  if (req.nextUrl.pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Ngoại trừ /, /login và /register thì tất cả các đường dẫn khác đều cần middleware
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|register|api/heath|api/register|api/auth).*)"
  ],
};
