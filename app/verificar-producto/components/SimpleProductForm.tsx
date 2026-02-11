import React, { useState } from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES } from "../utils/productConstants";
import { ProductoFormData } from "./ProductForm";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react"; // Eliminado DollarSign sin uso
import s from "./ProductForm.module.css";

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
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      
      {/* SECCIÓN PRINCIPAL */}
      <div className="space-y-4">
        <div>
          <label className={s.label}>Nombre del Producto</label>
          <input
            name="txtnombre"
            value={formData.txtnombre}
            onChange={handleChange}
            className={s.input}
            placeholder="Ej: Coca Cola 3L"
          />
        </div>

        {/* PRECIO FINAL (Ahora ocupa todo el ancho) */}
        <div>
          <label className={s.label}>Precio Final (Bruto)</label>
          {/* CONTENEDOR CON SIGNO $ */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-zinc-400 pointer-events-none text-sm">
              $
            </span>
            <input
              name="txtprecio_venta_boleta"
              value={formData.txtprecio_venta_boleta}
              onChange={handlePriceChange}
              className={`${s.inputMoney}`}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* OPCIONES AVANZADAS */}
      <div className="pt-2"> 
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 rounded-lg transition-all border bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800"
        >
          <div className="flex items-center gap-2">
            <Settings2 size={14} className={isExpanded ? "text-blue-400" : "text-zinc-400"} />
            <span className="text-xs font-medium text-zinc-300">
              {isExpanded ? "Ocultar opciones" : "Mostrar opciones"}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>

        {isExpanded && (
          <div className={`${s.sectionBox} mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200`}>
            
            {/* FAMILIA Y SUB FAMILIA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={s.label}>Familia</label>
                <select
                  name="txtfamilia_producto"
                  value={formData.txtfamilia_producto}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData((prev) => prev ? { ...prev, txtsubfamilia_producto: "" } : null);
                  }}
                  className={s.select}
                >
                  <option value="0">Seleccione...</option>
                  {FAMILIAS.map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={s.label}>
                  Sub Familia {loadingSub && <span className={s.loadingText}>...</span>}
                </label>
                <select
                  name="txtsubfamilia_producto"
                  value={formData.txtsubfamilia_producto}
                  onChange={handleChange}
                  disabled={loadingSub || subfamilias.length === 0}
                  className={s.select}
                >
                  <option value="">Seleccione...</option>
                  {subfamilias.map((sf) => (
                    <option key={sf.id} value={sf.id}>{sf.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* IVA E IMPUESTO ADICIONAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={s.label}>¿Afecto a IVA?</label>
                <div className="flex gap-2 h-[38px]">
                  {["S", "N"].map((opcion) => (
                    <label
                      key={opcion}
                      className={`${s.toggleOption} ${
                        formData.txtiva === opcion ? s.toggleActive : s.toggleInactive
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
                <label className={s.label}>Impuesto Adicional (ILA)</label>
                <select
                  name="txtid_impuestos1"
                  value={formData.txtid_impuestos1}
                  onChange={handleChange}
                  className={s.select}
                >
                  {IMPUESTOS_ADICIONALES.map((imp) => (
                    <option key={imp.id} value={imp.id}>{imp.nombre}</option>
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