import React from 'react';

// Tipos necesarios
export type ConnectionStatus = 'loading' | 'connected' | 'failed' | 'validating';

interface RjcIndicatorProps {
  status: ConnectionStatus;
  onRetry: () => void;
}

interface SearchSwitchProps {
  useLocalSearch: boolean;
  setUseLocalSearch: (val: boolean) => void;
  fullWidth?: boolean;
  reverse?: boolean; // Prop para invertir orden
}

// 2.2 Componente Feedback RJC
export const RjcIndicator = ({ status, onRetry }: RjcIndicatorProps) => {
  return (
    <div className="flex items-center text-xs font-medium bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800 w-fit">
      {status === 'loading' && (
        <span className="flex items-center text-yellow-500 gap-2">
          <span className="animate-spin h-2 w-2 border-2 border-yellow-500 border-t-transparent rounded-full"></span>
          Conectando...
        </span>
      )}

      {(status === 'connected' || status === 'validating') && (
        <span className="flex items-center text-green-500 gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          RJC Conectado
        </span>
      )}

      {status === 'failed' && (
        <button 
          onClick={onRetry}
          className="flex items-center text-red-400 gap-2 hover:text-red-300 hover:underline transition-all cursor-pointer"
          title="Reintentar conexión"
        >
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          Error (Reintentar ↻)
        </button>
      )}
    </div>
  );
};

// 2.3 Componente Switch
export const SearchSwitch = ({ useLocalSearch, setUseLocalSearch, fullWidth = false, reverse = false }: SearchSwitchProps) => (
  <div 
    // LÓGICA DE ALINEACIÓN:
    // fullWidth: Ocupa todo el ancho.
    // reverse: Invierte el orden (flex-row-reverse).
    //    -> Normal: [Texto] ... [Toggle]
    //    -> Reverse: [Toggle] ... [Texto] (El texto queda a la derecha)
    className={`flex items-center gap-3 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors 
      ${fullWidth ? 'w-full justify-between' : 'w-fit'} 
      ${reverse ? 'flex-row-reverse' : ''}`
    }
    onClick={() => setUseLocalSearch(!useLocalSearch)}
  >
    {/* Texto: Si hay reverse, este elemento (1º en DOM) se va visualmente al final (Derecha) */}
    <span className={`text-xs font-semibold select-none ${useLocalSearch ? 'text-blue-400' : 'text-zinc-400'}`}>
      {useLocalSearch ? 'Búsqueda Local' : 'Búsqueda Web'}
    </span>
    
    {/* Toggle: Si hay reverse, este elemento (2º en DOM) se va visualmente al inicio (Izquierda) */}
    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        useLocalSearch ? 'bg-blue-600' : 'bg-zinc-600'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          useLocalSearch ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </div>
  </div>
);