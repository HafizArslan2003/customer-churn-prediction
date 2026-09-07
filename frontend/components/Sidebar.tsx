'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PieChart, TrendingUp, Megaphone, Clock, FileText, BarChart2, Settings, HelpCircle, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 min-h-screen bg-white flex flex-col pt-8 pb-8 px-6 border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 pl-2">
        <div className="w-8 h-8 rounded-full bg-[#101312] flex items-center justify-center">
          <div className="w-3 h-3 bg-[#BAF91A] rounded-sm transform rotate-45"></div>
        </div>
        <span className="font-bold text-[22px] tracking-tight text-[#101312]">InsightOS</span>
      </div>
      
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-4 pl-3">Main</p>
      
      <nav className="flex flex-col mb-10 space-y-1">
        <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-semibold transition-all ${pathname === '/' ? 'bg-gradient-to-b from-[#1a1f1a] to-[#0a0c0b] text-white shadow-[0_4px_15px_rgba(0,0,0,0.1),inset_0_-15px_20px_-10px_rgba(186,249,26,0.3)]' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Home size={18} className={pathname === '/' ? 'text-[#BAF91A]' : ''} />
          Dashboard
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <PieChart size={18} /> Analytics
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <TrendingUp size={18} /> Sales Performance
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <Megaphone size={18} /> Campaigns
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <Clock size={18} /> Timelines
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <FileText size={18} /> Contracts
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <BarChart2 size={18} /> Reports
        </Link>
      </nav>

      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-4 pl-3">Other</p>
      
      <nav className="flex flex-col space-y-1">
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <Settings size={18} /> Settings
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium text-gray-500 hover:bg-gray-50 transition-all">
          <HelpCircle size={18} /> Help
        </Link>
      </nav>

      <div className="mt-auto">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-[14px] font-medium text-gray-500 hover:text-gray-800 transition-all">
          <LogOut size={18} /> Log out
        </button>
      </div>
    </aside>
  );
}
