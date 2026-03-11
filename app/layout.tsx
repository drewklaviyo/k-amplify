import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "K Amplify",
  description: "Amplify partner portal and operating hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="max-w-[900px] mx-auto px-8 pt-[76px] pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
