import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mealdesk",
  description: "Add meal entries, track the week, and keep payments in sync.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrains.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
