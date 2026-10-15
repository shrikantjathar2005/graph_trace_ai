import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "GraphTrace AI — Knowledge Graph & Traceability Engine",
  description: "Apple-inspired glassmorphism software architecture intelligence and traceability engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('graphtrace-theme');
                if (t && ['golden-rush', 'monochrome', 'github-dark', 'obsidian'].includes(t)) {
                  document.documentElement.setAttribute('data-theme', t);
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#070a0f] text-[#f5f7fa] flex items-center justify-center font-sans antialiased overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
