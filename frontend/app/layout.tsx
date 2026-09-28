import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "CarbonChain",
  description: "Carbon-credit marketplace on Polygon Amoy",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">CarbonChain</Link>
          <Link href="/cultivator">Cultivator</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/explorer">Explorer</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
