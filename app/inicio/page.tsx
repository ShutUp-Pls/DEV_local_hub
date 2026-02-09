'use client';

import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import AppCard from "./components/AppCard";

export default function Inicio() {
  const { data: session } = useSession();

  const apps = [
    {
      id: 1,
      title: "Verificar Producto",
      description: "Consulta el estado y stock de productos en tiempo real.",
      icon: "📦",
      path: "/verificar-producto"
    },
    {
      id: 2,
      title: "Verificar Factura",
      description: "Valida comprobantes fiscales y estados de pago.",
      icon: "📄",
      path: "/verificar-factura"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <Navbar userName={session?.user?.name} />

      <main className="max-w-6xl mx-auto p-8">
        <header className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
          <p className="text-zinc-400">Selecciona una aplicación para comenzar a trabajar.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <AppCard 
              key={app.id}
              title={app.title}
              description={app.description}
              icon={app.icon}
              path={app.path}
            />
          ))}

          <div className="bg-zinc-900/40 border border-zinc-800 border-dashed p-6 rounded-2xl flex items-center justify-center">
            <p className="text-zinc-500 text-sm italic">Nuevos módulos próximamente...</p>
          </div>
        </div>
      </main>
    </div>
  );
}