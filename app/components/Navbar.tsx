'use client';

import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface NavbarProps {
  userName?: string | null;
}

type ConnectionStatus = 'loading' | 'connected' | 'failed';

export default function Navbar({ userName }: NavbarProps) {
  const [rjcStatus, setRjcStatus] = useState<ConnectionStatus>('loading');

  const checkConnection = async () => {
    setRjcStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-rjc`);
      const data = await res.json();
      
      if (data.status === 'connected') {
        setRjcStatus('connected');
      } else {
        setRjcStatus('failed');
      }
    } catch (error) {
      console.error("Error contactando API:", error);
      setRjcStatus('failed');
    }
  };

  // Se ejecuta una vez al montar el componente (al iniciar sesión/cargar página)
  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Local<span className="text-blue-500">HUB</span>
        </h1>
        
        <div className="flex items-center gap-6">
          
          {/* INDICADOR DE ESTADO RJC */}
          <div className="flex items-center text-xs font-medium bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            {rjcStatus === 'loading' && (
              <span className="flex items-center text-yellow-500 gap-2">
                <span className="animate-spin h-2 w-2 border-2 border-yellow-500 border-t-transparent rounded-full"></span>
                Conectando RJC...
              </span>
            )}

            {rjcStatus === 'connected' && (
              <span className="flex items-center text-green-500 gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                RJC Conectado
              </span>
            )}

            {rjcStatus === 'failed' && (
              <button 
                onClick={checkConnection}
                className="flex items-center text-red-400 gap-2 hover:text-red-300 hover:underline transition-all cursor-pointer"
                title="Click para reintentar conexión"
              >
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                Fallo conexión (Reintentar ↻)
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>

          <span className="text-sm text-zinc-400 hidden sm:inline">
            {userName || "Usuario"}
          </span>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm px-4 py-2 bg-zinc-800 hover:bg-red-900/30 hover:text-red-400 text-zinc-300 rounded-lg border border-zinc-700 transition-all"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}