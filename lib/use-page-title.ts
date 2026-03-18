"use client";

import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | K Amplify`;
    return () => { document.title = prev; };
  }, [title]);
}
