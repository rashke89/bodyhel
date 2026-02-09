import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "BodyHel - Digitalno zdravstvo na dohvat ruke",
  description:
    "Modernа web-bazirana platforma za upravljanje zdravstvom i pružanje digitalnih zdravstvenih usluga",
  keywords:
    "zdravstvo, telemedicina, EHR, elektronski zdravstveni karton, pacijent portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
