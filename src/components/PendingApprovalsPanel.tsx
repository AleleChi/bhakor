import React, { useState } from 'react';
import { Check, ClipboardList, Clock, AlertCircle } from 'lucide-react';
import { ActionAlert } from '../types';

interface PendingApprovalsPanelProps {
  alerts: ActionAlert[];
  isLoading: boolean;
  onResolve: (id: string) => Promise<void>;
}

export default function PendingApprovalsPanel({ alerts, isLoading, onResolve }: PendingApprovalsPanelProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Filter for approvals / actions (Correspondence, Subscriptions, Documents)
  const approvalAlerts = alerts.filter(
    (alert) =>
      alert.module === 'Subscriptions' ||
      alert.module === 'Documents' ||
      alert.module === 'Correspondence' ||
      alert.actionType === 'approve'
  );

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await onResolve(id);
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs h-full animate-pulse">
        <div className="w-1/2 h-4 bg-slate-100 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-slate-50 rounded-xl" />
          <div className="h-12 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col h-full text-slate-800 text-left">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4 text-left">
        <ClipboardList className="w-5 h-5 text-[#64748B]" />
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
            Pending Approvals
          </h2>
          <p className="text-[10px] text-[#64748B] font-medium font-sans">
            Transactions and licensing requiring executive sign-off
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto max-h-[350px] space-y-3 pr-1">
        {approvalAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Clock className="w-6 h-6 text-slate-300 mb-2" />
            <p className="font-semibold text-xs text-slate-700">All Approvals Clear</p>
            <p className="text-[11px]">No items are currently awaiting authorization.</p>
          </div>
        ) : (
          approvalAlerts.map((alert) => {
            const isResolving = resolvingId === alert.id;
            return (
              <div
                key={alert.id}
                className="p-3.5 bg-white border border-slate-200 hover:border-[#EA580C] hover:bg-[#FFF7ED]/20 rounded-xl transition-all flex items-start justify-between gap-3 text-left"
              >
                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-slate-50 text-[#64748B] border border-slate-150 rounded-md">
                      {alert.module}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">{alert.date}</span>
                  </div>
                  <p className="text-xs text-[#0F172A] font-medium leading-relaxed break-words">
                    {alert.message.replace('Governance Scope:', '').replace('Operational Security Gate:', '')}
                  </p>
                </div>

                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={isResolving}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-[#EA580C] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isResolving ? 'Running...' : alert.actionLabel || 'Approve'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
