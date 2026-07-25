import type { Metadata } from "next";
import "./globals.css";
import "./room-backgrounds.css";
import { OpeningScene } from "./OpeningScene";
import { TavernLife } from "./TavernLife";
import { CloudCellar } from "./CloudCellar";

export const metadata: Metadata = {
  title: "绯界",
  description: "绯界：承载酒馆、日记、时光之轮与更多私人故事空间。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="theme-color" content="#100709" />
      </head>
      <body>
        <OpeningScene />
        <TavernLife />
        <CloudCellar />
        {children}
      </body>
    </html>
  );
}
