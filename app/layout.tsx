import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import GitHubStarButton from "@/components/GitHubStarButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenRss - Agrégateur de flux RSS",
  description: "Agrégateur de flux RSS moderne et open source pour lire et organiser vos articles préférés. Gratuit, sans inscription, données stockées localement.",
  metadataBase: new URL('https://openrss.williamloree.fr'),
  alternates: {
    canonical: '/',
  },
  keywords: ['RSS', 'agrégateur', 'flux RSS', 'lecteur RSS', 'open source', 'actualités'],
  authors: [{ name: 'William Lorée' }],
  openGraph: {
    title: "OpenRss - Agrégateur de flux RSS",
    description: "Agrégateur de flux RSS moderne et open source. Gratuit, sans inscription.",
    url: 'https://openrss.williamloree.fr',
    siteName: 'OpenRss',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: "OpenRss - Agrégateur de flux RSS",
    description: "Agrégateur de flux RSS moderne et open source. Gratuit, sans inscription.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {umamiWebsiteId && (
          <script
            defer
            src="https://track.williamloree.fr/script.js"
            data-website-id={umamiWebsiteId}
          ></script>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "OpenRss",
              "description": "Agrégateur de flux RSS moderne et open source pour lire et organiser vos articles préférés",
              "url": "https://openrss.williamloree.fr",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web",
              "inLanguage": "fr",
              "isAccessibleForFree": true,
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              },
              "author": {
                "@type": "Person",
                "name": "William Lorée"
              }
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <GitHubStarButton />
          <Toaster position="bottom-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
