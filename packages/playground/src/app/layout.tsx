/**
 * Root Layout
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Liquid Playground",
  description: "AI-driven Server-Driven UI Playground",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
