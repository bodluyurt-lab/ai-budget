import type { Provider, AIModel, UsageEvent, DayData, Budget, Alert, Insight } from './types';

export const PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', connected: true, spend: 24.82, pct: 58.2, color: '#10b981', requests: 9420, models: 4, latency: 412, status: 'operational', apiKey: 'sk-proj-••••••••94bF', lastSynced: '2 min ago' },
  { id: 'anthropic', name: 'Anthropic', connected: true, spend: 10.42, pct: 24.4, color: '#f59e0b', requests: 4180, models: 2, latency: 580, status: 'operational', apiKey: 'sk-ant-••••••••x7K2', lastSynced: '5 min ago' },
  { id: 'google', name: 'Google Gemini', connected: true, spend: 5.84, pct: 13.7, color: '#3b82f6', requests: 3950, models: 3, latency: 290, status: 'operational', apiKey: 'AIzaSy••••••••L8w1', lastSynced: 'Just now' },
  { id: 'other', name: 'Mistral & Groq', connected: true, spend: 1.60, pct: 3.7, color: '#a855f7', requests: 942, models: 2, latency: 140, status: 'operational', apiKey: 'gsk-••••••••99qP', lastSynced: '14 min ago' },
];

export const MODELS: AIModel[] = [
  { id: 'gpt-5-6', name: 'GPT-5.6', provider: 'OpenAI', providerColor: '#10b981', inputCost: 5.00, outputCost: 15.00, requests: 5210, tokens: 4420000, monthlyCost: 14.20, pct: 33.3, efficiency: 78, tier: 'Flagship', context: '128k' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', provider: 'Anthropic', providerColor: '#f59e0b', inputCost: 3.00, outputCost: 15.00, requests: 3120, tokens: 2980000, monthlyCost: 8.42, pct: 19.7, efficiency: 86, tier: 'Flagship', context: '200k' },
  { id: 'gemini-25-pro', name: 'Gemini 2.5 Pro', provider: 'Google', providerColor: '#3b82f6', inputCost: 1.25, outputCost: 5.00, requests: 2480, tokens: 2150000, monthlyCost: 5.13, pct: 12.0, efficiency: 91, tier: 'Flagship', context: '1M' },
  { id: 'gemini-flash', name: 'Gemini Flash', provider: 'Google', providerColor: '#3b82f6', inputCost: 0.15, outputCost: 0.60, requests: 3840, tokens: 1840000, monthlyCost: 2.80, pct: 6.6, efficiency: 98, tier: 'Fast', context: '1M' },
  { id: 'gpt-5-mini', name: 'GPT-5-mini', provider: 'OpenAI', providerColor: '#10b981', inputCost: 0.30, outputCost: 1.20, requests: 2610, tokens: 960000, monthlyCost: 1.80, pct: 4.2, efficiency: 96, tier: 'Fast', context: '128k' },
  { id: 'mistral-large', name: 'Mistral Large 2', provider: 'Mistral', providerColor: '#a855f7', inputCost: 2.00, outputCost: 6.00, requests: 780, tokens: 450000, monthlyCost: 1.60, pct: 3.7, efficiency: 84, tier: 'Balanced', context: '128k' },
];

export const EVENTS: UsageEvent[] = [
  { id: 'req-1', ts: 'Just now', provider: 'OpenAI', providerColor: '#10b981', model: 'GPT-5.6', type: 'Chat Completion', tokensIn: 1420, tokensOut: 384, cost: 0.0128, latency: 512, project: 'Production API', status: 200 },
  { id: 'req-2', ts: '2 min ago', provider: 'Anthropic', providerColor: '#f59e0b', model: 'Claude Sonnet', type: 'Structured JSON', tokensIn: 890, tokensOut: 420, cost: 0.0089, latency: 640, project: 'Agent Worker', status: 200 },
  { id: 'req-3', ts: '5 min ago', provider: 'Google', providerColor: '#3b82f6', model: 'Gemini Flash', type: 'Embeddings', tokensIn: 4200, tokensOut: 0, cost: 0.0006, latency: 145, project: 'Vector Search', status: 200 },
  { id: 'req-4', ts: '8 min ago', provider: 'OpenAI', providerColor: '#10b981', model: 'GPT-5-mini', type: 'Chat Completion', tokensIn: 510, tokensOut: 180, cost: 0.0004, latency: 230, project: 'Customer Bot', status: 200 },
  { id: 'req-5', ts: '14 min ago', provider: 'Google', providerColor: '#3b82f6', model: 'Gemini 2.5 Pro', type: 'Tool Calling', tokensIn: 2150, tokensOut: 740, cost: 0.0064, latency: 410, project: 'Production API', status: 200 },
  { id: 'req-6', ts: '22 min ago', provider: 'Mistral', providerColor: '#a855f7', model: 'Mistral Large 2', type: 'Chat Completion', tokensIn: 1120, tokensOut: 490, cost: 0.0051, latency: 295, project: 'Evaluation Lab', status: 200 },
  { id: 'req-7', ts: '31 min ago', provider: 'OpenAI', providerColor: '#10b981', model: 'GPT-5.6', type: 'Vision', tokensIn: 3200, tokensOut: 520, cost: 0.0238, latency: 820, project: 'Production API', status: 200 },
  { id: 'req-8', ts: '45 min ago', provider: 'Anthropic', providerColor: '#f59e0b', model: 'Claude Sonnet', type: 'Chat Completion', tokensIn: 1640, tokensOut: 810, cost: 0.0171, latency: 710, project: 'Agent Worker', status: 200 },
];

export const BUDGETS: Budget[] = [
  { id: 'b-global', name: 'Global Monthly Budget', scope: 'Workspace', limit: 100, spent: 42.68, warn: 80, crit: 95, alerts: true, hardCap: false },
  { id: 'b-openai', name: 'OpenAI Allocation', scope: 'Provider: OpenAI', limit: 50, spent: 24.82, warn: 80, crit: 95, alerts: true, hardCap: false },
  { id: 'b-anthropic', name: 'Anthropic Allocation', scope: 'Provider: Anthropic', limit: 25, spent: 10.42, warn: 80, crit: 95, alerts: true, hardCap: false },
  { id: 'b-prod', name: 'Production API Project', scope: 'Project: Production API', limit: 60, spent: 28.40, warn: 85, crit: 95, alerts: true, hardCap: true },
];

export const ALERTS: Alert[] = [
  { id: 'a-1', title: 'Spending increased 25% this week', desc: 'Weekly burn rate jumped to $11.40 vs $9.12 last week, driven by GPT-5.6 vision requests.', severity: 'warning', ts: 'Today 09:14 AM', read: false, dismissed: false, entity: 'OpenAI / GPT-5.6', change: '+25.0% WoW', actionLabel: 'View Insights' },
  { id: 'a-2', title: 'Reached 80% of OpenAI warning threshold', desc: 'OpenAI spend at $24.82 against $30 sub-limit (82.7%). At this rate you will exceed cap by day 22.', severity: 'critical', ts: 'Yesterday 04:30 PM', read: false, dismissed: false, entity: 'OpenAI Budget', change: '82.7% used', actionLabel: 'Adjust Budget' },
  { id: 'a-3', title: 'GPT-5.6 usage unusual for classification tasks', desc: 'Over 2,180 classification requests sent to GPT-5.6. Routing to GPT-5-mini could save ~$8.40.', severity: 'info', ts: '2 days ago', read: true, dismissed: false, entity: 'GPT-5.6 Routing', change: '34% of total spend', actionLabel: 'View Recommendation' },
  { id: 'a-4', title: 'Prompt caching opportunity in Anthropic', desc: 'Repeated system prompts detected in 1,420 Claude Sonnet calls. Enabling caching could cut input cost 80%.', severity: 'info', ts: '3 days ago', read: true, dismissed: false, entity: 'Claude Sonnet', change: '~$6.20 savings', actionLabel: 'View Recommendation' },
];

export const INSIGHTS: Insight[] = [
  { id: 'i-1', title: 'Route low-complexity tasks off GPT-5.6', severity: 'warning', explanation: '42% of your requests are classification and extraction tasks (< 200 output tokens) currently routed to GPT-5.6 at $15/1M output tokens.', savings: 8.40, recommendation: 'Add a smart router that scores complexity. Route < 200 token output tasks to GPT-5-mini or Gemini Flash.', provider: 'OpenAI', model: 'GPT-5.6', applied: false, category: 'model-routing', confidence: 94 },
  { id: 'i-2', title: 'Enable Anthropic prompt caching', severity: 'opportunity', explanation: 'Agent Worker repeats a 1,200-token system prompt across 3,120 Claude Sonnet calls without cache headers. Cache reads cost 90% less.', savings: 6.20, recommendation: 'Inject cache_control breakpoint (type: "ephemeral") on the top-level system message block.', provider: 'Anthropic', model: 'Claude Sonnet', applied: false, category: 'prompt-caching', confidence: 91 },
  { id: 'i-3', title: 'Shift batch jobs from Gemini 2.5 Pro to Flash', severity: 'opportunity', explanation: 'Gemini 2.5 Pro runs document parsing batches where Gemini Flash delivers 98.4% accuracy at 80% lower price.', savings: 3.80, recommendation: 'Switch batch evaluation pipeline script to Gemini Flash 2.5 with temperature 0.1.', provider: 'Google Gemini', model: 'Gemini 2.5 Pro', applied: false, category: 'model-routing', confidence: 88 },
];

function buildDays(): DayData[] {
  const result: DayData[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6;
    const m = weekend ? 0.6 : (1 + (29 - i) * 0.014);
    const openai = +(0.82 * m + Math.sin(i * 0.7) * 0.15).toFixed(2);
    const anthropic = +(0.35 * m + Math.cos(i * 0.5) * 0.08).toFixed(2);
    const google = +(0.19 * m + Math.sin(i * 0.9) * 0.05).toFixed(2);
    const other = +(0.05 * m).toFixed(2);
    const total = +(openai + anthropic + google + other).toFixed(2);
    result.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
      prev: +(total * 0.875).toFixed(2),
      openai,
      anthropic,
      google,
      other,
    });
  }
  return result;
}

export const DAYS: DayData[] = buildDays();
