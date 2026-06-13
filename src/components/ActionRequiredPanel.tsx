import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  BellRing, 
  Trash2, 
  CheckCircle2, 
  PlusCircle, 
  Info,
  ExternalLink
} from 'lucide-react';
import { ActionAlert, Severity } from '../types';

interface ActionRequiredPanelProps {
  alerts: ActionAlert[];
  isLoading: boolean;
  onResolve: (id: string) => Promise<void>;
}

export default function ActionRequiredPanel({ alerts, isLoading, onResolve }: ActionRequiredPanelProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [inspectedAlert, setInspectedAlert] = useState<ActionAlert | null>(null);

  const handleResolveAction = async (id: string) => {
    setResolvingId(id);
    try {
      await onResolve(id);
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const getSeverityStyles = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-l-2 border-l-rose-500',
          badge: 'bg-rose-50 text-rose-700 border-rose-100',
          bg: 'bg-white'
        };
      case 'high':
        return {
          border: 'border-l-2 border-l-amber-500',
          badge: 'bg-amber-50 text-amber-700 border-amber-100',
          bg: 'bg-white'
        };
      case 'medium':
        return {
          border: 'border-l-2 border-l-slate-400',
          badge: 'bg-slate-50 text-slate-705 border-slate-100',
          bg: 'bg-white'
        };
      case 'low':
        return {
          border: 'border-l-2 border-l-slate-200',
          badge: 'bg-slate-50 text-slate-500 border-slate-100',
          bg: 'bg-white'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col gap-4 shadow-2xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 animate-pulse">
          <div className="w-48 h-6 bg-slate-100" />
          <div className="w-16 h-4 bg-slate-100" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col h-full text-slate-800 text-left">
      {/* Header element */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4 text-left">
        <div className="flex items-center gap-2 text-left">
          <div className="w-2 h-2 bg-rose-500 rounded-full" />
          <div className="text-left">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
              Action Required
            </h2>
            <p className="text-[10px] text-[#64748B] font-medium font-sans">
              Operational items pending review or dispatch
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#F59E0B] tracking-wider font-mono">
          <span className="bg-rose-50 text-rose-600 px-2 py-0.5 border border-rose-100 rounded-md font-bold leading-none">{alerts.length}</span>
          <span>Alerts</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <div className="p-4 bg-slate-50 rounded-full border border-slate-100 text-[#64748B] mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-slate-900 text-sm font-bold">No outstanding issues</p>
          <p className="text-slate-500 text-xs mt-1 max-w-xs font-normal">
            All regional parameters are currently balanced.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[380px] pr-1 text-left">
          {alerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const isResolving = resolvingId === alert.id;

            return (
              <div
                id={`alert-row-${alert.id}`}
                key={alert.id}
                className={`group flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] ${styles?.border} ${styles?.bg} hover:border-[#EA580C] hover:bg-[#FFF7ED]/10 transition-all text-left`}
              >
                <div className="flex items-start gap-3 w-3/4 text-left">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                    alert.severity === 'critical' ? 'text-rose-600 bg-rose-50 border border-rose-100' :
                    alert.severity === 'high' ? 'text-amber-600 bg-amber-50 border border-amber-100' :
                    'text-slate-650 bg-slate-50 border border-slate-100'
                  }`}>
                    {alert.severity === 'critical' || alert.severity === 'high' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <div className="flex items-center flex-wrap gap-1.5 mb-1 text-left">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-550 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md">
                        {alert.module}
                      </span>
                      <span className={`text-[9.5px] font-semibold uppercase px-1.5 py-0.2 border rounded-md ${styles?.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {alert.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#0F172A] font-medium leading-relaxed line-clamp-2">
                      {alert.message.replace('Governance Scope:', '').replace('Operational Security Gate:', '')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    id={`alert-inspect-${alert.id}`}
                    aria-label="Inspect alert details"
                    onClick={() => setInspectedAlert(alert)}
                    className="p-1.5 px-3 text-[#334155] hover:text-[#EA580C] hover:bg-[#FFF7ED] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-transparent"
                  >
                    View
                  </button>
                  <button
                    id={`alert-resolve-${alert.id}`}
                    aria-label="Resolve alert task"
                    disabled={isResolving}
                    onClick={() => handleResolveAction(alert.id)}
                    className="flex items-center gap-1 p-1.5 px-3 bg-slate-900 border border-slate-900 hover:bg-[#EA580C] hover:border-[#EA580C] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isResolving ? 'Resolving...' : `${alert.actionLabel}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visual Inspector detailed modal */}
      {inspectedAlert && (
        <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full border border-slate-200 shadow-xl p-6 relative text-left animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2 font-display">
              <Info className="w-5 h-5 text-amber-500" />
              <span>Incident Details</span>
            </h3>
            
            <div className="my-4 space-y-3 bg-slate-50 rounded-xl p-4 border border-[#E5E7EB]">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Reference ID</span>
                <span className="text-xs font-mono font-bold text-slate-500">{inspectedAlert.id}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Category</span>
                <span className="text-xs font-bold text-[#0F172A]">{inspectedAlert.module}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Message</span>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">{inspectedAlert.message}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Logged At</span>
                <span className="text-xs text-slate-600 font-mono font-medium">{inspectedAlert.date}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Recommended Action</span>
                <span className="text-xs font-semibold text-[#D97706] bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-lg inline-block">
                  {inspectedAlert.actionLabel} Procedure
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                id="close-inspector-btn"
                onClick={() => setInspectedAlert(null)}
                className="p-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
              <button
                id="resolve-from-inspector-btn"
                disabled={resolvingId === inspectedAlert.id}
                onClick={() => {
                  handleResolveAction(inspectedAlert.id);
                  setInspectedAlert(null);
                }}
                className="p-2 px-4 bg-slate-900 hover:bg-[#EA580C] text-white rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer border border-transparent shadow-xs"
              >
                Resolve Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
