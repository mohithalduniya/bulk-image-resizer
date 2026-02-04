import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Bulk Image Resize & Compression",
  description:
    "Resize and compress up to 100 images at once. Convert to WebP with minimal quality loss and fast ZIP download.",
  keywords: [
    "bulk image resize",
    "image compression",
    "webp converter",
    "image optimizer",
    "batch image tool",
  ],
  openGraph: {
    title: "Bulk Image Resize & Compression",
    description:
      "Reduce image size from MB to KB with minimal quality loss. Fast batch processing and WebP output.",
    type: "website",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
