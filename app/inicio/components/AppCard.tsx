'use client';

import { useRouter } from "next/navigation";

interface AppCardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
}

export default function AppCard({ title, description, icon, path }: AppCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(path)}
      className="group relative bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-blue-500/50 hover:bg-zinc-800/50 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/10"
    >
      <div className="text-4xl mb-4 bg-zinc-800 w-14 h-14 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed">
        {description}
      </p>
      <div className="mt-6 flex items-center text-blue-500 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Abrir aplicación 
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  );
}