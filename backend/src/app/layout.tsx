import { type Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

import "~/styles/globals.css";

export const metadata: Metadata = {
  title: "快灵感管理后台",
  description: "快灵感小程序管理后台 - 用户、笔记、数据统计管理",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${playfair.variable} ${sourceSans.variable}`}
    >
      <body className="min-h-screen bg-[#faf9f7] antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
