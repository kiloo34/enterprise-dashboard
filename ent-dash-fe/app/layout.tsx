import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manajemen Data Perusahaan",
  description: "Monitoring engine dashboard",
};

import { SettingsProvider } from "@/components/SettingsContext";
import { AuthProvider } from "@/components/AuthContext";
import { TranslationsProvider } from "@/components/TranslationsProvider";
import { Toaster } from "sonner";
import { SWRProvider } from "@/components/SWRProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <SettingsProvider>
            <TranslationsProvider>
              <SWRProvider>
                {children}
                <Toaster richColors position="top-right" />
              </SWRProvider>
            </TranslationsProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
