import type { Metadata } from "next";
import { Bungee, Geist_Mono, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const headingFont = Bungee({
  variable: "--font-heading-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlashFrame Photobooth",
  description:
    "A playful browser photobooth with live capture, quick edits, and session-only local photo storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${geistMono.variable} ${headingFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            duration={2000}
            richColors
            closeButton={false}
          />
        </ThemeProvider>
        {/* Portal container for modals - renders outside normal DOM hierarchy */}
        <div id="portal-root" className="fixed inset-0 pointer-events-none z-[9999]" />
      </body>
    </html>
  );
}
