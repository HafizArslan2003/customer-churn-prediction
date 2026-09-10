'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, ChevronDown, MicOff, Plus, Send, Sparkles, Volume2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type Message = { id: number; role: 'user' | 'assistant'; content: string; error?: boolean };
const quickActions = [{ label: 'Analyze churn', question: 'Give me the current churn overview and the most important insight.' }, { label: 'High-risk customers', question: 'Show me the highest risk customers.' }, { label: 'Explain model', question: 'What model are we using and how is it performing?' }, { label: "Today's insights", question: 'What should the retention team focus on today?' }];

export default function AIPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const messageId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  function speak(text: string) {
    if (muted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prepareSpeechText(text));
    utterance.rate = .98; utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true); utterance.onend = () => setSpeaking(false); utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }
  function stopSpeaking() { window.speechSynthesis?.cancel(); setSpeaking(false); }
  function newChat() { stopSpeaking(); setMessages([]); setInput(''); }
  async function askAssistant(event: FormEvent, questionOverride?: string) {
    event.preventDefault(); const question = (questionOverride ?? input).trim(); if (!question || loading) return;
    const userMessage = { id: ++messageId.current, role: 'user' as const, content: question }; setMessages((current) => [...current, userMessage]); setInput(''); setLoading(true); stopSpeaking();
    try { const payload = await apiFetch<{ response?: string; detail?: string }>('/chat', { method: 'POST', body: JSON.stringify({ question, context: { current_page: 'dashboard' } }) }); const answer = payload.response ?? payload.detail ?? 'The assistant could not answer that.'; setMessages((current) => [...current, { id: ++messageId.current, role: 'assistant', content: answer }]); speak(answer); }
    catch { setMessages((current) => [...current, { id: ++messageId.current, role: 'assistant', content: 'The churn service is unavailable. Check the API connection and try again.', error: true }]); }
    finally { setLoading(false); }
  }
  const state = loading ? 'thinking' : speaking ? 'speaking' : messages.some((message) => message.error) ? 'error' : 'idle';
  if (collapsed) return <section className="ai-collapsed panel"><div><Sparkles size={16} /> <strong>InsightOS AI</strong><small>Ask about live churn intelligence</small></div><button className="ai-icon-button" onClick={() => setCollapsed(false)} aria-label="Expand InsightOS AI"><ChevronDown size={17} /></button></section>;
  return <section className={`ai-panel ${state}`}><div className="ai-panel-head"><div className="ai-brand"><span className="ai-brand-mark"><BrainCircuit size={16} /></span><span><strong>InsightOS AI</strong><small>Live churn intelligence</small></span></div><div className="ai-head-actions"><button className="ai-icon-button" onClick={() => setCollapsed(true)} aria-label="Minimize assistant"><ChevronDown size={17} /></button><button className="ai-icon-button" onClick={newChat} aria-label="Start new chat"><Plus size={17} /></button></div></div><div className="ai-orb-wrap"><div className="ai-orb-scene" aria-label={`AI assistant ${state}`}><div className="ai-orb-halo" /><div className="ai-orb-ring ai-orb-ring-one" /><div className="ai-orb-ring ai-orb-ring-two" /><div className="ai-orb-core"><div className="ai-orb-wave" /><div className="ai-orb-gloss" /></div><i className="ai-orb-particle particle-one" /><i className="ai-orb-particle particle-two" /><i className="ai-orb-particle particle-three" /></div><span className="ai-state-label">{loading ? 'Analyzing live signals' : speaking ? 'Speaking' : 'Ready when you are'}</span></div><div className="ai-messages">{messages.length === 0 && <div className="ai-welcome"><strong>Ask sharper questions.</strong><span>I can search customers, explain risk, and read current model performance.</span></div>}{messages.map((message) => <div className={`ai-message-bubble ${message.role} ${message.error ? 'error' : ''}`} key={message.id}>{message.role === 'assistant' ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}</div>)}{loading && <div className="ai-message-bubble assistant ai-loading"><span /><span /><span /></div>}<div ref={endRef} /></div><div className="ai-quick-actions">{quickActions.map((action) => <button key={action.label} onClick={(event) => askAssistant(event, action.question)} disabled={loading}>{action.label}</button>)}</div><form onSubmit={askAssistant} className="ai-composer"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about live churn data..." aria-label="Ask InsightOS AI" /><button type="submit" aria-label="Send question" disabled={loading}><Send size={16} /></button><button type="button" onClick={() => { if (speaking) stopSpeaking(); else setMuted((value) => !value); }} className={muted ? 'muted' : ''} aria-label={speaking ? 'Stop speaking' : muted ? 'Enable speech' : 'Mute speech'}>{speaking ? <X size={15} /> : muted ? <MicOff size={15} /> : <Volume2 size={15} />}</button></form></section>;
}

export function prepareSpeechText(text: string) {
  return text.replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ').replace(/[#*_>`|]/g, ' ').replace(/^\s*[-+•]\s*/gm, '').replace(/^\s*\d+[.)]\s*/gm, '').replace(/[{}[\]":]/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/\s+/g, ' ').trim();
}
