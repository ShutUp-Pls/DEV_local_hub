import React from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES } from "../utils/productConstants";
import { ProductoFormData } from "./ProductForm";

interface CreateProductFormProps {
  formData: ProductoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData | null>>;
  subfamilias: { id: string; nombre: string }[];
  loadingSub: boolean;
}

const CreateProductForm = ({
  formData,
  handleChange,
  handlePriceChange,
  setFormData,
  subfamilias,
  loadingSub,
}: CreateProductFormProps) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 px-2">
      
      {/* SECCIÓN 1: Identificación y Precio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre - Ahora ocupa toda la fila o se mantiene prominente */}
        <div className="md:col-span-2">
          <label className="block text-blue-400 text-xs font-bold mb-2 ml-1">
            Nombre del Producto <span className="text-red-500">*</span>
          </label>
          <input
            name="txtnombre"
            value={formData.txtnombre}
            onChange={handleChange}
            autoFocus
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-all shadow-inner"
            placeholder="Ej: Galletas Soda 150g"
          />
        </div>

        {/* Precio Venta - Movido al inicio de esta fila */}
        <div>
          <label className="block text-green-400 text-xs font-bold mb-2 ml-1">
            Precio Venta (Bruto) <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-green-500 transition-colors">
              $
            </span>
            <input
              name="txtprecio_venta_boleta"
              value={formData.txtprecio_venta_boleta}
              onChange={handlePriceChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-8 text-white font-mono text-lg outline-none focus:border-green-500 transition-all"
              placeholder="0"
            />
          </div>
        </div>

        {/* El campo "Código Detectado" ha sido eliminado de aquí */}
      </div>

      {/* SECCIÓN 2: Clasificación (Obligatoria para crear) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Familia */}
        <div>
          <label className="block text-blue-400 text-xs font-bold mb-2 ml-1">
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
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer hover:bg-zinc-900"
          >
            <option value="0">Seleccione Familia...</option>
            {FAMILIAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Familia */}
        <div>
          <label className="block text-blue-400 text-xs font-bold mb-2 ml-1 flex justify-between">
            Sub Familia
            {loadingSub && <span className="text-blue-500 animate-pulse text-[10px]">Cargando...</span>}
          </label>
          <select
            name="txtsubfamilia_producto"
            value={formData.txtsubfamilia_producto}
            onChange={handleChange}
            disabled={loadingSub || subfamilias.length === 0}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900"
          >
            <option value="">Seleccione Sub Familia...</option>
            {subfamilias.map((sf) => (
              <option key={sf.id} value={sf.id}>
                {sf.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECCIÓN 3: Impuestos */}
      <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IVA */}
        <div>
          <label className="block text-zinc-400 text-xs font-bold mb-2 ml-1">
            ¿Afecto a IVA? (19%)
          </label>
          <div className="flex gap-3">
            {["S", "N"].map((opcion) => (
              <label
                key={opcion}
                className={`flex-1 flex items-center justify-center cursor-pointer border rounded-xl py-2 transition-all font-bold text-sm ${
                  formData.txtiva === opcion
                    ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
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

        {/* Impuesto Adicional */}
        <div>
          <label className="block text-zinc-400 text-xs font-bold mb-2 ml-1">
            Impuesto Adicional (ILA)
          </label>
          <select
            name="txtid_impuestos1"
            value={formData.txtid_impuestos1}
            onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-300 outline-none focus:border-blue-500 appearance-none"
          >
            {IMPUESTOS_ADICIONALES.map((imp) => (
              <option key={imp.id} value={imp.id}>
                {imp.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CreateProductForm;