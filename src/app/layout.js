import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Loading Inter for the main UI (Professional & Clean)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Loading a Mono font for code or ID numbers if needed
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Aura HRMS - Next Gen HR",
  description: "A premium Human Resource Management System built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}