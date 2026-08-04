import type { Metadata, Viewport } from "next";
import Script from "next/script";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { DemoModeProvider } from "@/context/DemoModeContext";
import { ViewModeProvider } from "@/context/ViewModeContext";
import { RecordingProvider } from "@/context/RecordingContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://auxiliaire-os.vercel.app"),
  title: {
    default: "Auxiliaire — Decision memory for product builders",
    template: "%s · Auxiliaire",
  },
  description: "Capture the evidence behind decisions, keep every follow-up connected, and return later to see what changed.",
  keywords: ["decision log", "product management", "AI memory", "productivity", "knowledge management"],
  authors: [{ name: "Auxiliaire" }],
  creator: "Auxiliaire",
  openGraph: {
    title: "Auxiliaire — Decision memory for product builders",
    description: "From messy evidence to a source-linked next step—and back to the outcome.",
    type: "website",
    siteName: "Auxiliaire",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auxiliaire — Decision memory for product builders",
    description: "Capture decisions, preserve their evidence, and learn from what happened next.",
  },
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <DemoModeProvider>
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
        </DemoModeProvider>
      </body>
      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "xx729nngw9");`}
      </Script>
    </html>
  );
}
