import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "GraphTrace AI — Software Engineering Intelligence & Knowledge Graph",
  description: "Understand codebases through connected evidence: requirements, source code, architecture, and tests in a persistent Software Knowledge Graph.",
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
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans antialiased overflow-x-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
