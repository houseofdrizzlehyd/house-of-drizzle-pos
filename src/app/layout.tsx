import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "House of Drizzle",
  description: "Handcrafted desserts, thick shakes, Belgian waffles, ice creams, cake bowls and cheesecakes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
