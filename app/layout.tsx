import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "winglab.openai.site";
  const protocol =
    incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  return {
    metadataBase,
    title: {
      default: "WingLab — Interactive Aerodynamic Wing Analysis",
      template: "%s · WingLab",
    },
    description:
      "A transparent, educational wing-design simulator for preliminary lift, drag, stall, Reynolds-number, and efficiency estimates.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "WingLab — Shape a wing. See the physics.",
      description:
        "Interactive preliminary wing analysis with transparent assumptions and uncertainty.",
      type: "website",
      images: [{ url: new URL("/og.png", metadataBase).toString(), width: 1733, height: 907, alt: "WingLab — Shape a wing. See the physics." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "WingLab — Shape a wing. See the physics.",
      description:
        "Interactive preliminary wing analysis with transparent assumptions and uncertainty.",
      images: [new URL("/og.png", metadataBase).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
