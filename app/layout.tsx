import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Renoa.ai - Connect with Top-Rated Home Service Pros",
  description:
    "AI-powered platform connecting homeowners with top-rated local service providers for landscaping, remodeling, roofing, HVAC, plumbing, and more.",
  keywords: [
    "home services",
    "contractors",
    "home improvement",
    "landscaping",
    "remodeling",
    "service providers",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

