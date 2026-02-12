import React, { useEffect, useState, useCallback } from "react";
import AdvancedProductForm from "./AdvancedProductForm";
import CreateProductForm from "./CreateProductForm"; // Nota: Usamos este para el modo simple en creación
import { ProductoFormData } from "./ProductForm";
import s from "./ProductForm.module.css";

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

  // Lógica para cargar subfamilias
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

  // En creación, permitimos guardar si tiene nombre y no está guardando
  const canSave = formData.txtnombre && !saving;

  return (
    <div className={s.mainCard}>
      
      {/* --- HEADER --- */}
      <div className={s.header}>
        
        {/* Fila 1: Título y CÓDIGO */}
        <div className={s.headerRow}>
          <h3 className={s.headerTitle}>Nuevo Producto</h3>
          <span className={s.idBadge} title="Código de Barras">
            CÓDIGO: {formData.txtcodigo || "PTE..."}
          </span>
        </div>

        {/* Fila 2: Vigencia y Switch Modo */}
        <div className={s.headerRow}>
          <div 
            onClick={toggleVigencia}
            title="Clic para cambiar estado"
            className={`${s.statusBadge} ${
              formData.txtvigente === 'S' ? s.statusActive : s.statusInactive
            }`}
          >
            {formData.txtvigente === 'S' ? '● VIGENTE' : '○ NO VIGENTE'}
          </div>

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
        key={isAdvanced ? 'advanced' : 'create'}
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
      <div className={s.footer}>
          <button 
              onClick={onCancel}
              className={s.btnCancel}
          >
              Cancelar
          </button>

          <button 
              onClick={onSave}
              disabled={!canSave}
              className={`${s.btnSave} ${
                  !canSave ? s.btnSaveDisabled : s.btnSaveActive
              }`}
          >
              {saving ? "Creando..." : "Crear Producto"}
          </button>
      </div>
    </div>
  );
};

export default CreateForm;