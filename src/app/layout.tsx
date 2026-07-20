import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { ViewModeProvider } from "@/context/ViewModeContext";
import { RecordingProvider } from "@/context/RecordingContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
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
      suppressHydrationWarning
      className={`${primaryFont.variable} ${monoFont.variable} ${editorialFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <ViewModeProvider>
            <FeedbackProvider>
              <WorkspaceProvider>
                <RecordingProvider>
                  <AppShell>{children}</AppShell>
                </RecordingProvider>
              </WorkspaceProvider>
            </FeedbackProvider>
          </ViewModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
