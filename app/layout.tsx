import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skillbridge",
  description: "AI-guided skill gap testing and sponsorship pathways for candidates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
