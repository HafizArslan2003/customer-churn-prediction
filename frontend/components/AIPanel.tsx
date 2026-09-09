'use client';

import { FormEvent, useState } from 'react';
import { Mic, Send, PieChart as PieChartIcon, FileText, Plus, Minus, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export default function AIPanel() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  function speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function askAssistant(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setLoading(true); setReply('');
    try {
      const response = await fetch(`${API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
      const payload = await response.json();
      const message = payload.response ?? payload.detail ?? 'Assistant abhi response nahi de saka.';
      setReply(message);
      speak(message);
    } catch {
      const message = 'The backend could not be reached. Start the FastAPI server on port 8000 and try again.';
      setReply(message);
      speak(message);
    }
    finally { setLoading(false); setInput(''); }
  }

  return (
    <section className="relative flex h-[560px] flex-col overflow-hidden rounded-[26px] bg-[#0b100e] p-5 shadow-[0_16px_30px_rgba(0,0,0,0.14)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,rgba(151,255,0,.13),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(255,255,255,.06),transparent_33%)]" />
      <div className="relative z-10 mb-2 flex items-center justify-between">
        <button aria-label="Minimize assistant" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[.04] text-slate-300"><Minus size={16} /></button>
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-white"><Sparkles size={15} className="text-[#baff1a]" /> Churn AI</span>
        <button aria-label="New chat" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[.04] text-slate-300"><Plus size={16} /></button>
      </div>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div className="ai-orb-scene mb-4" aria-label="Animated AI orb">
          <div className="ai-orb-halo" /><div className="ai-orb-ring ai-orb-ring-one" /><div className="ai-orb-ring ai-orb-ring-two" />
          <div className="ai-orb-core"><div className="ai-orb-wave" /><div className="ai-orb-gloss" /></div>
          <i className="ai-orb-particle particle-one" /><i className="ai-orb-particle particle-two" /><i className="ai-orb-particle particle-three" />
        </div>
        <p className="max-w-[260px] text-center text-[14px] font-medium text-slate-200">{loading ? 'Thinking through your customer data…' : reply || 'Ask about churn risk, customer trends, or next actions.'}</p>
      </div>
      <div className="relative z-10 mb-4 grid grid-cols-2 gap-3">
        <a href="/assessment" className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/[.12] bg-white/[.035] text-white transition hover:bg-white/[.08]"><PieChartIcon size={20} className="text-[#baff1a]" /><span className="text-[13px] font-semibold">Assessment</span></a>
        <a href="/reports" className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/[.12] bg-white/[.035] text-white transition hover:bg-white/[.08]"><FileText size={20} className="text-[#baff1a]" /><span className="text-[13px] font-semibold">Reports</span></a>
      </div>
      <form onSubmit={askAssistant} className="relative z-10 flex items-center rounded-full border border-white/[.13] bg-white/[.055] p-1.5">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask anything…" className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-medium text-white outline-none placeholder:text-slate-500" />
        <button type="submit" aria-label="Send question" className="rounded-full p-2.5 text-[#e9ffad] transition hover:bg-white/10 disabled:opacity-50" disabled={loading}><Send size={17} /></button><button type="button" aria-label="Voice input" className="rounded-full bg-white/[.1] p-2.5 text-white"><Mic size={16} /></button>
      </form>
    </section>
  );
}
