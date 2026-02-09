import React from "react";

interface SearchBarProps {
  barcode: string;
  setBarcode: (value: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  onOpenScanner: () => void;
  loading: boolean;
}

const SearchBar = ({ barcode, setBarcode, onSearch, onOpenScanner, loading }: SearchBarProps) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-8 flex gap-4">
      <div className="flex-1 relative flex items-center">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Escanear código..."
          className="w-full bg-zinc-950 border border-zinc-700 p-3 pr-12 rounded-xl text-white outline-none focus:border-blue-500"
          onKeyDown={(e) => e.key === "Enter" && onSearch(e)}
        />
        {/* Botón de la cámara dentro del input */}
        <button
          onClick={onOpenScanner}
          className="absolute right-2 text-zinc-400 hover:text-white p-2 transition-colors"
          title="Abrir cámara"
        >
          📷
        </button>
      </div>

      <button
        onClick={() => onSearch()}
        disabled={loading}
        className="bg-blue-600 px-6 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
    </div>
  );
};

export default SearchBar;