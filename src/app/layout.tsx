import { Geist, Geist_Mono } from "next/font/google";
import SupabaseProvider from "../lib/supabase-provider";
import { CronProvider } from "../lib/cron-provider";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${geistSans.className} ${geistMono.className} font-sans min-h-screen`}>
        <SupabaseProvider>
          <CronProvider>
            {children}
          </CronProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}