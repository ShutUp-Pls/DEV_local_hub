// app/layout.tsx
'use client';
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider refetchInterval={5}> 
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}