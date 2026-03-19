"use client";

import { useEffect, useState } from "react";

export default function HowWeWorkPage() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    // Capture the hash from the parent URL and pass it to the iframe
    setHash(window.location.hash);

    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="-mx-8 -mt-4">
      <iframe
        src={`/how-we-work.html?embedded=1${hash}`}
        className="w-full border-0"
        style={{ height: "calc(100vh - 52px)" }}
        title="Amplify Operating Rhythm"
      />
    </div>
  );
}
