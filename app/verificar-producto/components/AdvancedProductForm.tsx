import React from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES, UNIDADES } from "../utils/productConstants";
import { ProductoFormData } from "./ProductForm";

interface AdvancedProductFormProps {
  formData: ProductoFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handlePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData | null>>;
  subfamilias: { id: string; nombre: string }[];
  loadingSub: boolean;
}

const AdvancedProductForm = ({
  formData,
  handleChange,
  handlePriceChange,
  setFormData,
  subfamilias,
  loadingSub,
}: AdvancedProductFormProps) => {
  return (
    // CAMBIO: gap-8 a gap-4 para reducir la separación entre columnas
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* --- COLUMNA IZQUIERDA: INFORMACIÓN BASE --- */}
      {/* CAMBIO: space-y-5 a space-y-3 para igualar el 'gap-3' de SimpleProductForm */}
      <div className="lg:col-span-7 space-y-3">
        
        {/* Nombre */}
        <div>
          {/* CAMBIO: ml-1 añadido para alinear con el estilo de Simple */}
          <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
            Nombre del Producto
          </label>
          <input
            name="txtnombre"
            value={formData.txtnombre}
            onChange={handleChange}
            // CAMBIO: border-zinc-700 a zinc-800, p-2.5 a p-2
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:border-zinc-500 outline-none transition-all"
          />
        </div>

        {/* Códigos */}
        {/* CAMBIO: gap-4 a gap-3 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
              Código Barra
            </label>
            <input
              name="txtcodigo"
              value={formData.txtcodigo}
              readOnly
              className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-lg p-2 text-xs cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
              Cód. Interno
            </label>
            <input
              name="txtcod_interno"
              value={formData.txtcod_interno}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Familias */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-500 appearance-none"
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
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
              Sub Familia
              {loadingSub && (
                <span className="text-zinc-500 animate-pulse ml-2">...</span>
              )}
            </label>
            <select
              name="txtsubfamilia_producto"
              value={formData.txtsubfamilia_producto}
              onChange={handleChange}
              disabled={loadingSub || subfamilias.length === 0}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-500 appearance-none disabled:opacity-30"
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

        {/* Unidad y Vigencia */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
              Unidad
            </label>
            <input
              name="txtunidad"
              list="unidades-list"
              value={formData.txtunidad}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-center uppercase text-white outline-none focus:border-zinc-500"
            />
            <datalist id="unidades-list">
              {UNIDADES.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
              Estado
            </label>
            <select
              name="txtvigente"
              value={formData.txtvigente}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-500 appearance-none"
            >
              <option value="S">Vigente</option>
              <option value="N">No Vigente</option>
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal" title="Incluir Comanda Cocina">
              Comanda C.
            </label>
            <select
              name="txtfactor_compra"
              value={formData.txtfactor_compra}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-zinc-500 appearance-none"
            >
              <option value="1">SI</option>
              <option value="0">NO</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- COLUMNA DERECHA: PRECIOS E IMPUESTOS --- */}
      {/* CAMBIO: p-6 a p-4 para reducir margen interno y alinearlo visualmente */}
      <div className="lg:col-span-5 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 h-fit">
        <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="text-xs">💰</span> Precios e Impuestos
        </h4>

        {/* CAMBIO: space-y-5 a space-y-3 */}
        <div className="space-y-3">
          {/* Afecto a IVA */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
                ¿Afecto a IVA? (19%)
            </label>
            <div className="flex gap-2 h-[38px]">
                {["S", "N"].map((opcion) => (
                <label
                    key={opcion}
                    className={`flex-1 flex items-center justify-center cursor-pointer border rounded-lg transition-all text-xs font-medium ${
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

          {/* Impuesto Adicional */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
              Impuesto Adicional (ILA)
            </label>
            {/* CAMBIO: forzar h-[38px] */}
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

          <div className="h-px bg-zinc-800/50 my-2"></div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
                Precio NETO
              </label>
              <input
                name="txtprecio_venta"
                value={formData.txtprecio_venta}
                onChange={handlePriceChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-right text-sm text-zinc-300 outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
                Precio FINAL (Bruto)
              </label>
              <input
                name="txtprecio_venta_boleta"
                value={formData.txtprecio_venta_boleta}
                onChange={handlePriceChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-right font-bold text-white outline-none focus:border-zinc-500 text-sm"
              />
            </div>
          </div>
          
          {/* Stock */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
                Stock Crítico
              </label>
              <input
                name="txtstock_critico"
                value={formData.txtstock_critico}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs mb-1 ml-1 font-normal">
                Días Reposición
              </label>
              <input
                name="txtdias_reposion"
                value={formData.txtdias_reposion}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center text-xs text-white outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedProductForm;