import React from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES, UNIDADES } from "../utils/productConstants";
import { ProductoFormData } from "./ProductForm";
import s from "./ProductForm.module.css";

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
    <div className={`${s.container} gap-4`}>
      
      {/* 3.3) CATEGORÍA "DETALLE" */}
      <div className={`lg:col-span-7 lg:row-span-2 ${s.sectionBox} flex flex-col gap-4`}>
        <h4 className={s.sectionTitle}>
          <span>📝</span> Detalle del Producto
        </h4>

        {/* Nombre */}
        <div>
          <label className={s.label}>Nombre del Producto</label>
          <input
            name="txtnombre"
            value={formData.txtnombre}
            onChange={handleChange}
            className={s.input}
            placeholder="Ej: Bebida Cola 350cc"
          />
        </div>

        {/* Cód. Interno */}
        <div>
            <label className={s.label}>Cód. Interno</label>
            <input
              name="txtcod_interno"
              value={formData.txtcod_interno}
              onChange={handleChange}
              className={s.input}
            />
        </div>

        {/* Familias */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={s.label}>Familia</label>
            <select
              name="txtfamilia_producto"
              value={formData.txtfamilia_producto}
              onChange={(e) => {
                handleChange(e);
                setFormData((prev) =>
                  prev ? { ...prev, txtsubfamilia_producto: "" } : null
                );
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

        {/* Unidad (Ahora ocupa todo el ancho disponible) */}
        <div>
            <label className={s.label}>Unidad</label>
            <select
              name="txtunidad"
              value={formData.txtunidad}
              onChange={handleChange}
              className={`${s.select} uppercase`}
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
        </div>
      </div>

      {/* 3.2) CATEGORÍA "PRECIOS" */}
      <div className={`lg:col-span-5 ${s.sectionBox} h-fit`}>
        <h4 className={s.sectionTitle}>
          <span>💰</span> Precios
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={s.label}>Precio NETO</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-zinc-400 pointer-events-none text-sm">$</span>
                <input
                    name="txtprecio_venta"
                    value={formData.txtprecio_venta}
                    onChange={handlePriceChange}
                    className={`${s.inputMoney} text-zinc-300`}
                    placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className={s.label}>Precio FINAL</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-zinc-400 pointer-events-none text-sm">$</span>
                <input
                    name="txtprecio_venta_boleta"
                    value={formData.txtprecio_venta_boleta}
                    onChange={handlePriceChange}
                    className={`${s.inputMoney} font-bold text-white bg-zinc-800/50`}
                    placeholder="0"
                />
              </div>
            </div>
          </div>
      </div>

      {/* 3.1) CATEGORÍA "IMPUESTOS" */}
      <div className={`lg:col-span-5 ${s.sectionBox} h-fit`}>
        <h4 className={s.sectionTitle}>
          <span>⚖️</span> Impuestos
        </h4>

        <div className="space-y-4">
          <div>
            <label className={s.label}>¿Afecto a IVA? (19%)</label>
            <div className="flex gap-2 h-[38px]">
                {["S", "N"].map((opcion) => (
                <label
                    key={opcion}
                    className={`${s.toggleOption} ${formData.txtiva === opcion ? s.toggleActive : s.toggleInactive}`}
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

      {/* 3.4) CATEGORÍA "OTROS" */}
      <div className={`lg:col-span-12 ${s.sectionBox}`}>
        <h4 className={s.sectionTitle}>
          <span>⚙️</span> Otros Ajustes
        </h4>

        {/* Ahora el grid es de 3 columnas para que los campos restantes no dejen un hueco vacío */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Comanda */}
            <div>
                <label className={s.label} title="Incluir Comanda Cocina">Comanda C.</label>
                <select
                name="txtfactor_compra"
                value={formData.txtfactor_compra}
                onChange={handleChange}
                className={s.select}
                >
                <option value="1">SI</option>
                <option value="0">NO</option>
                </select>
            </div>

            {/* Stock Crítico */}
            <div>
              <label className={s.label}>Stock Crítico</label>
              <input
                name="txtstock_critico"
                value={formData.txtstock_critico}
                onChange={handleChange}
                className={`${s.input} text-center`}
              />
            </div>

            {/* Días Reposición */}
            <div>
              <label className={s.label}>Días Reposición</label>
              <input
                name="txtdias_reposion"
                value={formData.txtdias_reposion}
                onChange={handleChange}
                className={`${s.input} text-center`}
              />
            </div>
        </div>
      </div>

    </div>
  );
};

export default AdvancedProductForm;