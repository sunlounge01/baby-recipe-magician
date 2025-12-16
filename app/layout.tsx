import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const zen = Zen_Maru_Gothic({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "幼兒食譜魔法 - 為寶寶準備營養美味的每一餐",
  description: "智能食譜推薦系統，根據寶寶年齡和營養需求，為您推薦最適合的食譜。輸入家中現有食材，立即生成創意食譜建議。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${zen.variable} antialiased text-[#4A3B32]`}
      >
        {children}
      </body>
    </html>
  );
}
