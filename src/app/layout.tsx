import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Rydvanta Transit — Every route. Reliably booked.",
  description:
    "Premium Bus Booking & Transit Management System. Real-time seat selection, instant confirmation, PostgreSQL concurrency control, and zero double-booking guarantee.",
  keywords: [
    "bus booking",
    "Rydvanta",
    "transit management",
    "intercity bus",
    "seat reservation",
    "live manifest",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8F4EC] text-charcoal antialiased selection:bg-terracotta selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
