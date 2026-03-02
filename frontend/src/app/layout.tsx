import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "War Dashboard — Intelligence Feed",
  description: "Real-time war news intelligence dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0a0a0f] text-gray-100 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
