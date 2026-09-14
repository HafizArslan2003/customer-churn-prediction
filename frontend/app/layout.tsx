import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'RetainIQ - Customer Retention Intelligence',
  description: 'AI-powered customer churn prediction and retention automation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="app-frame"><AppHeader /><main className="app-main">{children}</main></div>
      </body>
    </html>
  );
}
