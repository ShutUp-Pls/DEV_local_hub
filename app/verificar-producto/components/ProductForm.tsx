import React, { useEffect, useState, useCallback } from "react";
import AdvancedProductForm from "./AdvancedProductForm";
import SimpleProductForm from "./SimpleProductForm";

// Exportamos la interfaz para que los hijos puedan usarla
export interface ProductoFormData {
  txtcodigo: string;
  txtcod_interno: string;
  txtnombre: string;
  txtfamilia_producto: string;
  txtsubfamilia_producto: string;
  txtunidad: string;
  txtiva: string;
  txtid_impuestos1: string;
  txtprecio_venta: string;
  txtprecio_venta_boleta: string;
  txtstock_critico: string;
  txtdias_reposion: string;
  txtvigente: string;
  txtfactor_compra: string; 
  txtid_producto: string;
  txtfecha_creacion: string;
  txtporcentaje_iva: string;
}

interface ProductFormProps {
  formData: ProductoFormData;
  originalData: ProductoFormData | null;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData | null>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const ProductForm = ({ formData, originalData, setFormData, onSave, onCancel, saving }: ProductFormProps) => {
  const [subfamilias, setSubfamilias] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const areEqual = (obj1: ProductoFormData, obj2: ProductoFormData | null) => {
    if (!obj2) return false;

    const keys = Object.keys(obj1) as Array<keyof ProductoFormData>;
    
    return keys.every(key => {
        const val1 = (obj1[key] ?? "").toString().trim();
        const val2 = (obj2[key] ?? "").toString().trim();
        
        if (val1 === val2) return true;

        const numericFields = ['txtprecio_venta', 'txtprecio_venta_boleta', 'txtstock_critico', 'txtdias_reposion'];
        
        if (numericFields.includes(key)) {
            const num1 = parseFloat(val1.replace(',', '.'));
            const num2 = parseFloat(val2.replace(',', '.'));

            if (!isNaN(num1) && !isNaN(num2)) {
                const esIgual = Math.abs(num1 - num2) < 0.5; 
                return esIgual;
            }
        }
        return false;
    });
  };

  const hasChanges = !areEqual(formData, originalData);

  const fetchSubfamilias = useCallback(async (familiaId: string) => {
    setLoadingSub(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/obtener-subfamilias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familia_id: familiaId }),
      });
      const data = await res.json();
      if (data.subfamilias) {
        setSubfamilias(data.subfamilias);
      }
    } catch (error) {
      console.error("Error cargando subfamilias", error);
    } finally {
      setLoadingSub(false);
    }
  }, []);

  useEffect(() => {
    if (formData.txtfamilia_producto) {
      fetchSubfamilias(formData.txtfamilia_producto);
    }
  }, [formData.txtfamilia_producto, fetchSubfamilias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const roundToTwo = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      if (!prev) return null;
      
      const newState = { ...prev, [name]: value };
      const ivaPct = parseFloat(newState.txtporcentaje_iva) || 19;
      const factor = (ivaPct / 100) + 1;
      const isAfecto = newState.txtiva === 'S';

      const valNumerico = parseFloat(value.replace(',', '.')) || 0;

      if (name === 'txtprecio_venta') {
          if (isAfecto) {
              const bruto = valNumerico * factor;
              newState.txtprecio_venta_boleta = roundToTwo(bruto).toString();
          } else {
              newState.txtprecio_venta_boleta = value;
          }
      }

      if (name === 'txtprecio_venta_boleta') {
          if (isAfecto) {
              const neto = valNumerico / factor;
              newState.txtprecio_venta = roundToTwo(neto).toString();
          } else {
              newState.txtprecio_venta = value;
          }
      }

      return newState;
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2">
      
      {/* --- HEADER REDISEÑADO --- */}
      <div className="space-y-4 mb-8 border-b border-zinc-800 pb-6">
        
        {/* Fila 1: Título e ID */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Modificar Producto</h3>
          <span className="text-zinc-500 text-xs font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            ID: {formData.txtid_producto}
          </span>
        </div>

        {/* Fila 2: Vigencia y Switch Modo */}
        <div className="flex justify-between items-center">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
            formData.txtvigente === 'S' 
              ? 'bg-green-900/20 text-green-500 border border-green-900/50' 
              : 'bg-red-900/20 text-red-500 border border-red-900/50'
          }`}>
            {formData.txtvigente === 'S' ? '● VIGENTE' : '○ NO VIGENTE'}
          </div>

          <div 
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="flex items-center gap-3 cursor-pointer group"
            >
            <span className={`text-xs font-medium transition-colors ${isAdvanced ? 'text-blue-400' : 'text-zinc-500'}`}>
                Modo Avanzado
            </span>
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isAdvanced ? 'bg-blue-600' : 'bg-zinc-800 border border-zinc-700'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform duration-300 ${
                isAdvanced ? 'translate-x-5 bg-white' : 'translate-x-0 bg-zinc-500'
                }`} />
                </div>
            </div>
        </div>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      <div className="min-h-[300px]">
        {isAdvanced ? (
          <AdvancedProductForm 
              formData={formData}
              handleChange={handleChange}
              handlePriceChange={handlePriceChange}
              setFormData={setFormData}
              subfamilias={subfamilias}
              loadingSub={loadingSub}
          />
        ) : (
          <SimpleProductForm 
              formData={formData}
              handleChange={handleChange}
              handlePriceChange={handlePriceChange}
              setFormData={setFormData}
              subfamilias={subfamilias}
              loadingSub={loadingSub}
          />
        )}
      </div>

        {/* --- FOOTER: ACCIONES --- */}
        <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-end gap-3">
            <button 
                onClick={onCancel}
                className="text-sm px-6 py-3 bg-zinc-800 hover:bg-red-900/30 hover:text-red-400 text-zinc-300 rounded-xl border border-zinc-700 transition-all font-bold"
            >
                Cancelar
            </button>

            <button 
                onClick={onSave}
                disabled={saving || !hasChanges}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all text-sm min-w-[160px] ${
                    !hasChanges || saving
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                    : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                }`}
            >
                {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
        </div>
    </div>
  );
};

export default ProductForm;