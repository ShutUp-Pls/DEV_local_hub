import React, { useEffect, useState, useCallback } from "react";
import AdvancedProductForm from "./AdvancedProductForm";
import CreateProductForm from "./CreateProductForm"; 
import { ProductoFormData } from "./ProductForm";

interface CreateFormProps {
  formData: ProductoFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData | null>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const CreateForm = ({ formData, setFormData, onSave, onCancel, saving }: CreateFormProps) => {
  const [subfamilias, setSubfamilias] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  // Lógica para cargar subfamilias (Idéntica al ProductForm)
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

  // Lógica de precios (Idéntica al ProductForm)
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
      
      {/* --- HEADER CREACIÓN --- */}
      <div className="flex justify-between items-start mb-8 border-b border-zinc-800 pb-6">
        
        {/* Titulo e Identificador Izquierda */}
        <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-white">
                Nuevo Producto
            </h3>
            {/* Código movido aquí como etiqueta */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Código:</span>
                <span className="text-sm font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                    {formData.txtcodigo}
                </span>
            </div>
        </div>

        {/* Switch Modo Avanzado Derecha */}
        <div 
          onClick={() => setIsAdvanced(!isAdvanced)}
          className="flex items-center gap-3 cursor-pointer group select-none mt-1"
        >
          <span className={`text-xs font-medium transition-colors ${isAdvanced ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
            Modo Avanzado
          </span>
          <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isAdvanced ? 'bg-blue-600' : 'bg-zinc-800 border border-zinc-700'}`}>
            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform duration-300 ${
              isAdvanced ? 'translate-x-5 bg-white' : 'translate-x-0 bg-zinc-500'
            }`} />
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
          <CreateProductForm 
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
            Cancelar Creación
        </button>

        <button 
            onClick={onSave}
            disabled={saving || !formData.txtnombre}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all text-sm min-w-[160px] flex justify-center items-center gap-2 ${
                saving || !formData.txtnombre
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                : "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20 hover:scale-105"
            }`}
        >
            {saving ? "Creando..." : "Crear Producto"}
        </button>
      </div>
    </div>
  );
};

export default CreateForm;