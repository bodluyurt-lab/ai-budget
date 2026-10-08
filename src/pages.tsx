import { useState } from 'react';
import type { Page } from './types';
import type { Alert, Insight } from './types';
import { PROVIDERS, MODELS, EVENTS, DAYS, ALERTS, INSIGHTS, BUDGETS } from './data';
import type { AnalysisResult } from './intelligence';
import { analyzeUsage, getContextualAnswer } from './intelligence';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Zap, ArrowUpRight, ArrowDownRight, Cpu, Lightbulb, AlertTriangle,
  Info, CheckCircle, Loader2, ChevronRight, X, Check, Activity,
  MessageSquare, Send, Shield,
} from 'lucide-react';
import { useToast } from './ToastProvider';

/* ── helpers ── */
const fmt$ = (n: number) => `$${n.toFixed(2)}`;
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

function StatCard({ label, value, sub, trend, trendUp }: {
  label: string; value: string; sub?: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold text-zinc-100 mb-1">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Insight['severity'] }) {
  const cfg = {
    warning:     'bg-amber-500/10 text-amber-400 border-amber-500/30',
    opportunity: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    critical:    'bg-red-500/10 text-red-400 border-red-500/30',
    info:        'bg-sky-500/10 text-sky-400 border-sky-500/30',
  };
  const labels = { warning: 'Warning', opportunity: 'Opportunity', critical: 'Critical', info: 'Info' };
  return (
    <span className={`border text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${cfg[severity]}`}>
      {labels[severity]}
    </span>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="text-zinc-400 mb-1 font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-none" style={{ background: p.color || p.fill }} />
          <span className="text-zinc-300">{p.name}: <span className="font-semibold text-zinc-100">${Number(p.value).toFixed(2)}</span></span>
        </div>
      ))}
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="text-sm font-bold text-zinc-100">{title}</div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════ DASHBOARD ═══════════════ */
export function Dashboard({ onNav }: { onNav: (p: Page) => void }) {
  const { addToast } = useToast();
  const [filterProvider, setFilterProvider] = useState('all');
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [appliedInsights, setAppliedInsights] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<{ id: string; from: 'user' | 'ai'; text: string; pill?: { label: string; value: string } }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [savingsModal, setSavingsModal] = useState(false);
  const [optimizeModal, setOptimizeModal] = useState(false);

  const STEPS = ['Connecting to providers…', 'Analyzing 18,492 requests…', 'Detecting usage patterns…', 'Calculating savings…', 'Analysis complete ✓'];

  async function runAnalysis() {
    setAnalysisState('loading');
    setAnalysisStep(0);
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      setAnalysisStep(i);
    }
    await new Promise(r => setTimeout(r, 400));
    setAnalysisResult(analyzeUsage());
    setAnalysisState('done');
  }

  function applyInsight(id: string) {
    setAppliedInsights(prev => new Set([...prev, id]));
    addToast('Recommendation marked as applied (simulated)', 'success');
  }

  function sendChat(msg: string) {
    setChatMessages(prev => [...prev, { id: String(Date.now()), from: 'user', text: msg }]);
    setChatInput('');
    setTimeout(() => {
      const ans = getContextualAnswer(msg);
      setChatMessages(prev => [...prev, { id: String(Date.now() + 1), from: 'ai', text: ans.text, pill: ans.pill }]);
    }, 600);
  }

  const chartData = DAYS.slice(-14).map(d => {
    if (filterProvider === 'all') return { ...d, value: d.total, prevValue: d.prev };
    const key = filterProvider as 'openai' | 'anthropic' | 'google' | 'other';
    return { ...d, value: d[key], prevValue: +(d[key] * 0.875).toFixed(2) };
  });

  const pieData = PROVIDERS.map(p => ({ name: p.name, value: p.spend, fill: p.color }));
  const totalSpend = PROVIDERS.reduce((a, p) => a + p.spend, 0);
  const totalRequests = PROVIDERS.reduce((a, p) => a + p.requests, 0);
  const potentialSavings = INSIGHTS.reduce((a, i) => a + i.savings, 0);

  const QUESTIONS = ['Why did my spending increase?', 'Which model costs me the most?', 'How can I save money?', 'Which provider is cheapest?'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Good afternoon 👋</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Here's your AI spending overview for Baran's AI Workspace.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded px-2 py-1 font-medium">Demo Workspace</span>
          <button
            onClick={runAnalysis}
            disabled={analysisState === 'loading'}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            {analysisState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Run AI Analysis
          </button>
        </div>
      </div>

      {/* Analysis Panel */}
      {analysisState !== 'idle' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          {analysisState === 'loading' && (
            <div className="flex flex-col items-center py-4 gap-3">
              <Loader2 size={28} className="animate-spin text-sky-400" />
              <div className="text-sm font-semibold text-zinc-200">{STEPS[analysisStep]}</div>
              <div className="w-64 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${((analysisStep + 1) / STEPS.length) * 100}%` }} />
              </div>
              <div className="text-xs text-zinc-500">This usually takes a few seconds</div>
            </div>
          )}
          {analysisState === 'done' && analysisResult && (
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-sm font-bold text-zinc-100">AI found {analysisResult.insights.length} optimization opportunities</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">Analyzed {analysisResult.requestsAnalyzed.toLocaleString()} requests · {analysisResult.analyzedAt}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Potential monthly savings</div>
                  <div className="text-2xl font-bold text-emerald-400">{fmt$(analysisResult.totalSavings)}</div>
                  <button onClick={() => setSavingsModal(true)} className="text-xs text-sky-400 hover:underline">How did we calculate this?</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {analysisResult.insights.map(ins => (
                  <div key={ins.id} className="bg-zinc-800/60 border border-zinc-700/60 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <SeverityBadge severity={ins.severity} />
                          <span className="text-xs text-zinc-500">{ins.provider} · {ins.model}</span>
                        </div>
                        <div className="text-sm font-semibold text-zinc-200 mb-1">{ins.title}</div>
                        <div className="text-xs text-zinc-400 leading-relaxed mb-2">{ins.explanation}</div>
                        <div className="text-xs text-zinc-300 bg-zinc-900 rounded px-2 py-1.5 border border-zinc-700">
                          <span className="text-zinc-500">Rec: </span>{ins.recommendation}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-none">
                        <div className="text-right">
                          <div className="text-xs text-zinc-500">Est. savings</div>
                          <div className="text-lg font-bold text-emerald-400">{fmt$(ins.savings)}<span className="text-xs font-normal text-zinc-500">/mo</span></div>
                        </div>
                        {appliedInsights.has(ins.id) ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium"><Check size={12} />Applied</span>
                        ) : (
                          <button onClick={() => applyInsight(ins.id)} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded px-2.5 py-1 transition-colors font-medium">
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setOptimizeModal(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors">
                  Optimize my AI spending
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Current Spend" value={fmt$(totalSpend)} sub="This month" trend="+12.4% vs last month" trendUp />
        <StatCard label="Projected Spend" value="$58.20" sub="End of month estimate" trend="On track" trendUp />
        <StatCard label="Total Requests" value={fmtK(totalRequests)} sub="Last 30 days" trend="+8.2% vs last month" trendUp />
        <StatCard label="Tokens Used" value="12.8M" sub="This month" trend="+6.1% vs last month" trendUp />
      </div>

      {/* Savings callout */}
      <div className="bg-zinc-900 border border-emerald-500/25 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center flex-none">
            <Lightbulb size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-200">
              AI identified <span className="text-emerald-400">{fmt$(potentialSavings)}/mo</span> in savings opportunities
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Model routing, prompt caching, batch optimization</div>
          </div>
        </div>
        <button onClick={() => onNav('insights')} className="flex-none text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
          View details <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-200">Daily AI Spending</div>
              <div className="text-xs text-zinc-500">Last 14 days · current vs previous month</div>
            </div>
            <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)}
              className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1.5 outline-none">
              <option value="all">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="other">Other</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCurr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71717a" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="prevValue" name="Last month" stroke="#52525b" strokeWidth={1.5} fill="url(#gradPrev)" dot={false} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="value" name="This month" stroke="#38bdf8" strokeWidth={2} fill="url(#gradCurr)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Provider breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-sm font-semibold text-zinc-200 mb-4">Provider Breakdown</div>
          <div className="flex justify-center mb-3">
            <PieChart width={140} height={140}>
              <Pie data={pieData} cx={65} cy={65} innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                {pieData.map((_entry, i) => <Cell key={i} fill={pieData[i].fill} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2">
            {PROVIDERS.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: p.color }} />
                <span className="text-xs text-zinc-400 flex-1 truncate">{p.name}</span>
                <span className="text-xs font-semibold text-zinc-200">{fmt$(p.spend)}</span>
                <span className="text-[10px] text-zinc-500 w-10 text-right">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Models */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-zinc-200">Top Models</div>
            <button onClick={() => onNav('models')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">View all</button>
          </div>
          <div className="space-y-3">
            {MODELS.slice(0, 4).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs text-zinc-700 font-mono w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium text-zinc-300 truncate">{m.name}</span>
                    <span className="text-[10px] text-zinc-600 flex-none">{m.provider}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1">
                    <div className="h-1 rounded-full" style={{ width: `${Math.min(m.pct * 3, 100)}%`, background: m.providerColor }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-200 flex-none">{fmt$(m.monthlyCost)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-zinc-200">AI Insights</div>
            <button onClick={() => onNav('insights')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">View all</button>
          </div>
          <div className="space-y-2.5">
            {INSIGHTS.map(ins => (
              <div key={ins.id} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 flex-none">
                  {ins.severity === 'warning' ? <AlertTriangle size={12} className="text-amber-400" /> : <Info size={12} className="text-sky-400" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-300 leading-relaxed line-clamp-2">{ins.title}</div>
                  <div className="text-emerald-400 font-medium mt-0.5">Save {fmt$(ins.savings)}/mo</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNav('insights')} className="w-full mt-4 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded px-3 py-2 transition-colors font-medium">
            Analyze spending →
          </button>
        </div>

        {/* Ask AI Budget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-sky-400" />
            <div className="text-sm font-semibold text-zinc-200">Ask AI Budget</div>
          </div>
          {chatMessages.length === 0 && <div className="text-xs text-zinc-500 mb-3">Ask about your spending, models, or cost savings.</div>}
          <div className="flex-1 overflow-y-auto max-h-48 space-y-2 mb-3">
            {chatMessages.map(msg => (
              <div key={msg.id} className={msg.from === 'user' ? 'ml-6 text-right' : 'mr-6'}>
                <div className={`inline-block text-xs rounded-lg px-3 py-2 max-w-full text-left leading-relaxed ${msg.from === 'user' ? 'bg-sky-500/15 text-sky-200' : 'bg-zinc-800 text-zinc-300'}`}>
                  {msg.text}
                </div>
                {msg.pill && (
                  <div className="mt-1 inline-block text-[10px] bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400">
                    {msg.pill.label}: <span className="text-zinc-200 font-medium">{msg.pill.value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {chatMessages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUESTIONS.map(q => (
                <button key={q} onClick={() => sendChat(q)} className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded px-2 py-1 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && chatInput.trim() && sendChat(chatInput.trim())}
              placeholder="Ask anything…"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600"
            />
            <button onClick={() => chatInput.trim() && sendChat(chatInput.trim())} className="bg-sky-500 hover:bg-sky-400 text-white rounded px-2.5 py-1.5 transition-colors">
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-zinc-200">Recent Activity</div>
          <button onClick={() => onNav('usage')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                {['Provider / Model', 'Type', 'Tokens', 'Project', 'Cost', 'Time'].map(h => (
                  <th key={h} className={`text-left pb-2 font-medium pr-4 ${h === 'Tokens' ? 'hidden sm:table-cell' : ''} ${h === 'Project' ? 'hidden md:table-cell' : ''} ${h === 'Cost' || h === 'Time' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.slice(0, 6).map(ev => (
                <tr key={ev.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: ev.providerColor }} />
                      <div>
                        <div className="text-zinc-300 font-medium">{ev.model}</div>
                        <div className="text-zinc-600">{ev.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-400">{ev.type}</td>
                  <td className="py-2.5 pr-4 text-zinc-400 hidden sm:table-cell font-mono">{(ev.tokensIn + ev.tokensOut).toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-zinc-500 hidden md:table-cell">{ev.project}</td>
                  <td className="py-2.5 pr-4 text-right text-zinc-200 font-mono font-semibold">{fmt$(ev.cost)}</td>
                  <td className="py-2.5 text-right text-zinc-500 whitespace-nowrap">{ev.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {savingsModal && (
        <Modal onClose={() => setSavingsModal(false)} title="How we calculated your savings">
          <div className="space-y-4 text-sm text-zinc-400">
            <p>AI Budget analyzes request patterns and compares them against optimal model routing strategies.</p>
            <div className="space-y-2">
              {INSIGHTS.map(ins => (
                <div key={ins.id} className="flex items-center justify-between border border-zinc-700 rounded-lg p-3">
                  <div>
                    <div className="text-zinc-300 font-medium text-xs">{ins.title}</div>
                    <div className="text-zinc-600 text-[11px] mt-0.5">{ins.confidence}% confidence · {ins.category}</div>
                  </div>
                  <div className="text-emerald-400 font-bold">{fmt$(ins.savings)}</div>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
              <strong className="text-zinc-300">Note:</strong> Simulated estimates for this MVP demo. Actual savings depend on implementation.
            </div>
          </div>
        </Modal>
      )}
      {optimizeModal && (
        <Modal onClose={() => setOptimizeModal(false)} title="3 optimization recommendations are ready">
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">No actual API routing or provider settings will be changed in this demo.</p>
            <div className="space-y-2">
              {INSIGHTS.map(ins => (
                <div key={ins.id} className="flex items-start gap-2 text-xs border border-zinc-700 rounded-lg p-3">
                  <CheckCircle size={14} className="text-emerald-400 mt-0.5 flex-none" />
                  <div className="text-zinc-300">{ins.recommendation}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setOptimizeModal(false)} className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-md transition-colors">Cancel</button>
              <button
                onClick={() => { setOptimizeModal(false); addToast('Recommendations ready. Apply individually in AI Insights.', 'info'); onNav('insights'); }}
                className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2 rounded-md transition-colors"
              >
                Review recommendations
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════ USAGE ═══════════════ */
export function UsagePage() {
  const [dateRange, setDateRange] = useState('30d');
  const [metricTab, setMetricTab] = useState<'cost' | 'requests' | 'tokens'>('cost');
  const totalSpend = PROVIDERS.reduce((a, p) => a + p.spend, 0);
  const totalRequests = PROVIDERS.reduce((a, p) => a + p.requests, 0);
  const data = dateRange === '7d' ? DAYS.slice(-7) : dateRange === '14d' ? DAYS.slice(-14) : DAYS;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Usage Analytics</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Detailed breakdown of your AI API usage.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['7d', '14d', '30d'] as const).map(r => (
            <button key={r} onClick={() => setDateRange(r)} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${dateRange === r ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
              {r === '7d' ? 'Last 7 days' : r === '14d' ? 'Last 14 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Spend" value={`$${totalSpend.toFixed(2)}`} sub="Selected period" trend="+12.4%" trendUp />
        <StatCard label="Total Requests" value={totalRequests.toLocaleString()} sub="Selected period" trend="+8.2%" trendUp />
        <StatCard label="Input Tokens" value="9.4M" sub="Selected period" />
        <StatCard label="Output Tokens" value="3.4M" sub="Selected period" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="text-sm font-semibold text-zinc-200">Spend Over Time</div>
          <div className="flex gap-1">
            {(['cost', 'requests', 'tokens'] as const).map(t => (
              <button key={t} onClick={() => setMetricTab(t)} className={`text-xs px-2.5 py-1 rounded font-medium transition-colors capitalize ${metricTab === t ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>{t}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} interval={Math.floor(data.length / 8)} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => metricTab === 'cost' ? `$${v}` : String(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="openai" name="OpenAI" fill="#10b981" stackId="a" radius={[0,0,0,0]} />
            <Bar dataKey="anthropic" name="Anthropic" fill="#f59e0b" stackId="a" radius={[0,0,0,0]} />
            <Bar dataKey="google" name="Google" fill="#3b82f6" stackId="a" radius={[0,0,0,0]} />
            <Bar dataKey="other" name="Other" fill="#a855f7" stackId="a" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="text-sm font-semibold text-zinc-200 mb-4">Request Log</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                {['ID', 'Provider / Model', 'Type', 'Tokens In', 'Tokens Out', 'Cost', 'Latency', 'Project', 'Time'].map(h => (
                  <th key={h} className="text-left pb-2 font-medium pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map(ev => (
                <tr key={ev.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 pr-3 font-mono text-zinc-600">{ev.id}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: ev.providerColor }} />
                      <div>
                        <div className="text-zinc-300 font-medium">{ev.model}</div>
                        <div className="text-zinc-600">{ev.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-400">{ev.type}</td>
                  <td className="py-2.5 pr-3 text-zinc-400 font-mono">{ev.tokensIn.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-zinc-400 font-mono">{ev.tokensOut.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-zinc-200 font-mono font-semibold">${ev.cost.toFixed(4)}</td>
                  <td className="py-2.5 pr-3 text-zinc-500 font-mono">{ev.latency}ms</td>
                  <td className="py-2.5 pr-3 text-zinc-500">{ev.project}</td>
                  <td className="py-2.5 text-zinc-500 whitespace-nowrap">{ev.ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ PROVIDERS ═══════════════ */
export function ProvidersPage() {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

  async function simulateConnect(name: string) {
    setConnecting(name);
    await new Promise(r => setTimeout(r, 1800));
    setConnecting(null);
    setShowAddModal(false);
    addToast(`${name} connected successfully`, 'success');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Providers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your connected AI provider integrations.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          + Add Provider
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map(p => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md border border-zinc-700 flex items-center justify-center flex-none" style={{ background: p.color + '18' }}>
                  <Cpu size={16} style={{ color: p.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{p.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-medium">Connected · {p.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-zinc-100">${p.spend.toFixed(2)}</div>
                <div className="text-[11px] text-zinc-500">this month</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-zinc-800/60 rounded-md p-2.5">
                <div className="text-[11px] text-zinc-500 mb-0.5">Requests</div>
                <div className="text-sm font-semibold text-zinc-200">{p.requests.toLocaleString()}</div>
              </div>
              <div className="bg-zinc-800/60 rounded-md p-2.5">
                <div className="text-[11px] text-zinc-500 mb-0.5">Avg Latency</div>
                <div className="text-sm font-semibold text-zinc-200">{p.latency}ms</div>
              </div>
              <div className="bg-zinc-800/60 rounded-md p-2.5">
                <div className="text-[11px] text-zinc-500 mb-0.5">Models</div>
                <div className="text-sm font-semibold text-zinc-200">{p.models}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span className="font-mono">{p.apiKey}</span>
              <span>Synced {p.lastSynced}</span>
            </div>
          </div>
        ))}
      </div>
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Add a Provider">
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Connect a new AI provider. Keys are encrypted and never stored in plaintext.</p>
            <div className="grid grid-cols-2 gap-2">
              {['OpenAI', 'Anthropic', 'Google Gemini', 'Mistral', 'Groq', 'Cohere'].map(name => (
                <button key={name} onClick={() => simulateConnect(name)} disabled={!!connecting}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-zinc-300 transition-colors disabled:opacity-50">
                  {connecting === name ? <Loader2 size={14} className="animate-spin text-sky-400" /> : <Cpu size={14} className="text-zinc-500" />}
                  {name}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Or paste API key directly</label>
              <div className="flex gap-2">
                <input type="password" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="sk-…"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500" />
                <button onClick={() => { if (newKey.trim()) simulateConnect('Provider'); }}
                  className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
                  Connect
                </button>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-500 flex items-start gap-2">
              <Shield size={12} className="mt-0.5 flex-none text-emerald-400" />
              Keys are AES-256 encrypted. AI Budget only reads usage data.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════ MODELS ═══════════════ */
export function ModelsPage() {
  const { addToast } = useToast();
  const [sortKey, setSortKey] = useState<'monthlyCost' | 'requests' | 'efficiency' | 'inputCost' | 'outputCost'>('monthlyCost');
  const [desc, setDesc] = useState(true);
  const [filterTier, setFilterTier] = useState('all');

  const sorted = [...MODELS]
    .filter(m => filterTier === 'all' || m.tier === filterTier)
    .sort((a, b) => desc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setDesc(d => !d);
    else { setSortKey(key); setDesc(true); }
  }

  const ColHeader = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <th className="text-left py-3 px-4 font-medium cursor-pointer hover:text-zinc-300 transition-colors whitespace-nowrap select-none" onClick={() => toggleSort(k)}>
      {label} {sortKey === k ? (desc ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Models</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Compare cost, efficiency, and usage across all models.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'Flagship', 'Balanced', 'Fast'] as const).map(t => (
            <button key={t} onClick={() => setFilterTier(t)} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${filterTier === t ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
              {t === 'all' ? 'All tiers' : t}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-950">
                <th className="text-left py-3 px-4 font-medium">Model</th>
                <th className="text-left py-3 px-4 font-medium">Provider</th>
                <th className="text-left py-3 px-4 font-medium">Tier</th>
                <ColHeader k="inputCost" label="Input $/1M" />
                <ColHeader k="outputCost" label="Output $/1M" />
                <ColHeader k="requests" label="Requests" />
                <ColHeader k="monthlyCost" label="Monthly Cost" />
                <ColHeader k="efficiency" label="Efficiency" />
                <th className="text-left py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(m => (
                <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-zinc-200">{m.name}</div>
                    <div className="text-zinc-600 mt-0.5">{m.context} ctx</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.providerColor }} />
                      <span className="text-zinc-400">{m.provider}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider border ${m.tier === 'Flagship' ? 'bg-sky-500/10 text-sky-400 border-sky-500/25' : m.tier === 'Fast' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-zinc-700/50 text-zinc-400 border-zinc-600'}`}>
                      {m.tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-400">${m.inputCost.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono text-zinc-400">${m.outputCost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-zinc-400">{m.requests.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-zinc-200">${m.monthlyCost.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-zinc-800 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${m.efficiency >= 90 ? 'bg-emerald-400' : m.efficiency >= 80 ? 'bg-sky-400' : 'bg-amber-400'}`} style={{ width: `${m.efficiency}%` }} />
                      </div>
                      <span className="text-zinc-400">{m.efficiency}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => addToast(`Optimization analysis for ${m.name} launched`, 'info')}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors">
                      Optimize →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ BUDGETS ═══════════════ */
export function BudgetsPage() {
  const { addToast } = useToast();
  const [budgets, setBudgets] = useState(BUDGETS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', limit: '', warn: '80', crit: '95' });

  function getStatus(b: typeof BUDGETS[0]) {
    const pct = (b.spent / b.limit) * 100;
    if (pct >= b.crit) return { bar: 'bg-red-500', text: 'text-red-400', label: 'Critical' };
    if (pct >= b.warn) return { bar: 'bg-amber-500', text: 'text-amber-400', label: 'Warning' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'On track' };
  }

  function create() {
    setBudgets(prev => [...prev, {
      id: `b-${Date.now()}`, name: form.name || 'New Budget', scope: 'Workspace',
      limit: parseFloat(form.limit) || 50, spent: 0,
      warn: parseFloat(form.warn) || 80, crit: parseFloat(form.crit) || 95,
      alerts: true, hardCap: false,
    }]);
    setShowCreate(false);
    setForm({ name: '', limit: '', warn: '80', crit: '95' });
    addToast('Budget created successfully', 'success');
  }

  const primary = budgets[0];
  const rest = budgets.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Budgets</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Set spending limits and get alerted before you overspend.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          + Create Budget
        </button>
      </div>

      {primary && (() => {
        const pct = (primary.spent / primary.limit) * 100;
        const st = getStatus(primary);
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">{primary.name}</div>
                <div className="text-3xl font-bold text-zinc-100">${primary.spent.toFixed(2)}</div>
                <div className="text-sm text-zinc-500 mt-1">of ${primary.limit.toFixed(2)} monthly budget</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 mb-1">Remaining</div>
                <div className="text-2xl font-bold text-emerald-400">${(primary.limit - primary.spent).toFixed(2)}</div>
                <div className={`text-xs font-medium mt-1 ${st.text}`}>{st.label}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>{pct.toFixed(1)}% used</span>
              <span>Warn at {primary.warn}% · Critical at {primary.crit}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${st.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-800">
              <div><div className="text-xs text-zinc-500 mb-0.5">Budget</div><div className="text-sm font-semibold text-zinc-200">${primary.limit.toFixed(2)}</div></div>
              <div><div className="text-xs text-zinc-500 mb-0.5">Spent</div><div className="text-sm font-semibold text-zinc-200">${primary.spent.toFixed(2)}</div></div>
              <div><div className="text-xs text-zinc-500 mb-0.5">Projected</div><div className="text-sm font-semibold text-zinc-200">$58.20</div></div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rest.map(b => {
          const pct = (b.spent / b.limit) * 100;
          const st = getStatus(b);
          return (
            <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{b.name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{b.scope}</div>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${st.text}`} style={{ borderColor: 'currentColor', opacity: 0.8 }}>{st.label}</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div className="text-lg font-bold text-zinc-100">${b.spent.toFixed(2)}</div>
                <div className="text-xs text-zinc-500">of ${b.limit.toFixed(2)}</div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${st.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="text-[11px] text-zinc-600 mt-1.5">{pct.toFixed(1)}% used</div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create Budget">
          <div className="space-y-4">
            {[
              { label: 'Budget name', key: 'name', placeholder: 'e.g. Production API Budget', type: 'text' },
              { label: 'Monthly limit ($)', key: 'limit', placeholder: '100', type: 'number' },
              { label: 'Warning threshold (%)', key: 'warn', placeholder: '80', type: 'number' },
              { label: 'Critical threshold (%)', key: 'crit', placeholder: '95', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-zinc-500 mb-1.5">{f.label}</label>
                <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500" />
              </div>
            ))}
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowCreate(false)} className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-md transition-colors">Cancel</button>
              <button onClick={create} className="text-sm bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-2 rounded-md transition-colors">Create Budget</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════ INSIGHTS ═══════════════ */
export function InsightsPage() {
  const { addToast } = useToast();
  const [insights, setInsights] = useState(INSIGHTS);
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [savingsModal, setSavingsModal] = useState(false);
  const [optimizeModal, setOptimizeModal] = useState(false);

  const STEPS = ['Connecting to providers…', 'Analyzing 18,492 requests…', 'Detecting patterns…', 'Calculating savings…', 'Analysis complete ✓'];

  async function runAnalysis() {
    setAnalysisState('loading');
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      setAnalysisStep(i);
    }
    setAnalysisState('done');
  }

  function applyInsight(id: string) {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, applied: true } : i));
    addToast('Recommendation applied (simulated MVP)', 'success');
  }

  const totalSavings = insights.reduce((a, i) => a + i.savings, 0);
  const appliedSavings = insights.filter(i => i.applied).reduce((a, i) => a + i.savings, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">AI Cost Intelligence</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Understand where your AI spending goes and how to reduce it.</p>
        </div>
        <button onClick={runAnalysis} disabled={analysisState === 'loading'}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          {analysisState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
          Analyze Spending
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-zinc-900 border border-emerald-500/20 rounded-lg p-5">
          <div className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-2">Potential Monthly Savings</div>
          <div className="text-4xl font-bold text-emerald-400 mb-1">${totalSavings.toFixed(2)}</div>
          <div className="text-sm text-zinc-500 mb-3">{insights.length} opportunities · {insights.filter(i => i.applied).length} applied</div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setSavingsModal(true)} className="text-xs text-sky-400 hover:underline">How did we calculate this?</button>
            <button onClick={() => setOptimizeModal(true)} className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-3 py-1.5 rounded-md transition-colors">Optimize my AI spending</button>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div className="text-xs text-zinc-500 mb-1">Applied Savings</div>
          <div className="text-3xl font-bold text-zinc-200">${appliedSavings.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-0.5 mb-3">of ${totalSavings.toFixed(2)} possible</div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${totalSavings > 0 ? (appliedSavings / totalSavings) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {analysisState === 'loading' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-sky-400" />
          <div className="text-sm font-semibold text-zinc-200">{STEPS[analysisStep]}</div>
          <div className="w-72 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${((analysisStep + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>
      )}
      {analysisState === 'done' && (
        <div className="bg-zinc-900 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle size={16} className="text-emerald-400 flex-none" />
          <span className="text-sm text-zinc-300">Analysis complete. Analyzed <strong className="text-zinc-100">18,492 requests</strong> across 4 providers.</span>
        </div>
      )}

      <div className="space-y-4">
        {insights.map(ins => (
          <div key={ins.id} className={`bg-zinc-900 border rounded-lg p-5 ${ins.applied ? 'border-emerald-500/25' : 'border-zinc-800'}`}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <SeverityBadge severity={ins.severity} />
                  <span className="text-xs text-zinc-500">{ins.provider} · {ins.model}</span>
                  <span className="text-xs text-zinc-700">Confidence: {ins.confidence}%</span>
                  {ins.applied && <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium"><Check size={11} />Applied</span>}
                </div>
                <div className="text-sm font-semibold text-zinc-200 mb-2">{ins.title}</div>
                <div className="text-sm text-zinc-400 leading-relaxed mb-3">{ins.explanation}</div>
                <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                  <div className="text-xs text-zinc-500 mb-1 font-medium">Recommendation</div>
                  <div className="text-xs text-zinc-300 leading-relaxed">{ins.recommendation}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 flex-none">
                <div className="text-right">
                  <div className="text-xs text-zinc-500 mb-0.5">Est. savings</div>
                  <div className="text-2xl font-bold text-emerald-400">${ins.savings.toFixed(2)}</div>
                  <div className="text-xs text-zinc-500">/month</div>
                </div>
                {!ins.applied ? (
                  <button onClick={() => applyInsight(ins.id)}
                    className="text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md px-4 py-2 transition-colors font-medium whitespace-nowrap">
                    Apply recommendation
                  </button>
                ) : (
                  <span className="text-sm text-emerald-400 font-medium flex items-center gap-1.5"><Check size={14} />Applied</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {savingsModal && (
        <Modal onClose={() => setSavingsModal(false)} title="How we calculated your savings">
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">AI Budget analyzes request patterns and compares them against optimal model routing strategies.</p>
            <div className="space-y-2">
              {insights.map(ins => (
                <div key={ins.id} className="flex items-center justify-between border border-zinc-700 rounded-lg p-3">
                  <div>
                    <div className="text-zinc-300 font-medium text-xs">{ins.title}</div>
                    <div className="text-zinc-600 text-[11px] mt-0.5">{ins.confidence}% confidence · {ins.category}</div>
                  </div>
                  <div className="text-emerald-400 font-bold text-sm">${ins.savings.toFixed(2)}/mo</div>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-500">
              <strong className="text-zinc-400">Note:</strong> Simulated estimates for this MVP demo.
            </div>
          </div>
        </Modal>
      )}
      {optimizeModal && (
        <Modal onClose={() => setOptimizeModal(false)} title="3 optimization recommendations are ready">
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">No actual API routing or provider settings are changed in this demo.</p>
            <div className="space-y-2">
              {insights.map(ins => (
                <div key={ins.id} className="flex items-start gap-2 border border-zinc-700 rounded-lg p-3">
                  <div className="w-4 h-4 rounded-full border border-emerald-500/40 flex items-center justify-center flex-none mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-xs text-zinc-300">{ins.recommendation}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setOptimizeModal(false)} className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-md transition-colors">Cancel</button>
              <button onClick={() => { setOptimizeModal(false); addToast('Apply each recommendation individually above.', 'info'); }}
                className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2 rounded-md transition-colors">
                Review recommendations
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════ ALERTS ═══════════════ */
export function AlertsPage({ onNav: _onNav }: { onNav: (p: Page) => void }) {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS);

  function markRead(id: string) { setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a)); }
  function dismiss(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
    addToast('Alert dismissed', 'info');
  }

  const active = alerts.filter(a => !a.dismissed);
  const unread = active.filter(a => !a.read).length;

  const iconMap = {
    critical: <AlertTriangle size={15} className="text-red-400" />,
    warning:  <AlertTriangle size={15} className="text-amber-400" />,
    info:     <Info size={15} className="text-sky-400" />,
  };
  const leftBorderMap = {
    critical: 'border-l-red-500',
    warning:  'border-l-amber-500',
    info:     'border-l-zinc-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Alerts</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{unread} unread · {active.length} active.</p>
        </div>
        {unread > 0 && (
          <button onClick={() => setAlerts(prev => prev.map(a => ({ ...a, read: true })))} className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      {active.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 flex flex-col items-center gap-3">
          <CheckCircle size={32} className="text-zinc-700" />
          <div className="text-sm font-semibold text-zinc-500">No active alerts</div>
          <div className="text-xs text-zinc-600">You're within all budget thresholds.</div>
        </div>
      )}

      <div className="space-y-3">
        {active.map(a => (
          <div key={a.id} onClick={() => markRead(a.id)}
            className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors border-l-2 ${leftBorderMap[a.severity]}`}>
            <div className="flex items-start gap-3">
              <div className="flex-none mt-0.5">{iconMap[a.severity]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-sm font-semibold ${!a.read ? 'text-zinc-100' : 'text-zinc-300'}`}>{a.title}</span>
                  {!a.read && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-none" />}
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed mb-2">{a.desc}</div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600 flex-wrap">
                  <span>{a.entity}</span>
                  {a.change && <span className="font-mono">{a.change}</span>}
                  <span>{a.ts}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-none">
                {a.actionLabel && (
                  <button onClick={e => { e.stopPropagation(); markRead(a.id); }}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors whitespace-nowrap">
                    {a.actionLabel}
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); dismiss(a.id); }} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ SETTINGS ═══════════════ */
export function SettingsPage() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    name: "Baran's AI Workspace",
    email: 'baran@example.com',
    currency: 'USD',
    emailAlerts: true,
    slackAlerts: false,
    modelRouting: 'Balanced',
    timezone: 'Europe/Istanbul',
  });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="text-sm font-semibold text-zinc-200 mb-4">{title}</div>
      <div className="space-y-5">{children}</div>
    </div>
  );

  const Field = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-zinc-300">{label}</div>
        {desc && <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 rounded-full transition-colors flex-none ${value ? 'bg-sky-500' : 'bg-zinc-700'}`}
      style={{ height: '22px' }}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your workspace preferences.</p>
      </div>

      <Section title="Workspace">
        <Field label="Workspace name">
          <input value={settings.name} onChange={e => setSettings(s => ({ ...s, name: e.target.value }))}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-500 w-52" />
        </Field>
        <Field label="Email" desc="Used for billing and alert notifications">
          <input value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-500 w-52" />
        </Field>
      </Section>

      <Section title="Notifications">
        <Field label="Email alerts" desc="Notify when budget thresholds are reached">
          <Toggle value={settings.emailAlerts} onChange={v => setSettings(s => ({ ...s, emailAlerts: v }))} />
        </Field>
        <Field label="Slack alerts" desc="Send alerts to a Slack webhook">
          <Toggle value={settings.slackAlerts} onChange={v => setSettings(s => ({ ...s, slackAlerts: v }))} />
        </Field>
      </Section>

      <Section title="Preferences">
        <Field label="Currency">
          <select value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 outline-none w-32">
            <option>USD</option><option>EUR</option><option>GBP</option>
          </select>
        </Field>
        <Field label="Default model routing" desc="Strategy used when routing AI requests">
          <select value={settings.modelRouting} onChange={e => setSettings(s => ({ ...s, modelRouting: e.target.value }))}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 outline-none w-44">
            <option>Cost-Optimized</option><option>Balanced</option><option>Performance-First</option>
          </select>
        </Field>
        <Field label="Timezone">
          <select value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 outline-none w-44">
            <option>Europe/Istanbul</option><option>UTC</option><option>America/New_York</option><option>America/Los_Angeles</option>
          </select>
        </Field>
      </Section>

      <Section title="Plan & Credits">
        <Field label="Billing plan">
          <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded px-2 py-1 font-medium">Pro Plan</span>
        </Field>
        <Field label="Credits used" desc="8,240 of 10,000 credits used this period">
          <div className="flex items-center gap-2">
            <div className="w-32 bg-zinc-800 rounded-full h-1.5">
              <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: '82.4%' }} />
            </div>
            <span className="text-xs text-zinc-500">82.4%</span>
          </div>
        </Field>
      </Section>

      <div className="flex justify-end">
        <button onClick={() => addToast('Settings saved successfully', 'success')} className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-6 py-2.5 rounded-md transition-colors">
          Save changes
        </button>
      </div>
    </div>
  );
}
