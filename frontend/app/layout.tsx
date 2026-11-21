import type { Metadata } from "next";
// Self-hosted fonts: no request to Google at runtime or build time
import "@fontsource-variable/inter";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Legal AI Framework", template: "%s · Legal AI Framework" },
  description: "Secure, department-isolated AI workspace for the enterprise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
