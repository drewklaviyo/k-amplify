"use client";

import { ReactNode } from "react";
import { useLayout } from "./layout-context";

export function MainContainer({ children }: { children: ReactNode }) {
  const { isWide } = useLayout();
  return (
    <main
      id="main-content"
      className={`mx-auto px-8 pt-[76px] pb-20 transition-[max-width] duration-300 ${
        isWide ? "max-w-[1200px]" : "max-w-[900px]"
      }`}
    >
      {children}
    </main>
  );
}
