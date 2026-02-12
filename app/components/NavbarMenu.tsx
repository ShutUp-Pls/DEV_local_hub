'use client';
import { useState } from "react";
import { RjcIndicator, SearchSwitch, ConnectionStatus } from "./NavbarComponents";

interface NavbarMenuProps {
  userName?: string | null;
  useLocalSearch: boolean;
  setUseLocalSearch: (value: boolean) => void;
  rjcStatus: ConnectionStatus;
  onRetryConnection: () => void;
  onSignOut: () => void;
}

export default function NavbarMenu({
  userName,
  useLocalSearch,
  setUseLocalSearch,
  rjcStatus,
  onRetryConnection,
  onSignOut
}: NavbarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 flex flex-col gap-4 z-50 w-72 sm:w-56">
          {/* EXPLICACIÓN DEL ANCHO (w-72 sm:w-56):
             1. w-72 (Móvil < sm): Necesitamos ancho para que 'Usuario' y 'RJC' quepan en la misma fila (2 columnas visuales).
             2. sm:w-56 (Tablet/Desktop >= sm): El RJC se va, así que estrechamos el menú para que se vea compacto (1 columna).
          */}
          
          {/* 1. CABECERA: Usuario + Estado API */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
             
             {/* Usuario (Visible si < LG) */}
             <div className="block lg:hidden flex-1 text-right pr-4">
                <p className="text-sm text-zinc-400">Hola, <span className="text-white font-medium">{userName || "Usuario"}</span></p>
             </div>

             {/* Estado API (Visible si < SM) - Aquí es donde requerimos el ancho de w-72 */}
             <div className="sm:hidden block">
                <RjcIndicator status={rjcStatus} onRetry={onRetryConnection} />
             </div>
          </div>

          {/* 2. MEDIO: Switch de Búsqueda (Visible si < MD) */}
          <div className="flex md:hidden flex-col gap-2 pb-3 pr-2 pl-4 border-b border-zinc-800">
            <div className="flex justify-start w-full">
               <SearchSwitch 
                 useLocalSearch={useLocalSearch} 
                 setUseLocalSearch={setUseLocalSearch} 
                 fullWidth={true} 
               />
            </div>
          </div>

          {/* 3. FINAL: Botón Salir (Visible si < LG) */}
          <div className="block lg:hidden mt-auto">
             <button 
                onClick={onSignOut}
                className="w-full text-right text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800/50 px-3 py-2 rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
          </div>

        </div>
      )}
    </div>
  );
}