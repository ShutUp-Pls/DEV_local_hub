// app/layout.tsx
'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import "./globals.css";

import Navbar from "./components/Navbar";
import { SearchProvider, useSearch } from "./context/SearchContext";

const PAGES_WITH_NAVBAR = [
  "/verificar-producto",
  "/inicio"
];

function SessionGuard({ children }: { children: React.ReactNode }) {
  // 1. Obtenemos el status además de la data
  const { data: session, status } = useSession(); 
  const router = useRouter();
  const pathname = usePathname();
  const wasLoggedIn = useRef(false);
  
  // 2. Obtenemos isInitialized
  const { useLocalSearch, setUseLocalSearch, isInitialized } = useSearch();

  useEffect(() => {
    if (status === "authenticated") {
      wasLoggedIn.current = true;
    }
    if (wasLoggedIn.current && status === "unauthenticated" && pathname !== "/inicio-sesion") {
      router.push("/inicio-sesion?expired=true");
    }
  }, [status, pathname, router]);

  const showNavbar = PAGES_WITH_NAVBAR.some(route => 
    pathname === route || pathname?.startsWith(`${route}/`)
  );

  return (
    <>
      {showNavbar && (
        <Navbar 
          userName={session?.user?.name}
          useLocalSearch={useLocalSearch}
          setUseLocalSearch={setUseLocalSearch}
          isInitialized={isInitialized}
          isLoadingSession={status === "loading"}
        />
      )}
      <div className={showNavbar ? "pt-0" : ""}>
        {children}
      </div>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider refetchInterval={300}> 
          {/* Envolvemos todo en el SearchProvider para que el estado persista */}
          <SearchProvider>
            <SessionGuard>
              {children}
            </SessionGuard>
          </SearchProvider>
        </SessionProvider>
      </body>
    </html>
  );
}