import React from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES } from "../utils/productConstants";
import { ProductoFormData } from "./ProductForm";
import { Settings2 } from "lucide-react"; 
import s from "./ProductForm.module.css";

interface FullProductFormProps {
  formData: ProductoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData | null>>;
  subfamilias: { id: string; nombre: string }[];
  loadingSub: boolean;
}

const FullProductForm = ({
  formData,
  handleChange,
  handlePriceChange,
  setFormData,
  subfamilias,
  loadingSub,
}: FullProductFormProps) => {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      
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

        {/* PRECIO FINAL */}
        <div>
          <label className={s.label}>Precio Final (Bruto)</label>
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

      <hr className="border-zinc-800" />

      {/* SECCIÓN DE OPCIONES (SIEMPRE VISIBLES) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 size={14} className="text-blue-400" />
          <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
            Configuración y Categorías
          </span>
        </div>

        <div className={`${s.sectionBox} space-y-4`}>
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
      </div>
    </div>
  );
};

export default FullProductForm;