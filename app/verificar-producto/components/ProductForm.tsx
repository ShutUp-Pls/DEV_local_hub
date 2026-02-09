import React, { useEffect, useState, useCallback } from "react";
import { FAMILIAS, IMPUESTOS_ADICIONALES, UNIDADES } from "../utils/productConstants";

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
  txtfactor_compra: string; // Comanda Cocina
  txtid_producto: string;
  txtfecha_creacion: string;
  txtporcentaje_iva: string;
}

interface ProductFormProps {
  formData: ProductoFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductoFormData | null>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const ProductForm = ({ formData, setFormData, onSave, onCancel, saving }: ProductFormProps) => {
  const [subfamilias, setSubfamilias] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);

  // FETCH SUBFAMILIAS (Replica la lógica AJAX antigua)
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

  // Efecto: Cuando cambia la familia, recargar subfamilias
  useEffect(() => {
    if (formData.txtfamilia_producto) {
      fetchSubfamilias(formData.txtfamilia_producto);
    }
  }, [formData.txtfamilia_producto, fetchSubfamilias]);

  // Manejo de cambios genéricos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // Manejo de precios (Neto <-> Bruto)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      if (!prev) return null;
      const newState = { ...prev, [name]: value };

      const ivaPct = parseFloat(newState.txtporcentaje_iva) || 19;
      const isAfecto = newState.txtiva === 'S';
      const valNumerico = parseFloat(value.replace(',', '.')) || 0;

      // Nota: El cálculo antiguo prioriza el IVA 19%. 
      // Si hay impuestos adicionales, la lógica del cliente antiguo solía ser compleja.
      // Aquí mantenemos la lógica base de IVA estándar para la conversión automática.
      
      if (name === 'txtprecio_venta') { // Cambió Neto
          if (isAfecto) {
              const bruto = valNumerico * ((ivaPct / 100) + 1);
              newState.txtprecio_venta_boleta = Math.round(bruto).toString();
          } else {
              newState.txtprecio_venta_boleta = value;
          }
      }

      if (name === 'txtprecio_venta_boleta') { // Cambió Bruto
          if (isAfecto) {
              const neto = valNumerico / ((ivaPct / 100) + 1);
              newState.txtprecio_venta = Math.round(neto).toString();
          } else {
              newState.txtprecio_venta = value;
          }
      }

