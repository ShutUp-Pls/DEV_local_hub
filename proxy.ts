import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const estaAutenticado = !!token?.username;

    // --- MANEJO DE LA RAÍZ "/" ---
    if (pathname === "/") {
      if (estaAutenticado) {
        return NextResponse.redirect(new URL("/inicio", req.url));
      } else {
        // Redirección limpia. Sin alertas.
        return NextResponse.redirect(new URL("/inicio-sesion", req.url));
      }
    }

    // --- PROTECCIÓN DE RUTAS ---
    const esRutaPublica = pathname === "/inicio-sesion";

    if (!esRutaPublica && !estaAutenticado) {
        // AQUÍ ESTÁ EL CAMBIO CLAVE:
        // No preguntamos nada. Si no tienes acceso, te vas al login LIMPIO.
        // Eliminamos cualquier lógica de ?expired=true aquí.
        return NextResponse.redirect(new URL("/inicio-sesion", req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true, 
    },
    pages: {
      signIn: "/inicio-sesion", 
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/inicio/:path*",
    "/verificar-producto/:path*",
    "/inicio-sesion"
  ],
};