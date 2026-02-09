// app/page.tsx
'use client';

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Estado para "Mantener sesión"
  const [rememberMe, setRememberMe] = useState(false); 
  
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session) router.push("/inicio");
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      remember: rememberMe ? true : false,
      redirect: false,
    });

    if (result?.error) {
      setError("Usuario o contraseña incorrectos");
    } else {
      router.push("/inicio");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-950 text-white">
      {/* Título de la Aplicación */}
      <h1 className="text-4xl font-extrabold mb-8 tracking-tight">
        Local<span className="text-blue-500">HUB</span>
      </h1>

      <form 
        onSubmit={handleSubmit} 
        className="bg-zinc-900 p-8 rounded-xl shadow-2xl w-80 border border-zinc-800"
      >
        <h2 className="text-xl font-semibold mb-6 text-center text-zinc-100">
          Iniciar Sesión
        </h2>
        
        {error && (
          <p className="bg-red-500/10 border border-red-500 text-red-500 text-xs p-2 rounded mb-4 text-center">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-zinc-400 text-sm mb-2">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Tu usuario"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-zinc-400 text-sm mb-2">Contraseña</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        {/* Checkbox de Mostrar Contraseña */}
        <div className="flex items-center mb-3">
          <input
            id="showPassword"
            type="checkbox"
            className="h-4 w-4 bg-zinc-800 border-zinc-700 rounded text-blue-500 focus:ring-offset-zinc-900"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          <label htmlFor="showPassword" className="ml-2 block text-sm text-zinc-300 cursor-pointer select-none">
            Ver contraseña
          </label>
        </div>

        {/* Checkbox de Mantener Sesión */}
        <div className="flex items-center mb-6">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 bg-zinc-800 border-zinc-700 rounded text-blue-500 focus:ring-offset-zinc-900"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-zinc-300 cursor-pointer select-none">
            Mantener sesión iniciada
          </label>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-medium p-2.5 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}