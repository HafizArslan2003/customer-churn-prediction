'use client';
import { useState, useRef, useEffect } from 'react';
import { Mic, Send, PieChart as PieChartIcon, FileText, Plus, Minus } from 'lucide-react';

export default function AIPanel() {
  const [input, setInput] = useState('');

  return (
    <div className="bg-[#101312] rounded-[32px] p-6 flex flex-col h-[740px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#BAF91A]/10 blur-[60px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-10 z-10">
        <button className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition"><Minus size={16} /></button>
        <span className="font-medium text-white text-[15px] tracking-wide">Bostic AI</span>
        <button className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center text-gray-400 hover:text-white transition"><Plus size={16} /></button>
      </div>

      {/* Orb Container */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 mb-8">
        
        {/* 3D Orb */}
        <div className="relative mb-10" style={{ width: 190, height: 190 }}>
          {/* Main Sphere */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle at 35% 25%, #E2FF99 0%, #BAF91A 30%, #10b981 60%, #064e3b 90%)',
            boxShadow: '0 10px 40px rgba(186,249,26,0.3), inset -15px -15px 30px rgba(0,0,0,0.5), inset 15px 15px 20px rgba(255,255,255,0.4)'
          }}></div>
          {/* Cyan Highlight / Reflection */}
          <div className="absolute inset-0 rounded-full opacity-60 mix-blend-screen" style={{
            background: 'radial-gradient(ellipse at 75% 75%, #06b6d4 0%, transparent 50%)'
          }}></div>
          {/* White Gloss */}
          <div className="absolute top-2 left-4 w-[140px] h-[70px] rounded-[50%] opacity-30 transform -rotate-12" style={{
            background: 'linear-gradient(180deg, white, transparent)'
          }}></div>
          
          {/* Floating Particles */}
          <div className="absolute top-4 left-0 w-1.5 h-1.5 bg-[#BAF91A] rounded-full blur-[1px]"></div>
          <div className="absolute bottom-8 right-0 w-2 h-2 bg-[#06b6d4] rounded-full blur-[1px]"></div>
          <div className="absolute top-1/2 -right-4 w-1.5 h-1.5 bg-white rounded-full blur-[1px]"></div>
        </div>

        <p className="text-gray-300 text-[15px] text-center font-medium">How can I assist you today?</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5 z-10">
        <button className="bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.06] transition shadow-sm">
          <PieChartIcon size={20} className="text-[#BAF91A]" />
          <span className="text-white text-[13px] font-medium">Pro Analysis</span>
        </button>
        <button className="bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.06] transition shadow-sm">
          <FileText size={20} className="text-[#BAF91A]" />
          <span className="text-white text-[13px] font-medium">Report</span>
        </button>
      </div>

      {/* Input */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-full p-1.5 flex items-center z-10 mt-auto">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything..." 
          className="bg-transparent border-none outline-none text-[13px] text-white px-4 flex-1 placeholder-gray-500 font-medium"
        />
        <button className="p-2.5 text-white hover:text-[#BAF91A] transition"><Send size={16} /></button>
        <button className="p-2.5 rounded-full transition ml-1 bg-white/[0.08] text-white hover:bg-white/[0.15]">
          <Mic size={16} />
        </button>
      </div>
    </div>
  );
}
