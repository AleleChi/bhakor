import React, { useState } from 'react';
import { AlertTriangle, Package, Check } from 'lucide-react';
import { ActionAlert } from '../types';

interface InventoryAlertsPanelProps {
  alerts: ActionAlert[];
  isLoading: boolean;
  onResolve: (id: string) => Promise<void>;
}

export default function InventoryAlertsPanel({ alerts, isLoading, onResolve }: InventoryAlertsPanelProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Filter for inventory / equipment / printer alerts
  const inventoryAlerts = alerts.filter(
    (alert) =>
      alert.module === 'Inventory' ||
      alert.module === 'Printer' ||
      alert.module === 'Fuel' ||
      alert.message.toLowerCase().includes('stock') ||
      alert.message.toLowerCase().includes('toner') ||
      alert.message.toLowerCase().includes('equip')
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
        <Package className="w-5 h-5 text-[#64748B]" />
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
            Inventory & Supply Alerts
          </h2>
          <p className="text-[10px] text-[#64748B] font-medium font-sans">
            Stock shortages, hardware events and maintenance warnings
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto max-h-[350px] space-y-3 pr-1">
        {inventoryAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Check className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="font-semibold text-xs text-slate-700">Supplies Nominal</p>
            <p className="text-[11px]">All stock thresholds and hardware units are stable.</p>
          </div>
        ) : (
          inventoryAlerts.map((alert) => {
            const isResolving = resolvingId === alert.id;
            return (
              <div
                key={alert.id}
                className="p-3.5 bg-white border border-slate-200 hover:border-[#EF4444] hover:bg-rose-50/20 rounded-xl transition-all flex items-start justify-between gap-3 text-left border-l-2 border-l-[#EF4444]"
              >
                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-rose-50 text-[#EF4444] border border-rose-100 rounded-md">
                      {alert.module} Warning
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
                  className="px-3 py-1.5 bg-slate-900 hover:bg-[#EF4444] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isResolving ? 'Resolving...' : alert.actionLabel || 'Dispatch'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
