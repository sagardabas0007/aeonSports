import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/toast";
import { RealtimeBadge } from "@/components/realtime-badge";
import { defaultMetadata, generateStructuredData } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = generateStructuredData();

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className}>
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
          {children}
          <ToastContainer />
          <RealtimeBadge />
        </main>
      </body>
    </html>
  );
}
