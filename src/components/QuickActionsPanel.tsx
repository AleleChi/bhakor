import React from 'react';
import { 
  Mail, 
  Calendar, 
  Package, 
  Fuel, 
  FileText,
  Zap,
  PlusCircle
} from 'lucide-react';

interface QuickActionsProps {
  onQuickAction: (actionType: string) => void;
}

export default function QuickActionsPanel({ onQuickAction }: QuickActionsProps) {
  const actions = [
    {
      id: 'Correspondence',
      title: 'Correspondence',
      desc: 'Log incoming or outgoing mail tracking items',
      icon: <Mail className="w-4 h-4" />,
      color: 'bg-white border-slate-200 hover:bg-[#FFF7ED]/20 hover:border-[#EA580C] text-[#0F172A]',
      iconBg: 'bg-slate-50 text-[#64748B]'
    },
    {
      id: 'Subscriptions',
      title: 'Subscription',
      desc: 'Register new vendor software license details',
      icon: <Calendar className="w-4 h-4" />,
      color: 'bg-white border-slate-200 hover:bg-[#FFF7ED]/20 hover:border-[#EA580C] text-[#0F172A]',
      iconBg: 'bg-slate-50 text-[#64748B]'
    },
    {
      id: 'Inventory',
      title: 'Inventory Item',
      desc: 'Log new supply assets or office equipment stock',
      icon: <Package className="w-4 h-4" />,
      color: 'bg-white border-slate-200 hover:bg-[#FFF7ED]/20 hover:border-[#EA580C] text-[#0F172A]',
      iconBg: 'bg-slate-50 text-[#64748B]'
    },
    {
      id: 'Fuel',
      title: 'Refueling Log',
      desc: 'Log regional vehicle refueling expenses',
      icon: <Fuel className="w-4 h-4" />,
      color: 'bg-white border-slate-200 hover:bg-[#FFF7ED]/20 hover:border-[#EA580C] text-[#0F172A]',
      iconBg: 'bg-slate-50 text-[#64748B]'
    },
    {
      id: 'Documents',
      title: 'Document Upload',
      desc: 'Commit policy contracts or operational manual PDFs',
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-white border-slate-200 hover:bg-[#FFF7ED]/20 hover:border-[#EA580C] text-[#0F172A]',
      iconBg: 'bg-slate-50 text-[#64748B]'
    }
  ];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs text-slate-800 text-left">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB] mb-5 text-left">
        <div className="p-1.5 bg-amber-50 text-[#EA580C] rounded-lg border border-amber-100">
          <Zap className="w-4 h-4 fill-[#EA580C]" />
        </div>
        <div className="text-left">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">
            Quick Actions
          </h2>
          <p className="text-[10px] text-[#64748B] font-medium font-sans">
            Create new logs across administrative modules instantly
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {actions.map((act) => (
          <button
            id={`quick-action-${act.id.toLowerCase()}`}
            key={act.id}
            onClick={() => onQuickAction(act.id)}
            className={`group text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[145px] outline-hidden ${act.color}`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className={`p-1.5 rounded-lg border border-[#E5E7EB] ${act.iconBg} group-hover:bg-[#FFF7ED] group-hover:border-orange-100 transition-all`}>
                {act.icon}
              </div>
              <PlusCircle className="w-4 h-4 text-[#EA580C] opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div>
              <p className="text-xs font-bold leading-none text-slate-900 group-hover:text-[#EA580C]">
                Log {act.title}
              </p>
              <p className="text-[10.5px] text-[#64748B] leading-snug mt-2 font-normal">
                {act.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
