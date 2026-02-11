// components/LoginForm.tsx
'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  onError: (msg: string) => void;
}

export default function LoginForm({ onError }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Limpiamos errores previos al intentar de nuevo
    onError(""); 

    const result = await signIn("credentials", {
      username,
      password,
      remember: rememberMe ? "true" : "false", // Aseguramos enviar string si el provider lo espera así
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      onError("Credenciales incorrectas. Verifica tu usuario y contraseña.");
    } else {
      router.push("/inicio");
      router.refresh();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-zinc-900 p-8 rounded-xl shadow-2xl w-80 border border-zinc-800"
    >
      <h2 className="text-xl font-semibold mb-6 text-center text-zinc-100">
        Iniciar Sesión
      </h2>
      
      <div className="mb-4">
        <label className="block text-zinc-400 text-sm mb-2">Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Tu usuario"
          required
          disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center mb-3">
        <input
          id="showPassword"
          type="checkbox"
          className="h-4 w-4 bg-zinc-800 border-zinc-700 rounded text-blue-500 focus:ring-offset-zinc-900 accent-blue-600"
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
        />
        <label htmlFor="showPassword" className="ml-2 block text-sm text-zinc-300 cursor-pointer select-none">
          Ver contraseña
        </label>
      </div>

      <div className="flex items-center mb-6">
        <input
          id="rememberMe"
          type="checkbox"
          className="h-4 w-4 bg-zinc-800 border-zinc-700 rounded text-blue-500 focus:ring-offset-zinc-900 accent-blue-600"
          checked={rememberMe}
          onChange={() => setRememberMe(!rememberMe)}
        />
        <label htmlFor="rememberMe" className="ml-2 block text-sm text-zinc-300 cursor-pointer select-none">
          Mantener sesión iniciada
        </label>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className={`w-full text-white font-medium p-2.5 rounded-lg transition-colors shadow-lg shadow-blue-900/20 ${
          isLoading ? "bg-zinc-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
        }`}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}