'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Settings, HelpCircle, LogOut, ClipboardCheck, Users } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItem = (href: string, label: string, Icon: typeof Home) => (
    <Link href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-all ${pathname === href ? 'bg-gradient-to-b from-[#1a1f1a] to-[#0a0c0b] font-semibold text-white shadow-[0_4px_15px_rgba(0,0,0,0.1),inset_0_-15px_20px_-10px_rgba(186,249,26,0.3)]' : 'text-gray-500 hover:bg-gray-50'}`}>
      <Icon size={18} className={pathname === href ? 'text-[#BAF91A]' : ''} />
      {label}
    </Link>
  );

  return (
    <aside className="flex min-h-full w-[254px] shrink-0 flex-col border-r border-[#e7e9ee] bg-white px-5 py-7 shadow-[8px_0_24px_rgba(30,35,50,0.025)] max-[900px]:hidden">
      {/* Logo */}
      <div className="mb-7 flex items-center gap-3 border-b border-[#eef0f3] pb-7 pl-0.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#101312]">
          <div className="w-3 h-3 bg-[#BAF91A] rounded-sm transform rotate-45"></div>
        </div>
        <span className="text-[27px] font-bold tracking-[-0.06em] text-[#101312]">InsightOS</span>
      </div>
      
      <p className="mb-2 pl-1 text-[14px] font-medium text-slate-500">Main</p>
      
      <nav className="mb-6 flex flex-col space-y-0.5 border-b border-[#eef0f3] pb-6">
        {navItem('/', 'Dashboard', Home)}
        {navItem('/assessment', 'Risk Assessment', ClipboardCheck)}
        {navItem('/reports', 'Analytics & Reports', BarChart2)}
        {navItem('/customers', 'Customers', Users)}
      </nav>

      <p className="mb-2 pl-1 text-[14px] font-medium text-slate-500">Other</p>
      
      <nav className="flex flex-col space-y-1">
        {navItem('/settings', 'Settings', Settings)}
        {navItem('/help', 'Help', HelpCircle)}
      </nav>

      <div className="mt-auto">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-all">
          <LogOut size={18} /> Log out
        </button>
      </div>
    </aside>
  );
}
