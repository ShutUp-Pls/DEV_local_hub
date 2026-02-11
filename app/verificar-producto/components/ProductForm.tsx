import React, { useEffect, useState, useCallback } from "react";
import AdvancedProductForm from "./AdvancedProductForm";
import SimpleProductForm from "./SimpleProductForm";
import s from "./ProductForm.module.css";

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

  // --- NUEVA LÓGICA: Alternar vigencia al hacer click en el badge ---
  const toggleVigencia = () => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        txtvigente: prev.txtvigente === 'S' ? 'N' : 'S'
      };
    });
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
    <div className={s.mainCard}>
      
      {/* --- HEADER --- */}
      <div className={s.header}>
        
        {/* Fila 1: Título y CÓDIGO DE BARRAS (Antes ID) */}
        <div className={s.headerRow}>
          <h3 className={s.headerTitle}>Modificar Producto</h3>
          <span className={s.idBadge} title="Código de Barras">
            CÓDIGO: {formData.txtcodigo || "S/N"}
          </span>
        </div>

        {/* Fila 2: Vigencia y Switch Modo */}
        <div className={s.headerRow}>
          {/* Badge Vigencia INTERACTIVO */}
          <div 
            onClick={toggleVigencia}
            title="Clic para cambiar estado (Vigente / No Vigente)"
            className={`${s.statusBadge} ${
              formData.txtvigente === 'S' ? s.statusActive : s.statusInactive
            }`}
          >
            {formData.txtvigente === 'S' ? '● VIGENTE' : '○ NO VIGENTE'}
          </div>

          {/* Switch Modo Completo */}
          <div 
            onClick={() => setIsAdvanced(!isAdvanced)}
            className={s.switchContainer}
          >
            <span className={`${s.switchLabel} ${isAdvanced ? s.labelActive : s.labelInactive}`}>
                Modo Completo
            </span>
            
            <div className={`${s.switchTrack} ${isAdvanced ? s.trackActive : s.trackInactive}`}>
                <div className={`${s.switchThumb} ${isAdvanced ? s.thumbActive : s.thumbInactive}`} />
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENIDO DINÁMICO --- */}
      <div 
        className={`min-h-0 ${s.contentAnimate}`} 
        key={isAdvanced ? 'advanced' : 'simple'}
      >
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
      <div className={s.footer}>
          <button 
              onClick={onCancel}
              className={s.btnCancel}
          >
              Cancelar
          </button>

          <button 
              onClick={onSave}
              disabled={saving || !hasChanges}
              className={`${s.btnSave} ${
                  !hasChanges || saving ? s.btnSaveDisabled : s.btnSaveActive
              }`}
          >
              {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
      </div>
    </div>
  );
};

export default ProductForm;