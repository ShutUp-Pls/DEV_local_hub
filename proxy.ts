// middleware.ts (antes proxy.ts)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname === "/") {
      if (token) {
        return NextResponse.redirect(new URL("/inicio", req.url));
      } else {
        return NextResponse.redirect(new URL("/inicio-sesion", req.url));
      }
    }
  },
  {
    pages: {
      signIn: "/inicio-sesion", 
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/inicio/:path*",
    "/verificar-producto/:path*"
  ],
};