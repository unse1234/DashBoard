import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionRestorer } from "@/components/auth/session-restorer"
import { QueryProvider } from "@/components/shared/query-provider"
import { Toaster } from "@/components/ui/sonner"
import { APP_NAME } from "@/lib/app.constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: "Dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <SessionRestorer />
          {children}
        </QueryProvider>
        {/* Here rather than in the dashboard layout, so a toast fired while leaving
            the dashboard (e.g. a failed logout) still has somewhere to appear. */}
        <Toaster />
      </body>
    </html>
  );
}
