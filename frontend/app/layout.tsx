import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'InsightOS - Analytical Board',
  description: 'AI-enhanced sales analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="m-0 bg-[#f1f2ff] p-0">
        <div className="m-[22px] flex min-h-[calc(100vh-44px)] overflow-hidden rounded-[18px] border border-white/70 bg-[#f8f8fa] shadow-[0_18px_55px_rgba(70,72,140,0.12)] max-[760px]:m-0 max-[760px]:min-h-screen max-[760px]:rounded-none">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
