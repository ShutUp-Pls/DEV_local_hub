import React, { useState } from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES } from "../utils/productConstants";
import { ProductoFormData } from "./ProductForm";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";

interface SimpleProductFormProps {
  formData: ProductoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData | null>>;
  subfamilias: { id: string; nombre: string }[];
  loadingSub: boolean;
}

const SimpleProductForm = ({
  formData,
  handleChange,
  handlePriceChange,
  setFormData,
  subfamilias,
  loadingSub,
}: SimpleProductFormProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    // CAMBIO: Se eliminó 'max-w-2xl' y 'mx-auto' para que ocupe el 100% del ancho como el Avanzado.
    // CAMBIO: space-y-4 a space-y-3 para igualar la densidad del Avanzado.
    <div className="w-full space-y-3 animate-in fade-in duration-300">
      
      {/* SECCIÓN PRINCIPAL: Nombre y Precio */}
      {/* CAMBIO: Se eliminó 'px-1' que causaba que se viera más angosto que el avanzado */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
            Nombre del Producto
          </label>
          <input
            name="txtnombre"
            value={formData.txtnombre}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-zinc-500 transition-colors"
            placeholder="Ej: Coca Cola 3L"
          />
        </div>

        {/* Fila de Precio y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
              Precio Venta
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
                $
              </span>
              <input
                name="txtprecio_venta_boleta"
                value={formData.txtprecio_venta_boleta}
                onChange={handlePriceChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 pl-7 text-sm text-white outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
              Estado del Producto
            </label>
            <select
              name="txtvigente"
              value={formData.txtvigente}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-zinc-500 appearance-none"
            >
              <option value="S">Vigente</option>
              <option value="N">No Vigente</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE OPCIONES AVANZADAS */}
      <div className={`rounded-xl border transition-all duration-300 ${
        isExpanded ? "bg-zinc-900/40 border-zinc-700/50 p-3" : "bg-transparent border-transparent"
      }`}>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-2 rounded-lg transition-all group ${
            isExpanded 
              ? "bg-zinc-800/50 border border-zinc-700 mb-3" 
              : "bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
              {isExpanded ? "Mostrar menos opciones" : "Mostrar más opciones"}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-zinc-400" />
          ) : (
            <ChevronDown size={16} className="text-zinc-400" />
          )}
        </button>

        {/* CONTENIDO DESPLEGABLE */}
        {isExpanded && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            
            <div>
              <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
                Código de Barra
              </label>
              <input
                value={formData.txtcodigo}
                readOnly
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-lg p-2 cursor-not-allowed font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
                  IVA (19%)
                </label>
                <div className="flex gap-2 h-[38px]">
                  {["S", "N"].map((opcion) => (
                    <label
                      key={opcion}
                      className={`flex-1 flex items-center justify-center cursor-pointer border rounded-lg transition-all text-xs ${
                        formData.txtiva === opcion
                          ? "bg-zinc-800 border-zinc-500 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:bg-zinc-900"
                      }`}
                    >
                      <input
                        type="radio"
                        name="txtiva"
                        value={opcion}
                        checked={formData.txtiva === opcion}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {opcion === "S" ? "SÍ" : "NO"}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
                  Impuesto Adicional
                </label>
                <select
                  name="txtid_impuestos1"
                  value={formData.txtid_impuestos1}
                  onChange={handleChange}
                  className="w-full h-[38px] bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-white outline-none focus:border-zinc-500 appearance-none"
                >
                  {IMPUESTOS_ADICIONALES.map((imp) => (
                    <option key={imp.id} value={imp.id}>
                      {imp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
                  Familia
                </label>
                <select
                  name="txtfamilia_producto"
                  value={formData.txtfamilia_producto}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData((prev) =>
                      prev ? { ...prev, txtsubfamilia_producto: "" } : null
                    );
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-500"
                >
                  <option value="0">Seleccione...</option>
                  {FAMILIAS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-normal mb-1 ml-1">
                  Sub Familia
                  {loadingSub && <span className="ml-2 text-zinc-500 animate-pulse">...</span>}
                </label>
                <select
                  name="txtsubfamilia_producto"
                  value={formData.txtsubfamilia_producto}
                  onChange={handleChange}
                  disabled={loadingSub || subfamilias.length === 0}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione...</option>
                  {subfamilias.map((sf) => (
                    <option key={sf.id} value={sf.id}>
                      {sf.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleProductForm;