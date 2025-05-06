import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (req.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  const publicPaths = [
    "/login",
    "/register",
    "/api/readme",
    "/api/auth",
    "/api/register",
    "/api/heath",
  ];

  if (
    !token &&
    !publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Nếu có token nhưng truy cập vào trang đăng nhập hoặc đăng ký => redirect về trang chính
  if (
    (req.nextUrl.pathname === "/login" ||
      req.nextUrl.pathname === "/register") &&
    token
  ) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Nếu cần kiểm tra role (ví dụ chỉ admin)
  if (req.nextUrl.pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico).*)"],
};
