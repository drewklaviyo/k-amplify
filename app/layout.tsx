import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { LayoutProvider } from "@/components/layout-context";
import { MainContainer } from "@/components/main-container";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base K:Amplify",
  description: "Base Camp for Amplify's climb to 501K hours saved",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LayoutProvider>
          <Nav />
          <MainContainer>
            {children}
          </MainContainer>
        </LayoutProvider>
      </body>
    </html>
  );
}
