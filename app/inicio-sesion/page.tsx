// app/page.tsx
'use client';

import { useState, useEffect, Suspense } from "react"; 
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoginForm from "./components/LoginForm";
import Alert from "../components/Alert";

// Componente interno para manejar params de búsqueda de forma segura
function LoginContent() {
  const searchParams = useSearchParams();
  const [alertInfo, setAlertInfo] = useState<{ msg: string, type: "error" | "success" } | null>(null);
  
  // Detectar si venimos redirigidos por sesión expirada
  useEffect(() => {
    const isExpired = searchParams.get("expired");
    if (isExpired === "true") {
      setAlertInfo({ 
        msg: "Tu sesión ha expirado por seguridad. Por favor, ingresa nuevamente.", 
        type: "error" // Puedes usar "error" o crear un estilo "warning" en tu Alert
      });
      
      // Opcional: Limpiar la URL para que si recarga no salga el error de nuevo
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center">
      {/* Zona de Alertas: Maneja errores de login Y expiración */}
      <div className="w-80 mb-2">
        {alertInfo && (
          <Alert message={alertInfo.msg} type={alertInfo.type} />
        )}
      </div>

      {/* Formulario externalizado */}
      <LoginForm onError={(msg) => setAlertInfo({ msg, type: "error" })} />
    </div>
  );
}

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirección si ya está logueado
  useEffect(() => {
    if (session) router.push("/inicio");
  }, [session, router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-950 text-white">
      <h1 className="text-4xl font-extrabold mb-8 tracking-tight">
        Local<span className="text-blue-500">HUB</span>
      </h1>

      {/* Suspense es necesario cuando usamos useSearchParams en el cliente */}
      <Suspense fallback={<div className="text-zinc-500">Cargando...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}