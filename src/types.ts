export type Page = 'dashboard' | 'usage' | 'providers' | 'models' | 'budgets' | 'insights' | 'alerts' | 'settings';

export interface Provider {
  id: string;
  name: string;
  connected: boolean;
  spend: number;
  pct: number;
  color: string;
  requests: number;
  models: number;
  latency: number;
  status: 'operational' | 'degraded';
  apiKey: string;
  lastSynced: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerColor: string;
  inputCost: number;
  outputCost: number;
  requests: number;
  tokens: number;
  monthlyCost: number;
  pct: number;
  efficiency: number;
  tier: string;
  context: string;
}

export interface UsageEvent {
  id: string;
  ts: string;
  provider: string;
  providerColor: string;
  model: string;
  type: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  latency: number;
  project: string;
  status: number;
}

export interface DayData {
  date: string;
  label: string;
  total: number;
  prev: number;
  openai: number;
  anthropic: number;
  google: number;
  other: number;
}

export interface Budget {
  id: string;
  name: string;
  scope: string;
  limit: number;
  spent: number;
  warn: number;
  crit: number;
  alerts: boolean;
  hardCap: boolean;
}

export interface Alert {
  id: string;
  title: string;
  desc: string;
  severity: 'critical' | 'warning' | 'info';
  ts: string;
  read: boolean;
  dismissed: boolean;
  entity: string;
  change?: string;
  actionLabel?: string;
}

export interface Insight {
  id: string;
  title: string;
  severity: 'warning' | 'opportunity' | 'info' | 'critical';
  explanation: string;
  savings: number;
  recommendation: string;
  provider: string;
  model: string;
  applied: boolean;
  category: string;
  confidence: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}
