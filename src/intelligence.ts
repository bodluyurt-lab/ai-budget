import type { Insight } from './types';
import { PROVIDERS, MODELS, DAYS, INSIGHTS } from './data';

export interface AnalysisResult {
  analyzedAt: string;
  requestsAnalyzed: number;
  totalSavings: number;
  insights: Insight[];
  trends: {
    wowChangePct: number;
    momChangePct: number;
    avgCostPerRequest: number;
    topSpenderModel: string;
    expensiveRatio: number;
  };
}

export function analyzeUsage(): AnalysisResult {
  const last7 = DAYS.slice(-7).reduce((a, d) => a + d.total, 0);
  const prev7 = DAYS.slice(-14, -7).reduce((a, d) => a + d.total, 0);
  const wowChangePct = prev7 > 0 ? +((last7 - prev7) / prev7 * 100).toFixed(1) : 25.0;
  const currMonth = DAYS.reduce((a, d) => a + d.total, 0);
  const prevMonth = DAYS.reduce((a, d) => a + d.prev, 0);
  const momChangePct = prevMonth > 0 ? +((currMonth - prevMonth) / prevMonth * 100).toFixed(1) : 12.4;
  const totalRequests = PROVIDERS.reduce((a, p) => a + p.requests, 0);
  const totalSpend = PROVIDERS.reduce((a, p) => a + p.spend, 0);
  const topModel = [...MODELS].sort((a, b) => b.monthlyCost - a.monthlyCost)[0];
  const totalSavings = +INSIGHTS.reduce((a, i) => a + i.savings, 0).toFixed(2);

  return {
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    requestsAnalyzed: totalRequests,
    totalSavings,
    insights: INSIGHTS.map(i => ({ ...i, applied: false })),
    trends: {
      wowChangePct,
      momChangePct,
      avgCostPerRequest: +(totalSpend / totalRequests).toFixed(5),
      topSpenderModel: topModel.name,
      expensiveRatio: 0.42,
    },
  };
}

export function getContextualAnswer(q: string): { text: string; pill?: { label: string; value: string } } {
  const lower = q.toLowerCase();
  const totalSpend = PROVIDERS.reduce((a, p) => a + p.spend, 0);
  const totalRequests = PROVIDERS.reduce((a, p) => a + p.requests, 0);
  const totalSavings = +INSIGHTS.reduce((a, i) => a + i.savings, 0).toFixed(2);
  const topModel = [...MODELS].sort((a, b) => b.monthlyCost - a.monthlyCost)[0];

  if (lower.includes('why') || lower.includes('increase') || lower.includes('spike')) {
    return {
      text: `Spending jumped 12.4% month-over-month (+25% this week). The main driver is GPT-5.6 at $14.20 — 42% of those requests are simple classification tasks better suited to a cheaper model.`,
      pill: { label: 'Primary driver', value: 'GPT-5.6 +24% WoW' },
    };
  }
  if (lower.includes('most') || lower.includes('expensive') || lower.includes('cost me')) {
    return {
      text: `${topModel.name} is your costliest model at $${topModel.monthlyCost.toFixed(2)}/mo (${topModel.pct}% of total spend) across ${topModel.requests.toLocaleString()} requests. Average cost per call: $${(topModel.monthlyCost / topModel.requests).toFixed(4)}.`,
      pill: { label: 'Top cost model', value: `${topModel.name} ($${topModel.monthlyCost.toFixed(2)})` },
    };
  }
  if (lower.includes('save') || lower.includes('reduc') || lower.includes('optim') || lower.includes('cut')) {
    return {
      text: `You have $${totalSavings.toFixed(2)}/mo in actionable savings. Highest ROI: routing 42% of low-complexity requests from GPT-5.6 to GPT-5-mini saves ~$8.40. Enabling Anthropic prompt caching adds another $6.20.`,
      pill: { label: 'Potential savings', value: `$${totalSavings.toFixed(2)} / month` },
    };
  }
  if (lower.includes('cheap') || lower.includes('lowest') || lower.includes('provider')) {
    return {
      text: `For high-throughput tasks, Google Gemini Flash ($0.15/1M input) offers the lowest unit cost. OpenAI is your largest expense at 58.2% of total spend.`,
      pill: { label: 'Best value', value: 'Gemini Flash $0.15/1M' },
    };
  }
  return {
    text: `Across ${totalRequests.toLocaleString()} requests and ${PROVIDERS.length} providers, you've spent $${totalSpend.toFixed(2)} this month. Projected total: $58.20. You have $${totalSavings.toFixed(2)} in identified savings ready to apply.`,
    pill: { label: 'This month', value: `$${totalSpend.toFixed(2)} spent` },
  };
}
