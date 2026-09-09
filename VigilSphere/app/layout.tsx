import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VigilSphere | SOC Dashboard",
  description: "AI-driven cybersecurity SOC dashboard with SOAR capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white h-screen overflow-hidden flex`}>
        <Sidebar />
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
