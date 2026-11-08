import type { Metadata, Viewport } from "next";
import { Anton, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { PWARegister } from "@/components/pwa-register";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";
import { MembershipGate } from "@/components/membership-gate";

const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-secondary",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#741717",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "La Vuelta Running Club",
  description:
    "Comunidad runner en Maracay. No importa tu ritmo. La vuelta se da juntos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "La Vuelta",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${inter.variable} ${outfit.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/brand/logo-round.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#741717" />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <PWARegister />
          <PushNotificationPrompt />
          <MembershipGate>{children}</MembershipGate>
        </AuthProvider>
      </body>
    </html>
  );
}
