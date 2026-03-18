"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LayoutContextValue {
  isWide: boolean;
  setWide: (wide: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  isWide: false,
  setWide: () => {},
});

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isWide, setIsWide] = useState(false);
  const setWide = useCallback((wide: boolean) => setIsWide(wide), []);
  return (
    <LayoutContext.Provider value={{ isWide, setWide }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
