import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  DollarSign,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { ExecutiveInsight } from '../types';

interface ExecutiveInsightsSectionProps {
  insights: ExecutiveInsight[];
  onRegenerate: () => Promise<void>;
  isLoading: boolean;
  isGeneratingAI: boolean;
  usingMock: boolean;
}

export default function ExecutiveInsightsSection({ 
  insights, 
  onRegenerate, 
  isLoading, 
  isGeneratingAI,
  usingMock
}: ExecutiveInsightsSectionProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const getCategoryDetails = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'risk':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          label: 'Risk',
          tagClass: 'text-orange-700 bg-orange-50 border-orange-150',
          badgeText: 'Requires Attention'
        };
      case 'cost':
        return {
          icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
          label: 'Cost',
          tagClass: 'text-emerald-700 bg-emerald-50 border-emerald-150',
          badgeText: 'Recommended Action'
        };
      case 'operations':
      case 'efficiency':
      default:
        return {
          icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
          label: 'Operations',
          tagClass: 'text-blue-700 bg-blue-50 border-blue-150',
          badgeText: 'For Review'
        };
    }
  };

  const safeInsights = insights && insights.length > 0 ? insights : [
    {
      id: 'ins-01',
      category: 'risk',
      impact: 'HIGH',
      insight: 'Vendor contract review required before renewal.',
      details: 'Analyze service agreements for regional logistics providers to prevent auto-renewals on unnegotiated rates.'
    },
    {
      id: 'ins-02',
      category: 'cost',
      impact: 'HIGH',
      insight: 'Printer spending increased 12% this month.',
      details: 'High toner dispatch volumes identified at Sector C desk. Optimize digital sign-off tools to reduce raw volume.'
    },
    {
      id: 'ins-03',
      category: 'efficiency',
      impact: 'MEDIUM',
      insight: 'Three fleet vehicles are due for maintenance within 14 days.',
      details: 'Dispatch logs indicate these service vehicles have surpassed mileage safety buffers. Schedule shop visits.'
    }
  ];

  if (isLoading || isGeneratingAI) {
    return (
      <div className="bg-white text-[#0F172A] p-6 rounded-[20px] border border-[#E5E7EB] shadow-xs flex flex-col justify-between h-full min-h-[440px]">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 font-display">
            Executive Insights
          </h2>
          <p className="text-xs text-slate-500 mt-1">Analyzing state records for recent trends...</p>
        </div>

        <div className="my-8 py-4 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-amber-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Generating operations summary
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Correlating correspondence logs, active fleet vouchers, and subscription licensing milestones...
            </p>
          </div>
        </div>

        <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white text-[#0F172A] p-6 rounded-[20px] border border-[#E5E7EB] shadow-xs flex flex-col justify-between h-full min-h-[440px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="text-left">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 font-display">
              Executive Insights
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Automated analysis of operational trends</p>
          </div>
        </div>

        {/* Insight Card Elements */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {safeInsights.map((ins) => {
            const details = getCategoryDetails(ins.category);
            const isExpanded = expandedInsight === ins.id;

            return (
              <div
                id={`insight-brief-${ins.id}`}
                key={ins.id}
                onClick={() => setExpandedInsight(isExpanded ? null : ins.id)}
                className="group border border-slate-100 hover:border-amber-500 rounded-[16px] p-4 bg-white transition-all duration-200 cursor-pointer text-left shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-amber-50 transition-colors border border-slate-100">
                      {details.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md uppercase font-sans border ${details.tagClass}`}>
                          {details.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {details.badgeText}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 mt-1.5 group-hover:text-[#EA580C] transition-colors leading-medium">
                        {ins.insight}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-slate-400 group-hover:text-amber-600 transition-colors self-center shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 animate-fadeIn">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ins.details || 'Secondary compliance review matches core department ledger trends.'}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400">
                      Activity Node ID: #{ins.id}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Button Action Block */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          id="regenerate-insights-btn"
          onClick={onRegenerate}
          className="w-full py-2.5 px-4 bg-white hover:bg-amber-50 active:bg-amber-100/50 text-[#334155] hover:text-[#EA580C] border border-[#E5E7EB] hover:border-amber-200 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Update Insights</span>
        </button>
      </div>
    </div>
  );
}
