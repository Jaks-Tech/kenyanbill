import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kenyanbill.co.ke"),
  title: {
    default: "Kenyan Bill",
    template: "%s | Kenyan Bill",
  },
  description:
    "Kenyan Bill is an anonymous public forum, news hub, and AI guide for understanding Kenya's Finance Bill 2026.",
  openGraph: {
    title: "Kenyan Bill",
    description:
      "Understand the Finance Bill 2026, follow verified updates, and join anonymous public discussions.",
    url: "https://kenyanbill.co.ke",
    siteName: "Kenyan Bill",
    images: [
      {
        url: "/kb-logo.png",
        width: 1200,
        height: 630,
        alt: "Kenyan Bill logo",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Header />

        <main id="main-content" className="site-main">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
