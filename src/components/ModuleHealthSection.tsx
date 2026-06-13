import React, { useState } from 'react';
import { 
  ShieldCheck, 
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { ModuleHealth, HealthStatus } from '../types';

interface ModuleHealthSectionProps {
  healthData: ModuleHealth[];
  isLoading: boolean;
}

export default function ModuleHealthSection({ healthData, isLoading }: ModuleHealthSectionProps) {
  const [showFormulaFor, setShowFormulaFor] = useState<string | null>(null);

  const getStatusVisuals = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-100',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3 h-3" />,
          barBg: 'bg-emerald-500'
        };
      case 'attention':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-100',
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="w-3 h-3" />,
          barBg: 'bg-amber-500'
        };
      case 'critical':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-100',
          dot: 'bg-rose-500',
          icon: <XCircle className="w-3 h-3" />,
          barBg: 'bg-rose-500'
        };
    }
  };

  const formulaGuidelines: Record<string, string> = {
    'Correspondence': "100 - (Returned Mail / Total Dispatch * 500). Penalizes failed postal handovers.",
    'Subscriptions': "100 - (Critical License alerts * 15 + Expired Services * 5). Reflects budgeting availability.",
    'Inventory': "100 - (Out of stock * 8 + Low stock items * 3). Prevents department equipment shortfall.",
    'Fuel': "100 - (Disburse entries matching cost spikes > $150 * 15). Controls procurement wastage.",
    'Printer': "100 - (Active mechanical jams * 12 + low toner lines * 3). Monitors office equipment uptime.",
    'Documents': "100 - (Policy flagged items * 25 + pending verifications * 2). Protects security classification compliance."
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col gap-4 animate-pulse">
        <div className="w-40 h-6 bg-slate-100 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col h-full text-slate-800">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5 select-none">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#64748B]" />
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
              Department Performance Metrics
            </h2>
            <p className="text-[10px] text-[#64748B] font-medium font-sans">
              Operational reliability indicators tracked in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-grow">
        {healthData.map((module) => {
          const vis = getStatusVisuals(module.status);

          return (
            <div
              id={`module-health-row-${module.name.toLowerCase()}`}
              key={module.name}
              className="group relative bg-[#FFFFFF] hover:border-[#EA580C] hover:bg-[#FFF7ED]/10 border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all duration-200"
            >
              {/* Top info */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-[#EA580C] transition-colors">
                    {module.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                    {module.lastChecked}
                  </span>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-1">
                  <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-tight py-0.5 px-2 rounded-lg border border-solid ${vis?.bg}`}>
                    {vis?.icon}
                    <span>{module.score}%</span>
                  </div>

                  {/* formula trigger icon */}
                  <button
                    id={`formula-indicator-${module.name.toLowerCase()}`}
                    aria-label={`Show health formula for ${module.name}`}
                    onClick={() => setShowFormulaFor(showFormulaFor === module.name ? null : module.name)}
                    className="text-slate-450 hover:text-slate-750 hover:bg-slate-50 rounded-lg p-0.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="mt-3">
                <div className="flex justify-between items-center text-[9px] font-bold text-[#64748B] uppercase tracking-wider mb-1 select-none">
                  <span>Score</span>
                  <span className="lowercase font-medium text-[#64748B]">{module.score >= 85 ? 'nominal' : 'attention required'}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${vis?.barBg}`}
                    style={{ width: `${module.score}%` }}
                  />
                </div>
              </div>

              {/* Formula details banner */}
              {showFormulaFor === module.name && (
                <div className="absolute inset-0 z-10 bg-white border border-amber-300 text-slate-800 text-[10px] font-semibold rounded-xl p-4 shadow-md flex flex-col justify-between animate-fadeIn">
                  <div>
                    <span className="text-[9px] text-[#EA580C] uppercase tracking-wide font-bold block mb-1">
                      Measurement Rule
                    </span>
                    <p className="font-semibold text-slate-900 leading-normal mb-1">
                      {formulaGuidelines[module.name]}
                    </p>
                    <p className="text-slate-500 font-medium text-[9px] leading-snug">
                      {module.description}
                    </p>
                  </div>
                  <button
                    id={`formula-hide-${module.name.toLowerCase()}`}
                    aria-label="Hide formulas"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFormulaFor(null);
                    }}
                    className="self-end text-[9px] text-[#EA580C] hover:text-[#B45309] font-bold mt-1 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
