import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";
import ThemeSync from "../components/ThemeSync";
import AppShell from "../components/AppShell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap"
});

export const metadata = {
  title: "Layer",
  description: "Gestionnaire de taches PWA rapide et instalable",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  }
};

export const viewport = {
  themeColor: "#0f172a"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={spaceGrotesk.variable}>
        <ServiceWorkerRegistration />
        <ThemeSync />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
