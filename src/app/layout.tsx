import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";

import "./globals.css";

const thaiSans = IBM_Plex_Sans_Thai({
  variable: "--font-thai-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const logoSans = Inter({
  variable: "--font-logo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Platform",
  description: "Human resource management platform",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${thaiSans.variable} ${logoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