      return newState;
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-start mb-6 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Modificar Producto</h3>
          <p className="text-zinc-500 text-xs mt-1 font-mono">ID Interno RJC: {formData.txtid_producto}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
             <div className={`px-3 py-1 rounded-full text-xs font-bold ${formData.txtvigente === 'S' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-red-900/40 text-red-400 border border-red-800'}`}>
                {formData.txtvigente === 'S' ? 'VIGENTE' : 'NO VIGENTE'}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- COLUMNA IZQUIERDA: INFORMACIÓN BASE --- */}
        <div className="lg:col-span-7 space-y-5">
            <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Información del Producto</h4>
            
            <div className="space-y-4">
                {/* Nombre */}
                <div>
                    <label className="block text-zinc-400 text-xs mb-1.5 ml-1">Nombre del Producto</label>
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
                        <label className="block text-zinc-500 text-xs mb-1.5 ml-1">Código Barra</label>
                        <input name="txtcodigo" value={formData.txtcodigo} readOnly className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-lg p-2.5 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-xs mb-1.5 ml-1">Cód. Interno</label>
                        <input name="txtcod_interno" value={formData.txtcod_interno} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500" />
                    </div>
                </div>

                {/* Familias */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-zinc-400 text-xs mb-1.5 ml-1">Familia</label>
                        <select 
                            name="txtfamilia_producto" 
                            value={formData.txtfamilia_producto} 
                            onChange={(e) => {
                                handleChange(e);
                                // Resetear subfamilia al cambiar familia
                                setFormData(prev => prev ? {...prev, txtsubfamilia_producto: ""} : null);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="0">Seleccione...</option>
                            {FAMILIAS.map(f => (
                                <option key={f.id} value={f.id}>{f.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-xs mb-1.5 ml-1 flex justify-between">
                            Sub Familia
                            {loadingSub && <span className="text-blue-400 animate-pulse">Cargando...</span>}
                        </label>
                        <select 
                            name="txtsubfamilia_producto" 
                            value={formData.txtsubfamilia_producto} 
                            onChange={handleChange} 
                            disabled={loadingSub || subfamilias.length === 0}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 appearance-none disabled:opacity-50"
                        >
                            <option value="">Seleccione...</option>
                            {subfamilias.map(sf => (
                                <option key={sf.id} value={sf.id}>{sf.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                 {/* Unidad y Vigencia */}
                 <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-zinc-500 text-xs mb-1.5 ml-1">Unidad</label>
                        <input 
                            name="txtunidad" 
                            list="unidades-list"
                            value={formData.txtunidad} 
                            onChange={handleChange} 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-center uppercase" 
                        />
                        <datalist id="unidades-list">
                            {UNIDADES.map(u => <option key={u} value={u} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-xs mb-1.5 ml-1">Estado</label>
                        <select name="txtvigente" value={formData.txtvigente} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 outline-none">
                            <option value="S">Vigente</option>
                            <option value="N">No Vigente</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-zinc-500 text-xs mb-1.5 ml-1" title="Incluir Comanda Cocina">Comanda C.</label>
                         <select name="txtfactor_compra" value={formData.txtfactor_compra} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 outline-none">
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
                     <label className="block text-zinc-500 text-xs mb-1.5">¿Afecto a IVA?</label>
                     <div className="flex gap-2">
                        <label className={`flex-1 cursor-pointer border rounded-lg p-2 text-center text-sm transition-colors ${formData.txtiva === 'S' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'border-zinc-700 text-zinc-500 hover:bg-zinc-800'}`}>
                            <input type="radio" name="txtiva" value="S" checked={formData.txtiva === 'S'} onChange={handleChange} className="hidden"/>
                            SI (19%)
                        </label>
                        <label className={`flex-1 cursor-pointer border rounded-lg p-2 text-center text-sm transition-colors ${formData.txtiva === 'N' ? 'bg-zinc-700 border-zinc-600 text-white' : 'border-zinc-700 text-zinc-500 hover:bg-zinc-800'}`}>
                            <input type="radio" name="txtiva" value="N" checked={formData.txtiva === 'N'} onChange={handleChange} className="hidden"/>
                            NO
                        </label>
                     </div>
                </div>

                {/* Impuesto Adicional */}
                <div>
                    <label className="block text-zinc-500 text-xs mb-1.5">Impuesto Adicional (ILA)</label>
                    <select 
                        name="txtid_impuestos1" 
                        value={formData.txtid_impuestos1} 
                        onChange={handleChange} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-300 outline-none focus:border-blue-500"
                    >
                        {IMPUESTOS_ADICIONALES.map(imp => (
                            <option key={imp.id} value={imp.id}>{imp.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="h-px bg-zinc-800 my-4"></div>

                {/* Precios */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-blue-400 text-xs mb-1.5 font-bold">Precio NETO</label>
                        <input 
                            name="txtprecio_venta" 
                            value={formData.txtprecio_venta} 
                            onChange={handlePriceChange} 
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 font-mono text-right outline-none focus:border-blue-500 text-lg" 
                        />
                    </div>
                    <div>
                        <label className="block text-green-400 text-xs mb-1.5 font-bold">Precio FINAL (Bruto)</label>
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
                        <label className="block text-zinc-500 text-xs mb-1">Stock Crítico</label>
                        <input name="txtstock_critico" value={formData.txtstock_critico} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center" />
                    </div>
                    <div>
                        <label className="block text-zinc-500 text-xs mb-1">Días Reposición</label>
                        <input name="txtdias_reposion" value={formData.txtdias_reposion} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center" />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- FOOTER: ACCIONES --- */}
      <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end gap-4">
        <button 
          onClick={onCancel}
          className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-semibold"
        >
          Cancelar
        </button>
        <button 
          onClick={onSave}
          disabled={saving}
          className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all
            ${saving ? "bg-zinc-700 cursor-wait transform-none" : "bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] shadow-blue-900/20"}
          `}
        >
          {saving ? "Guardando..." : "💾 Guardar Cambios"}
        </button>
      </div>
    </div>
  );
};

export default ProductForm;