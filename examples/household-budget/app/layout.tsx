import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '家計簿アプリ - Liquid Protocol Demo',
  description: 'AI駆動の家計簿ダッシュボードアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="h-screen flex flex-col bg-gray-50 overflow-hidden" suppressHydrationWarning>
        <nav className="bg-white shadow-sm border-b h-16 flex-shrink-0">
          <div className="h-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-full">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  家計簿アプリ
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/transactions"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  取引一覧
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
