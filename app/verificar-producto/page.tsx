'use client';

import { useState } from "react";
// Componentes Universales
import Navbar from "../components/Navbar";
// Componentes Propios
import BarcodeScanner from "./components/BarcodeScanner";
import SearchBar from "./components/SearchBar";
import ProductForm, { ProductoFormData } from "./components/ProductForm";
import Alert from "./components/Alert";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function VerificarProducto() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Estados principales
  const [barcode, setBarcode] = useState("");
  const [formData, setFormData] = useState<ProductoFormData | null>(null);
  const [originalData, setOriginalData] = useState<ProductoFormData | null>(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Estados de feedback
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const normalizeProductData = (data: any): ProductoFormData => {
    const normalized = { ...data };
    Object.keys(normalized).forEach((key) => {
      // Si el valor es null o undefined, lo convertimos en string vacío
      // De lo contrario, nos aseguramos de que sea un string
      normalized[key] = normalized[key] != null ? String(normalized[key]) : "";
    });
    return normalized as ProductoFormData;
  };

  // Lógica de Búsqueda
  const handleSearch = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const codeToSearch = codeOverride || barcode;

    if (!codeToSearch) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setFormData(null);

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
      }
    } catch (err: any) {
      setError(err.message || "Error al buscar el producto.");
    } finally {
      setLoading(false);
    }
  };

  // Callback cuando el escáner detecta algo
  const handleScanSuccess = (decodedText: string) => {
    setShowScanner(false);
    setBarcode(decodedText);
    handleSearch(undefined, decodedText); // Buscar inmediatamente
  };

  // Lógica de Guardado
  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guardar-producto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg("¡Producto guardado exitosamente!");
        // CLAVE: Actualizamos el originalData con lo que acabamos de guardar
        setOriginalData(formData); 
      } else {
        setError(data.message || "No se pudo guardar");
      }
    } catch (err) {
      setError("Error crítico al guardar");
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

        {/* Mantenemos el error aquí arriba para fallos de búsqueda */}
        <Alert message={error} type="error" />

        {formData && (
          <>
            <ProductForm 
              formData={formData}
              originalData={originalData} // PASAMOS EL ORIGINAL
              setFormData={setFormData}
              onSave={handleSave}
              onCancel={() => setFormData(null)}
              saving={saving}
            />
            <Alert message={successMsg} type="success" />
          </>
        )}
      </main>
    </div>
  );
}