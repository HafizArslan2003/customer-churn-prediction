'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, ChevronDown, MicOff, Plus, Send, Sparkles, Volume2, X } from 'lucide-react';
import { apiFetch, Customer, Summary } from '@/lib/api';

type AssistantPayload = { type?: 'message' | 'analytics' | 'customer_list' | 'customer' | 'model'; response?: string; title?: string; data?: unknown; detail?: string };
type Message = { id: number; role: 'user' | 'assistant'; content: string; payload?: AssistantPayload; error?: boolean };
type SpeechRecognitionInstance = { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; stop: () => void; onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
const quickActions = [{ label: 'Analyze churn', question: 'Give me the current churn overview and the most important insight.' }, { label: 'High-risk customers', question: 'Show me the highest risk customers.' }, { label: 'Explain model', question: 'What model are we using and how is it performing?' }, { label: "Today's insights", question: 'What should the retention team focus on today?' }];

export default function AIPanel() {
  const pathname = usePathname();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
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
  function toggleVoice() {
    if (listening) { setListening(false); return; }
    const SpeechRecognition = (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setMessages((current) => [...current, { id: ++messageId.current, role: 'assistant', content: 'Voice input is not supported in this browser. Try Chrome or Edge.' }]); return; }
    const recognition = new SpeechRecognition(); recognition.lang = 'en-US'; recognition.interimResults = false; recognition.maxAlternatives = 1; setListening(true);
    recognition.onresult = (event) => { const transcript = event.results[0][0].transcript.trim(); setInput(transcript); void askAssistant({ preventDefault: () => undefined } as FormEvent, transcript); };
    recognition.onerror = () => setListening(false); recognition.onend = () => setListening(false); recognition.start();
  }
  function newChat() { stopSpeaking(); setMessages([]); setInput(''); }
  async function askAssistant(event: FormEvent, questionOverride?: string) {
    event.preventDefault(); const question = (questionOverride ?? input).trim(); if (!question || loading) return;
    const userMessage = { id: ++messageId.current, role: 'user' as const, content: question }; setMessages((current) => [...current, userMessage]); setLoading(true); stopSpeaking();
    try { const customerId = pathname.match(/^\/customers\/(\d+)/)?.[1]; const payload = await apiFetch<AssistantPayload>('/chat', { method: 'POST', body: JSON.stringify({ question, context: { current_page: pathname === '/' ? 'dashboard' : pathname.slice(1), customer_id: customerId ? Number(customerId) : undefined } }) }); const answer = payload.response ?? payload.detail ?? payload.title ?? 'Live data retrieved.'; setMessages((current) => [...current, { id: ++messageId.current, role: 'assistant', content: answer, payload }]); speak(answer); }
    catch { setMessages((current) => [...current, { id: ++messageId.current, role: 'assistant', content: 'The churn service is unavailable. Check the API connection and try again.', error: true }]); }
    finally { setLoading(false); setInput(''); }
  }
  const state = loading ? 'thinking' : listening ? 'listening' : speaking ? 'speaking' : messages.some((message) => message.error) ? 'error' : 'idle';
  if (collapsed) return <section className="ai-collapsed panel"><div><Sparkles size={16} /> <strong>InsightOS AI</strong><small>Ask about live churn intelligence</small></div><button className="ai-icon-button" onClick={() => setCollapsed(false)} aria-label="Expand InsightOS AI"><ChevronDown size={17} /></button></section>;
  return <section className={`ai-panel ${state}`}><div className="ai-panel-head"><div className="ai-brand"><span className="ai-brand-mark"><BrainCircuit size={16} /></span><span><strong>InsightOS AI</strong><small>Live churn intelligence</small></span></div><div className="ai-head-actions"><button className="ai-icon-button" onClick={() => setCollapsed(true)} aria-label="Minimize assistant"><ChevronDown size={17} /></button><button className="ai-icon-button" onClick={newChat} aria-label="Start new chat"><Plus size={17} /></button></div></div><div className="ai-orb-wrap"><div className="ai-orb-scene" aria-label={`AI assistant ${state}`}><div className="ai-orb-halo" /><div className="ai-orb-ring ai-orb-ring-one" /><div className="ai-orb-ring ai-orb-ring-two" /><div className="ai-orb-core"><div className="ai-orb-wave" /><div className="ai-orb-gloss" /></div><i className="ai-orb-particle particle-one" /><i className="ai-orb-particle particle-two" /><i className="ai-orb-particle particle-three" /></div><span className="ai-state-label">{loading ? 'Analyzing live signals' : listening ? 'Listening for your question' : speaking ? 'Speaking' : 'Ready when you are'}</span></div><div className="ai-messages">{messages.length === 0 && <div className="ai-welcome"><strong>Ask sharper questions.</strong><span>I can search customers, explain risk, and read current model performance.</span></div>}{messages.map((message) => <div className={`ai-message-bubble ${message.role} ${message.error ? 'error' : ''}`} key={message.id}>{message.role === 'assistant' ? <AssistantResponse message={message} /> : message.content}</div>)}{loading && <div className="ai-message-bubble assistant ai-loading"><span /><span /><span /></div>}<div ref={endRef} /></div>{messages.length === 0 && !loading && <div className="ai-quick-actions">{quickActions.map((action) => <button key={action.label} onClick={(event) => askAssistant(event, action.question)} disabled={loading || listening}>{action.label}</button>)}</div>}<form onSubmit={askAssistant} className="ai-composer"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about live churn data..." aria-label="Ask InsightOS AI" /><button type="submit" aria-label="Send question" disabled={loading}><Send size={16} /></button><button type="button" onClick={toggleVoice} className={listening ? 'voice-active' : ''} aria-label={listening ? 'Stop listening' : 'Start voice input'}>{listening ? <X size={15} /> : <MicOff size={15} />}</button><button type="button" onClick={() => { if (speaking) stopSpeaking(); else setMuted((value) => !value); }} className={muted ? 'muted' : ''} aria-label={speaking ? 'Stop speaking' : muted ? 'Enable speech' : 'Mute speech'}>{speaking ? <X size={15} /> : muted ? <MicOff size={15} /> : <Volume2 size={15} />}</button></form></section>;
}

function AssistantResponse({ message }: { message: Message }) {
  const payload = message.payload;
  if (!payload?.type || payload.type === 'message') return <ReactMarkdown>{message.content}</ReactMarkdown>;
  if (payload.type === 'analytics') { const data = payload.data as Summary; if (!data || typeof data.total_customers !== 'number') return <ReactMarkdown>{message.content}</ReactMarkdown>; return <div className="ai-structured"><strong>{payload.title || 'Churn overview'}</strong><div className="ai-metrics"><span>Total<strong>{data.total_customers.toLocaleString()}</strong></span><span>High risk<strong>{data.high_risk_count}</strong></span><span>Average<strong>{(data.avg_churn_probability * 100).toFixed(1)}%</strong></span></div></div>; }
  if (payload.type === 'customer_list') { const data = payload.data as { items?: Customer[]; total?: number }; return <div className="ai-structured"><strong>{payload.title || 'Customers'}</strong>{data.items?.length ? <div className="ai-customer-results">{data.items.map((customer) => <Link href={`/customers/${customer.id}`} key={customer.id}><span>{customer.name || `Customer #${customer.id}`}<small>{customer.churn_probability == null ? 'Unassessed' : `${(customer.churn_probability * 100).toFixed(1)}%`}</small></span><b className={`risk-badge risk-${customer.risk_level || 'low'}`}>{customer.risk_level || 'unassessed'}</b></Link>)}</div> : <p>No matching assessed customers were found.</p>}</div>; }
  if (payload.type === 'customer') { const customer = payload.data as Customer; return <div className="ai-structured"><strong>{customer.name || `Customer #${customer.id}`}</strong><p><b>{customer.churn_probability == null ? 'Unassessed' : `${(customer.churn_probability * 100).toFixed(1)}% churn probability`}</b> · {customer.risk_level || 'unassessed'} risk</p>{customer.top_reasons?.slice(0, 3).map((reason) => <small className="ai-reason" key={reason}>{reason}</small>)}<Link href={`/customers/${customer.id}`} className="ai-view-link">View customer</Link></div>; }
  if (payload.type === 'model') { const data = payload.data as { model_name: string; metrics: Record<string, number>; features: string[] }; return <div className="ai-structured"><strong>{data.model_name}</strong><div className="ai-metrics"><span>Accuracy<strong>{(data.metrics.accuracy * 100).toFixed(1)}%</strong></span><span>F1 score<strong>{(data.metrics.f1 * 100).toFixed(1)}%</strong></span></div><small>{data.features?.length || 0} live model features</small></div>; }
  return <ReactMarkdown>{message.content}</ReactMarkdown>;
}

export function prepareSpeechText(text: string) {
  return text.replace(/```[\s\S]*?```/g, ' ').replace(/\|/g, ' ').replace(/^\s*[-+|\s]+$/gm, ' ').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ').replace(/[#*_>`]/g, ' ').replace(/^\s*[-+•]\s*/gm, '').replace(/^\s*\d+[.)]\s*/gm, '').replace(/[{}[\]":]/g, ' ').replace(/https?:\/\/\S+/g, ' ').replace(/\s+/g, ' ').trim();
}
