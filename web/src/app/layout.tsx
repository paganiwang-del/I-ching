import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Professional LiuYao - 網頁版",
  description: "專業六爻排盤系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <div className="ink-canvas">
          <div className="ink-cloud cloud-1"></div>
          <div className="ink-cloud cloud-2"></div>
          <div className="ink-cloud cloud-3"></div>
          <div className="water-waves">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
          </div>
          <div className="bird bird-1"></div>
          <div className="bird bird-2"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
