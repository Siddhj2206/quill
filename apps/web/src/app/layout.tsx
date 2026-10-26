import { SidebarInset, SidebarProvider, SidebarTrigger } from "@quill/ui/components/sidebar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import { AppSidebar } from "@/components/app-sidebar";
import { ComposeProvider } from "@/components/compose/compose-provider";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <ComposeProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <div className="p-2 md:hidden">
                  <SidebarTrigger />
                </div>
                {children}
              </SidebarInset>
            </SidebarProvider>
          </ComposeProvider>
        </Providers>
      </body>
    </html>
  );
}
