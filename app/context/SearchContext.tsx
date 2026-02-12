// context/SearchContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SearchContextType {
  useLocalSearch: boolean;
  setUseLocalSearch: (value: boolean) => void;
  isInitialized: boolean; // <--- AGREGAR ESTO
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [useLocalSearch, setUseLocalSearch] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPreference = sessionStorage.getItem("search_mode_local");
      if (savedPreference !== null) {
        setUseLocalSearch(savedPreference === "true");
      }
      setIsInitialized(true); // Ya terminamos de leer
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      sessionStorage.setItem("search_mode_local", String(useLocalSearch));
    }
  }, [useLocalSearch, isInitialized]);

  // Pasamos isInitialized en el value
  return (
    <SearchContext.Provider value={{ useLocalSearch, setUseLocalSearch, isInitialized }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch debe usarse dentro de un SearchProvider');
  }
  return context;
}