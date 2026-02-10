import React from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES, UNIDADES } from "../utils/productConstants";
import { ProductoFormData } from "./ProductForm"; // Asumimos que la interfaz se exporta desde el padre o un archivo de tipos

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-300">
      {/* --- COLUMNA IZQUIERDA: INFORMACIÓN BASE --- */}
      <div className="lg:col-span-7 space-y-5">
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-blue-400 text-xs mb-1.5 ml-1">
              Nombre del Producto
            </label>
            <input
              name="txtnombre"
              value={formData.txtnombre}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Códigos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-400 text-xs mb-1.5 ml-1">
                Código Barra
              </label>
              <input
                name="txtcodigo"
                value={formData.txtcodigo}
                readOnly
                className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-lg p-2.5 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-blue-400 text-xs mb-1.5 ml-1">
                Cód. Interno
              </label>
              <input
                name="txtcod_interno"
                value={formData.txtcod_interno}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Familias */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-400 text-xs mb-1.5 ml-1">
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
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 appearance-none"
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
              <label className="block text-blue-400 text-xs mb-1.5 ml-1 flex justify-between">
                Sub Familia
                {loadingSub && (
                  <span className="text-blue-400 animate-pulse">
                    Cargando...
                  </span>
                )}
              </label>
              <select
                name="txtsubfamilia_producto"
                value={formData.txtsubfamilia_producto}
                onChange={handleChange}
                disabled={loadingSub || subfamilias.length === 0}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 appearance-none disabled:opacity-50"
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-blue-400 text-xs mb-1.5 ml-1">
                Unidad
              </label>
              <input
                name="txtunidad"
                list="unidades-list"
                value={formData.txtunidad}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-center uppercase"
              />
              <datalist id="unidades-list">
                {UNIDADES.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-blue-400 text-xs mb-1.5 ml-1">
                Estado
              </label>
              <select
                name="txtvigente"
                value={formData.txtvigente}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 outline-none"
              >
                <option value="S">Vigente</option>
                <option value="N">No Vigente</option>
              </select>
            </div>
            <div>
              <label
                className="block text-blue-400 text-xs mb-1.5 ml-1"
                title="Incluir Comanda Cocina"
              >
                Comanda C.
              </label>
              <select
                name="txtfactor_compra"
                value={formData.txtfactor_compra}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 outline-none"
              >
                <option value="1">SI</option>
                <option value="0">NO</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* --- COLUMNA DERECHA: PRECIOS E IMPUESTOS --- */}
      <div className="lg:col-span-5 bg-zinc-950/50 p-6 rounded-xl border border-zinc-800 h-fit">
        <h4 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>💰</span> Precios e Impuestos
        </h4>

        <div className="space-y-5">
          {/* Afecto a IVA */}
          <div>
            <label className="block text-blue-400 text-xs font-medium mb-1.5 ml-1">
                ¿Afecto a IVA? (19%)
            </label>
            <div className="flex gap-2 h-[42px]">
                {["S", "N"].map((opcion) => (
                <label
                    key={opcion}
                    className={`flex-1 flex items-center justify-center cursor-pointer border rounded-lg transition-all text-sm font-medium ${
                    formData.txtiva === opcion
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-700"
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
            <label className="block text-blue-400 text-xs mb-1.5">
              Impuesto Adicional (ILA)
            </label>
            <select
              name="txtid_impuestos1"
              value={formData.txtid_impuestos1}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-300 outline-none focus:border-blue-500"
            >
              {IMPUESTOS_ADICIONALES.map((imp) => (
                <option key={imp.id} value={imp.id}>
                  {imp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="h-px bg-zinc-800 my-4"></div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-400 text-xs mb-1.5 font-bold">
                Precio NETO
              </label>
              <input
                name="txtprecio_venta"
                value={formData.txtprecio_venta}
                onChange={handlePriceChange}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 font-mono text-right outline-none focus:border-blue-500 text-lg"
              />
            </div>
            <div>
              <label className="block text-green-400 text-xs mb-1.5 font-bold">
                Precio FINAL (Bruto)
              </label>
              <input
                name="txtprecio_venta_boleta"
                value={formData.txtprecio_venta_boleta}
                onChange={handlePriceChange}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 font-mono text-right font-bold text-white outline-none focus:border-green-500 text-lg"
              />
            </div>
          </div>
          <p className="text-right text-[10px] text-zinc-600 mt-1">
            * El precio final incluye IVA e Impuestos Adicionales
          </p>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-blue-400 text-xs mb-1">
                Stock Crítico
              </label>
              <input
                name="txtstock_critico"
                value={formData.txtstock_critico}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center"
              />
            </div>
            <div>
              <label className="block text-blue-400 text-xs mb-1">
                Días Reposición
              </label>
              <input
                name="txtdias_reposion"
                value={formData.txtdias_reposion}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedProductForm;