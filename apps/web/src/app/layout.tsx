import { SidebarInset, SidebarProvider } from "@quill/ui/components/sidebar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import "../index.css";
import { AppSidebar } from "@/components/app-sidebar";
import { ComposeProvider } from "@/components/compose/compose-provider";
import Providers from "@/components/providers";
import { RightSidebar } from "@/components/right-sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quill",
  description: "A small microblogging app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <ComposeProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="bg-background">
                <div className="flex min-h-svh w-full">
                  <main className="flex min-w-0 flex-1 flex-col bg-background">{children}</main>
                  <Suspense fallback={null}>
                    <RightSidebar />
                  </Suspense>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ComposeProvider>
        </Providers>
      </body>
    </html>
  );
}
