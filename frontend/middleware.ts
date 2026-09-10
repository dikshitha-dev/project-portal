import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    if (token) {
      const payload = decodeJwtPayload(token);
      const isExpired = payload?.exp && (payload.exp as number) * 1000 < Date.now();
      if (isExpired) {
        const response = NextResponse.next();
        response.cookies.delete("token");
        return response;
      }
      const role = payload?.role;
      const redirectPath = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check token expiry
  const payload = decodeJwtPayload(token);
  const isExpired = payload?.exp && (payload.exp as number) * 1000 < Date.now();
  if (isExpired) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
