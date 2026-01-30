import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sample GitOps Web",
  description: "Trang mẫu Next.js để học luồng GitOps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
