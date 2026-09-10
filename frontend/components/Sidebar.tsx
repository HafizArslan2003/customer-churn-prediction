'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Settings, HelpCircle, ClipboardCheck, Users, BrainCircuit, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const navItem = (href: string, label: string, Icon: typeof Home) => (
    <Link href={href} onClick={() => setMobileOpen(false)} className={`premium-nav-item ${pathname === href ? 'active' : ''}`}>
      <Icon size={18} className={pathname === href ? 'text-[#BAF91A]' : ''} />
      {label}
    </Link>
  );

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="mb-7 flex items-center gap-3 border-b border-[#eef0f3] pb-7 pl-0.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#101312]">
          <div className="w-3 h-3 bg-[#BAF91A] rounded-sm transform rotate-45"></div>
        </div>
        <span className="text-[27px] font-bold tracking-[-0.06em] text-[#101312]">InsightOS</span>
        <button className="mobile-menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      
      <p className="sidebar-label">Main</p>
      
      <nav className="sidebar-nav">
        {navItem('/', 'Dashboard', Home)}
        {navItem('/assessment', 'Risk Assessment', ClipboardCheck)}
        {navItem('/customers', 'Customers', Users)}
        {navItem('/reports', 'Analytics & Reports', BarChart2)}
        {navItem('/model-insights', 'Model Insights', BrainCircuit)}
      </nav>

      <p className="sidebar-label">Other</p>
      
      <nav className="flex flex-col space-y-1">
        {navItem('/settings', 'Settings', Settings)}
        {navItem('/help', 'Help', HelpCircle)}
      </nav>

    </aside>
  );
}
