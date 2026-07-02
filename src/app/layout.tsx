import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { AssistantProvider } from "@/context/AssistantContext";
import { ViewModeProvider } from "@/context/ViewModeContext";
import { RecordingProvider } from "@/context/RecordingContext";
import "./globals.css";

const primaryFont = Plus_Jakarta_Sans({
  variable: "--font-primary",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-secondary",
  subsets: ["latin"],
});

const editorialFont = Playfair_Display({
  variable: "--font-editorial-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Auxiliaire",
  description: "Personal auxiliary intelligence for daily readiness.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${primaryFont.variable} ${monoFont.variable} ${editorialFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <AssistantProvider>
            <ViewModeProvider>
              <RecordingProvider>
                <AppShell>{children}</AppShell>
              </RecordingProvider>
            </ViewModeProvider>
          </AssistantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

