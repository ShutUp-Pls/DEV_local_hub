// app/layout.tsx
'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import "./globals.css";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Usamos una referencia para rastrear si ESTABA logueado en esta sesión de carga.
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      wasLoggedIn.current = true;
    }

    // LA LÓGICA ESTRICTA:
    // Solo redirigimos con "expired=true" SI Y SOLO SI:
    // 1. El usuario ya estaba autenticado (wasLoggedIn.current = true)
    // 2. El sistema detectó que la sesión murió (status === "unauthenticated")
    // 3. No estamos ya en el login (pathname !== "/inicio-sesion")
    
    if (wasLoggedIn.current && status === "unauthenticated" && pathname !== "/inicio-sesion") {
      // Este es el ÚNICO lugar de toda la app que genera el mensaje de expiración.
      router.push("/inicio-sesion?expired=true");
    }
    
  }, [status, pathname, router]);

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* El refetchInterval es vital. Comprueba la sesión cada 5 segundos */}
        <SessionProvider refetchInterval={300}> 
          <SessionGuard>
            {children}
          </SessionGuard>
        </SessionProvider>
      </body>
    </html>
  );
}