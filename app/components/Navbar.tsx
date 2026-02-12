'use client';

import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { RjcIndicator, SearchSwitch, ConnectionStatus } from "./NavbarComponents";
import NavbarMenu from "./NavbarMenu";

interface NavbarProps {
  userName?: string | null;
  useLocalSearch: boolean;
  setUseLocalSearch: (value: boolean) => void;
}

export default function Navbar({ userName, useLocalSearch, setUseLocalSearch }: NavbarProps) {
  const [rjcStatus, setRjcStatus] = useState<ConnectionStatus>('validating');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = async (isManualRetry = false) => {
    if (isManualRetry) {
      setRjcStatus('loading');
    } else {
      setRjcStatus('validating');
      timerRef.current = setTimeout(() => {
        setRjcStatus('loading');
      }, 500);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-rjc`);
      if (timerRef.current) clearTimeout(timerRef.current);
      const data = await res.json();
      
      if (data.status === 'connected') {
        setRjcStatus('connected');
      } else {
        setRjcStatus('failed');
      }
    } catch (error) {
      if (timerRef.current) clearTimeout(timerRef.current);
      console.error("Error contactando API:", error);
      setRjcStatus('failed');
    }
  };

  useEffect(() => {
    checkConnection();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* --- TÍTULO --- */}
        <a 
          href={process.env.NEXT_PUBLIC_PRINCIPAL_URL || '#'}
          className="hover:opacity-80 transition-opacity cursor-pointer z-20"
        >
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Local<span className="text-blue-500">HUB</span>
          </h1>
        </a>
        
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* 1. Feedback (Se oculta en 'sm') */}
          <div className="hidden sm:block">
            <RjcIndicator status={rjcStatus} onRetry={() => checkConnection(true)} />
          </div>

          {/* 2. Switch (Se oculta en 'md') */}
          <div className="hidden md:block">
            <SearchSwitch useLocalSearch={useLocalSearch} setUseLocalSearch={setUseLocalSearch} />
          </div>

          {/* === BLOQUE DE USUARIO Y SALIR (Contracción unificada en LG) === */}
          
          {/* Separador: Ahora se oculta junto con el bloque en 'lg' */}
          <div className="h-6 w-px bg-zinc-800 hidden lg:block"></div>

          {/* 3. Usuario: Texto simple */}
          <span className="text-sm text-zinc-400 hidden lg:inline">
            {userName || "Usuario"}
          </span>

          {/* 4. Botón Salir: Estilo actualizado (igual al menú móvil) */}
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="hidden lg:block text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800/50 px-3 py-2 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>

          {/* --- MENÚ RESPONSIVE --- */}
          {/* Aparece cuando el bloque Usuario/Salir se oculta (< LG) */}
          <NavbarMenu 
            userName={userName}
            useLocalSearch={useLocalSearch}
            setUseLocalSearch={setUseLocalSearch}
            rjcStatus={rjcStatus}
            onRetryConnection={() => checkConnection(true)}
            onSignOut={() => signOut({ callbackUrl: '/' })}
          />

        </div>
      </div>
    </nav>
  );
}