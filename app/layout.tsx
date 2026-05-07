import type { Metadata } from "next";
import { Nav } from "@/app/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Tracker",
  description: "A year-by-year personal travel log powered by Google Timeline imports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
