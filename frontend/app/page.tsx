'use client';
import { Search, Moon, Sun, Bell, Calendar, SlidersHorizontal, DollarSign, TrendingUp, Users, ChevronDown, Info, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import AIPanel from '@/components/AIPanel';

export default function Dashboard() {
  const pieData = [
    { name: 'Leads', value: 344, color: '#6366f1' },    // Blue/Purple
    { name: 'Revenue', value: 256, color: '#06b6d4' },  // Cyan
    { name: 'AUsqits', value: 128, color: '#BAF91A' },  // Lime
  ];

  const tableData = [
    { name: 'Quinta Starter', region: 'USA', score: '88%', risk: 2, lead: '+8,000', value: '+$48,569.00', color: '#000000', gradient: ['#10b981', '#064e3b'] },
    { name: 'Nova Enterprise', region: 'Canada', score: '76%', risk: 4, lead: '+6,320', value: '+$32,410.00', color: '#000000', gradient: ['#6366f1', '#4338ca'] },
    { name: 'TechFlow Inc', region: 'UK', score: '92%', risk: 1, lead: '+12,400', value: '+$84,200.00', color: '#000000', gradient: ['#f59e0b', '#b45309'] },
    { name: 'Aero Dynamics', region: 'Germany', score: '64%', risk: 6, lead: '+3,100', value: '+$18,900.00', color: '#000000', gradient: ['#ef4444', '#b91c1c'] },
  ];

  return (
    <div className="min-h-full w-full px-6 pb-8 pt-0 xl:px-8">
      {/* ─── Top Bar (Full Width) ─── */}
      <header className="-mx-6 mb-7 flex w-[calc(100%+48px)] items-center justify-between gap-5 border-b border-[#e7e9ee] bg-white px-6 py-5 shadow-[0_3px_14px_rgba(20,24,36,0.025)] xl:-mx-8 xl:w-[calc(100%+64px)] xl:px-8">
        {/* Search Bar */}
        <div className="relative w-[min(620px,48vw)] max-w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text" 
            placeholder="Search" 
            className="w-full rounded-full border border-[#e7e9ee] bg-white py-3 pl-12 pr-28 text-[15px] font-medium text-gray-700 outline-none shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#BAF91A]/20 text-[#101312] text-[12px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
            ⌘ <span className="font-semibold">+ Space</span>
          </span>
        </div>

        {/* Right side icons & profile */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-[#e7e9ee] bg-white p-1 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <button className="p-2.5 rounded-full text-gray-400 hover:bg-gray-50 transition"><Moon size={18} /></button>
            <button className="p-2.5 rounded-full bg-[#BAF91A] shadow-sm"><Sun size={18} className="text-[#101312]"/></button>
          </div>
          <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#e7e9ee] bg-white shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition hover:bg-gray-50">
            <Bell size={20} className="text-[#101312]" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#101312] rounded-full border-2 border-white"></span>
          </button>
          <div className="flex cursor-pointer items-center gap-3 rounded-full border border-[#e7e9ee] bg-white py-1.5 pl-1.5 pr-3 shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition hover:bg-gray-50">
            <img src="https://i.pravatar.cc/150?u=ryan" alt="Ryan Foster" className="w-10 h-10 rounded-full object-cover" />
            <div className="pr-2">
              <p className="text-[14px] font-bold text-[#101312] leading-tight">Ryan Foster</p>
              <p className="text-[12px] text-gray-500 font-medium">@ryan_foster</p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </header>

      {/* ─── Content Area (2 Columns) ─── */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        
        {/* Left Column */}
        <div className="flex-1 min-w-0">
          
          {/* Title Row */}
          <div className="mt-1 mb-4 flex items-center justify-between gap-4">
            <h1 className="text-[40px] font-bold leading-none tracking-[-0.06em] text-[#101312]">Your Analytical Board</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-2xl border border-[#e7e9ee] bg-white px-5 py-3 text-[14px] font-semibold text-[#101312] shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition hover:bg-gray-50">
                <Calendar size={18} /> Select Date
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e7e9ee] bg-white shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition hover:bg-gray-50">
                <SlidersHorizontal size={18} className="text-[#101312]" />
              </button>
            </div>
          </div>

          {/* Smart Sales Distribution Card */}
          <div className="card-dark mb-4 rounded-[24px] p-6 shadow-[0_16px_30px_rgba(0,0,0,0.1)]">
            <div className="mb-6">
              <h2 className="text-[22px] font-semibold text-white mb-2">Smart Sales Distribution</h2>
              <p className="text-[14px] text-gray-400 font-medium">AI-enhanced sales metrics showing growth in leads, revenue, and overall performance.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.04] p-5 backdrop-blur-md">
                <div className="flex items-center gap-3 text-white text-[14px] font-medium mb-5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <DollarSign size={16} className="text-gray-300" />
                  </div>
                  Total Income
                </div>
                <div className="text-[38px] font-semibold text-white leading-none tracking-tight">56,000.00 <span className="text-[24px] text-gray-400 font-medium">$</span></div>
              </div>
              
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.04] p-5 backdrop-blur-md">
                <div className="flex items-center gap-3 text-white text-[14px] font-medium mb-5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-gray-300" />
                  </div>
                  ROI
                </div>
                <div className="text-[38px] font-semibold text-white leading-none tracking-tight">+312 <span className="text-[24px] text-gray-400 font-medium">%</span></div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.04] p-5 backdrop-blur-md">
                <div className="flex items-center gap-3 text-white text-[14px] font-medium mb-5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Users size={16} className="text-gray-300" />
                  </div>
                  Daily Active Users
                </div>
                <div className="text-[38px] font-semibold text-white leading-none tracking-tight">12,846</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="mb-4 grid h-[286px] grid-cols-2 gap-3">
            {/* Sales Analysis Card */}
            <div className="relative flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.025)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-bold flex items-center gap-3 text-[#101312]">
                  <div className="w-7 h-7 rounded-full bg-[#BAF91A]/20 flex items-center justify-center">
                    <PieChartIcon size={14} className="text-[#101312]" />
                  </div>
                  Sales Analysis
                </h3>
                <button className="flex items-center gap-1 text-[13px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100">
                  01-07 Jan <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex flex-1 items-center gap-3">
                <div className="relative shrink-0" style={{ width: 178, height: 178 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Hatched pattern overlay for a segment */}
                  <div className="absolute inset-0 pointer-events-none rounded-full" style={{
                    clipPath: 'polygon(0 0, 50% 50%, 0 100%, 0 0)',
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(186,249,26,0.3) 4px, rgba(186,249,26,0.3) 6px)',
                    zIndex: 10
                  }}></div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <span className="text-[24px] font-bold text-[#101312] tracking-tight">$728,000</span>
                    <span className="text-[11px] text-gray-400 font-medium">Total Revenue</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span>
                      <span className="text-[15px] font-bold text-[#101312]">344 <span className="font-medium text-gray-400 text-[13px]">Leads</span></span>
                    </div>
                    <p className="text-[14px] font-bold text-[#101312] ml-4.5">47%</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
                      <span className="text-[15px] font-bold text-[#101312]">256 <span className="font-medium text-gray-400 text-[13px]">Revenue</span></span>
                    </div>
                    <p className="text-[14px] font-bold text-[#101312] ml-4.5">35%</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#BAF91A]"></span>
                      <span className="text-[15px] font-bold text-[#101312]">128 <span className="font-medium text-gray-400 text-[13px]">AUsqits</span></span>
                    </div>
                    <p className="text-[14px] font-bold text-[#101312] ml-4.5">18%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-4">
                <Info size={14} /> Calculated from aggregated activity for the selected period
              </div>
            </div>

            {/* Deal Analysis Card */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[#e2ff99] p-4">
              <div className="z-10 mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-bold flex items-center gap-3 text-[#101312]">
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                    <BarChart2 size={14} className="text-[#101312]" />
                  </div>
                  Deal Analysis
                </h3>
                <button className="flex items-center gap-1 text-[13px] font-bold text-gray-700 bg-white/60 px-3 py-1.5 rounded-full hover:bg-white/80">
                  01-07 Jan <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex-1 relative z-10 w-full mt-4">
                {/* Diagonal stripes block */}
                <div className="absolute left-0 bottom-0 w-[45%] h-[80%] rounded-2xl" style={{
                  background: 'repeating-linear-gradient(45deg, rgba(186,249,26,0.6), rgba(186,249,26,0.6) 8px, transparent 8px, transparent 16px)',
                  backgroundColor: '#BAF91A'
                }}></div>
                {/* Dark block */}
                <div className="absolute right-[25%] bottom-0 w-[28%] h-[35%] bg-[#101312] rounded-2xl shadow-lg"></div>
                {/* White block */}
                <div className="absolute right-0 bottom-0 w-[20%] h-[60%] bg-white rounded-2xl shadow-sm"></div>

                {/* Floating Labels */}
                <div className="absolute left-0 top-[5%] bg-white px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-sm">
                  Won Deals <span className="ml-1 text-[14px]">6K</span>
                </div>
                <div className="absolute right-[5%] top-[25%] bg-white px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-sm text-gray-600">
                  AI Improved <span className="ml-1 text-[14px] text-[#101312]">4K</span>
                </div>
                <div className="absolute right-[35%] top-[50%] bg-white px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-sm text-gray-600">
                  Lost Deals <span className="ml-1 text-[14px] text-[#101312]">2K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table: Top Opportunities */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.025)] xl:w-[calc(100%+406px)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[18px] font-bold flex items-center gap-3 text-[#101312]">
                <div className="w-7 h-7 rounded-full bg-[#BAF91A]/20 flex items-center justify-center">
                  <span className="w-3.5 h-3.5 border-t-2 border-l-2 border-[#101312] rounded-sm transform rotate-45"></span>
                </div>
                Top opportunities
              </h3>
              <button className="flex items-center gap-1 text-[13px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-100">
                Month <ChevronDown size={14} />
              </button>
            </div>
            
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-[12px] text-left border-b border-gray-100">
                  <th className="pb-4 font-semibold pl-2">Name</th>
                  <th className="pb-4 font-semibold">Region</th>
                  <th className="pb-4 font-semibold text-center">AI Success Score</th>
                  <th className="pb-4 font-semibold text-center">Risks Level</th>
                  <th className="pb-4 font-semibold text-right">Lead Increase</th>
                  <th className="pb-4 font-semibold text-right pr-2">Account Value</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 pl-2">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${row.gradient[0]}, ${row.gradient[1]})` }}></div>
                        <span className="font-bold text-[14px] text-[#101312]">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-5 text-[#101312] text-[14px] font-semibold">{row.region}</td>
                    <td className="py-5 font-bold text-[14px] text-[#101312] text-center">{row.score}</td>
                    <td className="py-5 text-center">
                      <div className="flex gap-[3px] justify-center">
                        {[...Array(10)].map((_, i) => {
                          // The segmented bar from the image. Let's make it green/blue based on the image.
                          const isFilled = i < (10 - row.risk);
                          return (
                            <div 
                              key={i} 
                              className="w-[7px] h-[18px] rounded-[4px]"
                              style={{ background: isFilled ? (idx === 1 ? '#6366f1' : '#BAF91A') : '#F3F4F6' }}
                            ></div>
                          )
                        })}
                      </div>
                    </td>
                    <td className="py-5 font-semibold text-[14px] text-gray-500 text-right">{row.lead}</td>
                    <td className="py-5 font-bold text-[14px] text-[#101312] text-right pr-2">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (AI Panel) */}
        <div className="mt-[64px] w-full xl:w-[390px]">
          <AIPanel />
        </div>
      </div>
    </div>
  );
}
