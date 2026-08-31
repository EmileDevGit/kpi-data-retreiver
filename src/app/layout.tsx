// app/layout.tsx
import { Instrument_Sans } from "next/font/google";
import { Header } from "@/components/navigation/header";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${instrument.variable} font-(family-name:--font-body) bg-[#F6F2E8]`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
