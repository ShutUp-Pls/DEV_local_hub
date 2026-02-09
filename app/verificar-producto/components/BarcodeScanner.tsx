// components/BarcodeScanner.tsx
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScanSuccess, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Inicializar escáner
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      // IMPORTANTE: Configurar para leer códigos de barras (EAN, UPC, Code 128)
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ]
    };

    html5QrCode.start(
      { facingMode: "environment" }, // Usa la cámara trasera
      config,
      (decodedText) => {
        // Al detectar código
        html5QrCode.stop().then(() => {
            onScanSuccess(decodedText);
        }).catch(err => console.error("Error al detener cámara", err));
      },
      (errorMessage) => {
        // Ignoramos errores de "no code detected" para no saturar el log
      }
    ).catch(err => {
      setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 relative">
        <div className="p-4 flex justify-between items-center border-b border-zinc-800">
            <h3 className="text-white font-bold">Escaneando...</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">✕ Cerrar</button>
        </div>
        
        <div id="reader" className="w-full bg-black min-h-[300px]"></div>
        
        {error && <p className="text-red-400 text-center p-4 text-sm">{error}</p>}
        
        <p className="text-center text-zinc-500 text-xs p-4">
            Apunta la cámara al código de barras del producto.
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;