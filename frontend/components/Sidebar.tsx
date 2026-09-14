'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  ClipboardCheck,
  Users,
  BrainCircuit,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItem = (
    href: string,
    label: string,
    Icon: typeof Home
  ) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

    return (
      <Link
        href={href}
        className={`premium-nav-item ${active ? 'active' : ''}`}
      >
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="mb-7 flex items-center gap-3 border-b border-[#eef0f3] pb-7 pl-0.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#101312]">
          <div className="h-3 w-3 rotate-45 rounded-sm bg-[#BAF91A]" />
        </div>

        <span className="text-[27px] font-bold tracking-[-0.06em] text-[#101312]">
          RetainIQ
        </span>
      </div>

      {/* Main */}
      <p className="sidebar-label">Main</p>

      <nav className="sidebar-nav">
        {navItem('/', 'Dashboard', Home)}
        {navItem('/retention', 'Retention Tasks', ClipboardCheck)}
        {navItem('/assessment', 'Risk Assessment', ClipboardCheck)}
        {navItem('/reports', 'Analytics & Reports', BarChart2)}
        {navItem('/customers', 'Customers', Users)}
        {navItem('/model-insights', 'Model Insights', BrainCircuit)}
      </nav>

      {/* Other */}
      <p className="sidebar-label">Other</p>

      <nav className="sidebar-nav">
        {navItem('/settings', 'Settings', Settings)}
        {navItem('/help', 'Help', HelpCircle)}
      </nav>

      {/* Logout */}
      <div className="mt-auto">
        <button
          type="button"
          className="premium-nav-item w-full border-0 bg-transparent text-left"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
