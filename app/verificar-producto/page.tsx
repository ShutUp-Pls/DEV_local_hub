'use client';

import { useState } from "react";
import Navbar from "../components/Navbar";
import BarcodeScanner from "./components/BarcodeScanner";
import SearchBar from "./components/SearchBar";
import ProductForm, { ProductoFormData } from "./components/ProductForm";
import CreateForm from "./components/CreateForm";
import Alert from "./components/Alert";
import { useSession } from "next-auth/react";

// Valores por defecto solicitados
const DEFAULT_PRODUCT_DATA: ProductoFormData = {
  txtcodigo: "",          
  txtcod_interno: "",
  txtnombre: "",
  txtfamilia_producto: "1",      
  txtsubfamilia_producto: "1",   
  txtunidad: "UN",               
  txtiva: "S",                   
  txtid_impuestos1: "0",         
  txtprecio_venta: "0",
  txtprecio_venta_boleta: "0",
  txtstock_critico: "6",         
  txtdias_reposion: "0",         
  txtvigente: "S",
  txtfactor_compra: "1",
  txtid_producto: "",            
  txtfecha_creacion: "",
  txtporcentaje_iva: "19"
};

export default function VerificarProducto() {
  const { data: session } = useSession();
  
  // Estados principales
  const [barcode, setBarcode] = useState("");
  const [formData, setFormData] = useState<ProductoFormData | null>(null);
  const [originalData, setOriginalData] = useState<ProductoFormData | null>(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados de feedback
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [notFoundCode, setNotFoundCode] = useState(""); 

  const normalizeProductData = (data: any): ProductoFormData => {
    const normalized = { ...data };
    Object.keys(normalized).forEach((key) => {
      normalized[key] = normalized[key] != null ? String(normalized[key]) : "";
    });
    return normalized as ProductoFormData;
  };

  const handleSearch = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const codeToSearch = codeOverride || barcode;

    if (!codeToSearch) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setFormData(null);
    setNotFoundCode(""); 
    setIsCreating(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buscar-producto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codeToSearch }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error de conexión");
      }
      
      const data = await res.json();

      if (data.found) {
        const cleanData = normalizeProductData(data);
        setFormData(cleanData); 
        setOriginalData({ ...cleanData }); 
      } else {
        setError(data.message || "Producto no encontrado");
        setNotFoundCode(codeToSearch);
      }
    } catch (err: any) {
      setError(err.message || "Error al buscar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartCreate = () => {
    setError(""); 
    setIsCreating(true);
    
    const newProduct = { 
      ...DEFAULT_PRODUCT_DATA, 
      txtcodigo: notFoundCode 
    };
    
    setFormData(newProduct);
    setOriginalData(null); 
  };

  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    setBarcode(decodedText);
    handleSearch(undefined, decodedText);
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    const endpoint = isCreating 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/crear-producto`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/guardar-producto`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg(isCreating ? "¡Producto creado exitosamente!" : "¡Producto guardado exitosamente!");
        setOriginalData(formData); 
        setIsCreating(false); 
        setNotFoundCode("");
      } else {
        setError(data.message || "No se pudo guardar");
      }
    } catch (err) {
      setError("Error crítico al procesar solicitud");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-20">
      <Navbar userName={session?.user?.name} />

      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <main className="max-w-5xl mx-auto p-4 sm:p-8">
        
        {/* CABECERA Y BUSCADOR: Solo visibles si NO estamos creando */}
        {!isCreating && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Escanear producto</h2>
            </div>
            
            <SearchBar 
              barcode={barcode}
              setBarcode={setBarcode}
              onSearch={handleSearch}
              onOpenScanner={() => setShowScanner(true)}
              loading={loading}
            />
          </>
        )}

        {/* Lógica del Error y Botón de Crear */}
        {error && (
          <div className="mb-6">
            <Alert message={error} type="error" />
            
            {notFoundCode && !formData && (
              <div className="flex justify-center mt-4 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={handleStartCreate}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  Crear producto "{notFoundCode}"
                </button>
              </div>
            )}
          </div>
        )}

        {formData && (
          <>
            {isCreating ? (
              <CreateForm 
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={() => {
                  setFormData(null);
                  setIsCreating(false);
                  setNotFoundCode("");
                  setError("");
                }}
                saving={saving}
              />
            ) : (
              <ProductForm 
                formData={formData}
                originalData={originalData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={() => {
                  setFormData(null);
                  setIsCreating(false);
                  setNotFoundCode("");
                  setError("");
                }}
                saving={saving}
              />
            )}
            
            <Alert message={successMsg} type="success" />
          </>
        )}
      </main>
    </div>
  );
}