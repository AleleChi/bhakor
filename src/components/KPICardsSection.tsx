import React from 'react';
import { Mail, Calendar, Package, Fuel } from 'lucide-react';
import { KPIStats } from '../types';

interface KPICardsSectionProps {
  kpis: KPIStats[];
  onCardClick: (moduleName: string) => void;
  isLoading: boolean;
}

export default function KPICardsSection({ kpis, onCardClick, isLoading }: KPICardsSectionProps) {
  // Render clean standard icons for our selected modules
  const getIcon = (title: string) => {
    const props = { className: "w-5 h-5 text-[#64748B]" };
    const t = title.toLowerCase();
    if (t.includes('correspondence') || t.includes('mail')) return <Mail {...props} />;
    if (t.includes('subscription')) return <Calendar {...props} />;
    if (t.includes('inventory') || t.includes('asset')) return <Package {...props} />;
    return <Fuel {...props} />;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ooms-card p-6 animate-pulse flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-slate-100 rounded" />
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="w-16 h-8 bg-slate-100 rounded" />
            <div className="w-32 h-3 bg-slate-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Find actual numbers inside kpis database values if available, else bind standard executive defaults
  const findKPIValue = (titleKeyword: string, defaultValue: string): string => {
    const found = kpis?.find(k => k.title.toLowerCase().includes(titleKeyword));
    return found ? String(found.value) : defaultValue;
  };

  const findKPIChange = (titleKeyword: string, defaultChange: string): string => {
    const found = kpis?.find(k => k.title.toLowerCase().includes(titleKeyword));
    return found ? found.change : defaultChange;
  };

  const items = [
    {
      title: "Correspondence Logged",
      module: "Correspondence",
      value: findKPIValue("correspondence", "12,431"),
      change: findKPIChange("correspondence", "+8% this month"),
      desc: "Incoming and outgoing tracked office mail logs"
    },
    {
      title: "Active Subscriptions",
      module: "Subscriptions",
      value: findKPIValue("subscription", "87 Licenses"),
      change: findKPIChange("subscription", "All nominal"),
      desc: "Active vendor licensing agreements"
    },
    {
      title: "Assets in Inventory",
      module: "Inventory",
      value: findKPIValue("inventory", "2,540 Items"),
      change: findKPIChange("inventory", "Stable stock"),
      desc: "Monitored supply items across warehouses"
    },
    {
      title: "Active Vehicles",
      module: "Fleet",
      value: findKPIValue("fleet", "24 Vehicles"),
      change: findKPIChange("fleet", "Active"),
      desc: "Licensed operating administrative vehicles"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <div
          key={idx}
          onClick={() => onCardClick(item.module)}
          className="group relative ooms-card ooms-card-hover p-6 cursor-pointer flex flex-col justify-between text-left h-full"
        >
          {/* Top Row: Title & Mini Icon */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#64748B] group-hover:text-[#0F172A] uppercase tracking-wider block font-sans">
                {item.title}
              </span>
              <p className="text-[10px] text-slate-450 mt-0.5 leading-none font-normal font-sans">
                {item.desc}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 group-hover:bg-[#FFF7ED] rounded-xl transition-colors border border-slate-100 group-hover:border-orange-100">
              {getIcon(item.title)}
            </div>
          </div>

          {/* Bottom Row: Large Numeric Indicator */}
          <div className="mt-6 flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-[#0F172A] tracking-tight font-display">
              {item.value}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 group-hover:bg-[#FFF7ED] group-hover:text-[#D97706] group-hover:border-[#F59E0B]">
              {item.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
