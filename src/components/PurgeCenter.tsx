import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RefreshCw, 
  History, 
  Settings, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon,
  Download,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../lib/api';

interface PurgeCenterProps {
  token: string | null;
  currentUser: any;
}

export default function PurgeCenter({ token, currentUser }: PurgeCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'purge' | 'history' | 'cleanup'>('purge');
  const [archivedRecords, setArchivedRecords] = useState<Record<string, any[]>>({});
  const [selectedModule, setSelectedModule] = useState<string>('Correspondence');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [purgeConfirmation, setPurgeConfirmation] = useState<string>('');
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Purge History log states
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Production Clean-up states
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleanupReport, setCleanupReport] = useState<any | null>(null);

  const fetchArchived = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/governance/archived`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArchivedRecords(data || {});
        setSelectedIds([]);
        setPurgeConfirmation('');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Unable to retrieve archived metadata audits.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error fetching archived repository logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/governance/purge-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchArchived();
      fetchHistory();
    }
  }, [token]);

  const handleExecutePurge = async () => {
    if (selectedIds.length === 0) return;
    const expectedConfirm = `DELETE ${selectedIds.length} ${selectedModule.toUpperCase()} RECORDS`;
    if (purgeConfirmation.trim().toUpperCase() !== expectedConfirm) {
      toast.error(`Confirmation string is invalid. Expected: "${expectedConfirm}"`, {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
      return;
    }

    setIsPurging(true);
    try {
      const res = await fetch(`${API_URL}/api/governance/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleName: selectedModule,
          ids: selectedIds,
          confirmation: purgeConfirmation.trim()
        })
      });

      if (res.ok) {
        toast.success(`Successfully purged ${selectedIds.length} records from production permanently.`, {
          style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#10B981' }
        });
        fetchArchived();
        fetchHistory();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Purge failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to complete metadata purge.');
    } finally {
      setIsPurging(false);
    }
  };

  const handleExecuteCleanup = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to run the Production Cleanup Utility? This will permanently remove demo records, invites, test logs, and stale user sessions. This action is irreversible.')) {
      return;
    }

    setIsCleaning(true);
    try {
      const res = await fetch(`${API_URL}/api/governance/production-cleanup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCleanupReport(data.report || {});
        toast.success('Production Cleanup report compiled successfully! Demo environments liquidated.');
        fetchArchived();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Cleanup operation failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Cleanup operation failed.');
    } finally {
      setIsCleaning(false);
    }
  };

  const availableModules = Object.keys(archivedRecords);
  const currentArchivedList = archivedRecords[selectedModule] || [];
  const confirmationPromptString = `DELETE ${selectedIds.length} ${selectedModule.toUpperCase()} RECORDS`;
  const isButtonEnabled = purgeConfirmation.trim().toUpperCase() === confirmationPromptString;

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-4 shadow-sm font-sans mt-8 select-none">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-full text-rose-500 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Operational Clearance Required</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
          Data Governance and Permanent Purge operations are strictly locked behind the **SUPER_ADMIN** regulatory tier.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* HEADER BAR */}
      <div className="bg-white border-l-4 border-l-[#F59E0B] border-y border-r border-[#E4E7EC] p-6 rounded-r-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs select-none">
        <div>
          <h3 className="text-base font-bold text-[#111827] font-sans">
            Enterprise Governance Core
          </h3>
          <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider font-mono mt-1">
            Archival Controls • Compliance Audits • Purge History
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('purge')}
            className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'purge'
                ? 'bg-[#101828] text-white'
                : 'bg-white text-[#475467] border border-[#D0D5DD] hover:bg-slate-50'
            }`}
          >
            Purge Center
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-[#101828] text-white'
                : 'bg-white text-[#475467] border border-[#D0D5DD] hover:bg-slate-50'
            }`}
          >
            Purge History Log
          </button>
          <button
            onClick={() => setActiveSubTab('cleanup')}
            className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'cleanup'
                ? 'bg-[#101828] text-white'
                : 'bg-white text-[#475467] border border-[#D0D5DD] hover:bg-slate-50'
            }`}
          >
            Production Cleanup
          </button>
        </div>
      </div>

      {activeSubTab === 'purge' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT SELECT MODULE BAR */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col gap-1.5 shadow-2xs select-none h-fit">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono px-2 pb-2.5 border-b border-slate-50 mb-2">
              Filter by Module
            </span>
            {availableModules.map((m) => {
              const active = selectedModule === m;
              const count = archivedRecords[m]?.length || 0;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedModule(m);
                    setSelectedIds([]);
                    setPurgeConfirmation('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#FFF7ED] text-[#D97706] border-l-2 border-[#F59E0B] px-3.5' 
                      : 'text-slate-650 hover:bg-[#FFF7ED]/30 hover:text-slate-900 border-l-2 border-transparent'
                  }`}
                >
                  <span className="truncate">{m}</span>
                  <span className="text-[9px] font-mono bg-slate-100 hover:bg-slate-205 px-2 py-0.5 rounded-full font-extrabold text-slate-500">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MAIN RECORD ARCHIVE AREA */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[480px]">
              
              {/* WARNING BANNER */}
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start gap-3 select-none">
                <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider font-sans">
                    Warning: Production Pure Center Operational Protocol
                  </h4>
                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5 leading-relaxed">
                    Records in this quarantine have been soft-deleted. Purging permanently will wipe them and any structural dependencies from the database. Exact typed string signatures are enforced.
                  </p>
                </div>
              </div>

              {/* RECORD DISPLAY AND CHECKBOX MULTISELECT */}
              <div className="flex-1 overflow-x-auto">
                {isLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">
                      Querying archived metadata repository...
                    </span>
                  </div>
                ) : currentArchivedList.length === 0 ? (
                  <div className="py-24 text-center select-none text-slate-401 flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-full">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mt-1">Registry Quarantine Is Safe</p>
                    <p className="text-[10px] text-slate-450 font-semibold">No archived or soft-deleted records exist inside the {selectedModule} module.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr>
                        <th className="h-11 px-4 text-center bg-[#0F172A] border-b border-[#E5E7EB] w-12 text-[10px] font-extrabold text-white">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-amber-550 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                            checked={selectedIds.length === currentArchivedList.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(currentArchivedList.map(r => r.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Record Reference</th>
                        <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Archived On</th>
                        <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Archived By Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentArchivedList.map((r) => {
                        const checked = selectedIds.includes(r.id);
                        return (
                          <tr 
                            key={r.id}
                            className={`hover:bg-slate-50/50 cursor-pointer ${checked ? 'bg-amber-50/20' : ''}`}
                            onClick={() => {
                              if (checked) {
                                setSelectedIds(selectedIds.filter(id => id !== r.id));
                              } else {
                                setSelectedIds([...selectedIds, r.id]);
                              }
                            }}
                          >
                            <td className="py-3 px-4 text-center w-12" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-amber-550 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds([...selectedIds, r.id]);
                                  } else {
                                    setSelectedIds(selectedIds.filter(id => id !== r.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-900 font-sans max-w-[320px] truncate">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">
                                  {r.trackingNumber || r.fileName || r.itemName || r.printerName || r.name || r.serviceName || r.vehiclePlate || 'System Record'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">#{r.id}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                              {new Date(r.archivedAt).toLocaleString('en-US', { hour12: true })}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-amber-700">
                              {r.archivedBy}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PURGE CONTROLS FOOTER */}
              {selectedIds.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-[#E5E7EB] space-y-4">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex-1 w-full max-w-md space-y-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 leading-none block font-mono">
                        Security Signature Confirmation Enforced *
                      </label>
                      <input
                        type="text"
                        placeholder={`Type: ${confirmationPromptString}`}
                        value={purgeConfirmation}
                        onChange={(e) => setPurgeConfirmation(e.target.value)}
                        className="w-full text-xs font-mono rounded-xl py-3 px-4 bg-white border border-[#E5E7EB] focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 outline-hidden tracking-wide transition-all font-bold shadow-2xs"
                      />
                    </div>
                    <button
                      onClick={handleExecutePurge}
                      disabled={!isButtonEnabled || isPurging}
                      className={`flex items-center gap-2 px-6 py-3 font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans h-11 border ${
                        isButtonEnabled 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-xs' 
                          : 'bg-slate-100 text-slate-400 border-[#E5E7EB] cursor-not-allowed'
                      }`}
                    >
                      {isPurging ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      PERMANENTLY PURGE RECORDS
                    </button>
                  </div>
                  <div className="flex items-center gap-2 select-none text-[9.5px] font-bold font-mono uppercase tracking-wider text-slate-450 leading-none">
                    <span>* Protocol Prompt:</span>
                    <span className="text-rose-700 font-extrabold">{confirmationPromptString}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex items-center justify-between select-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
              Secure Metadata Purge History Auditor
            </span>
            <History className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoadingHistory ? (
              <div className="py-24 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">
                  Scanning system audit matrix...
                </span>
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="py-24 text-center select-none text-slate-401 flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-full">
                  <Terminal className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mt-1">Purge Archive Is Clean</p>
                <p className="text-[10px] text-slate-450 font-semibold">No permanent metadata purge activities recorded since system initialization.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr>
                    <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Timestamp</th>
                    <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Responsible Super Admin</th>
                    <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Module</th>
                    <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Purged Records</th>
                    <th className="h-11 px-4 text-[10px] font-extrabold text-white bg-[#0F172A] border-b border-[#E5E7EB] uppercase tracking-widest leading-none">Audit Record Log ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 select-text">
                  {historyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString('en-US', { hour12: true })}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-905 leading-none">{log.userName}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{log.userEmail}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono font-bold text-amber-600">
                        {log.module}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-md text-rose-800 text-[10px] font-bold font-mono">
                          {log.recordCount} records purged
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#64748B] font-bold">
                        #{log.id.slice(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'cleanup' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs space-y-4 h-fit select-none text-center md:text-left">
            <div className="p-3.5 bg-[#FFF7ED] text-[#D97706] border border-[#FED7AA] rounded-full w-fit mx-auto md:mx-0">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <h4 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-sans">
              Production Cleanup Utility
            </h4>
            <p className="text-xs text-[#475467] leading-relaxed font-semibold">
              Wipes all default demo roles, seeded sample logs, test documents, artificial invitations, unassigned mock print jobs, and stale diagnostic websocket sessions. Safe to execute once in production to prepare OOMS launch.
            </p>
            <button
              onClick={handleExecuteCleanup}
              disabled={isCleaning}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer h-12 shadow-xs"
            >
              {isCleaning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              RUN FIRST-TIME CLEANUP
            </button>
          </div>

          <div className="md:col-span-2 bg-slate-900 border border-slate-950 rounded-2xl shadow-xl overflow-hidden min-h-[420px] flex flex-col font-mono text-emerald-400">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-990 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400">
              <span>Diagnostic Purge Output console</span>
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="p-6 flex-1 text-xs space-y-3 leading-relaxed overflow-y-auto select-all max-h-[460px]">
              <div>$ ooms-governance init --purge-demo</div>
              <div>&gt; Establising secured system administrative handshakes... verified.</div>
              {cleanupReport ? (
                <div className="space-y-2 text-emerald-305 mt-4">
                  <div className="text-emerald-520 font-bold border-b border-slate-800 pb-1 mb-2">SYSTEM CLEANUP REPORT GENERATED SUCCESS:</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                    <div>• Seeded Correspondences Purged:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedCorrespondenceCount || 0}</div>
                    
                    <div>• Seeded Documents Liquidated:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedDocumentCount || 0}</div>
                    
                    <div>• Seeded Print Audit Records Cleared:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedPrintJobCount || 0}</div>
                    
                    <div>• Mock Invitations Terminated:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedInvitationCount || 0}</div>
                    
                    <div>• Stale User Diagnostic Sessions Voided:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedSessionCount || 0}</div>
                    
                    <div>• Mock Systems Transactions Wiped:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedInventoryTransactionCount || 0}</div>
                    
                    <div>• Associated Seeded Audit Events Culled:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedAuditLogCount || 0}</div>
                    
                    <div>• Seeded Demo Accounts Purged:</div>
                    <div className="text-white text-right font-bold">{cleanupReport.removedUserCount || 0}</div>
                  </div>
                  <div className="text-white border-t border-slate-800 pt-2 mt-3 font-bold leading-relaxed">
                    Removed Demo Accounts:
                    <div className="mt-1 font-mono text-[10px] text-emerald-450">
                      {cleanupReport.removedUserCount > 0 ? (
                        cleanupReport.demoUsersRemoved?.map((u: any) => ` - [${u.id}] ${u.email} (${u.name})`).join('\n')
                      ) : (
                        ' None (Clean database)'
                      )}
                    </div>
                  </div>
                  <div className="text-emerald-520 font-bold mt-4">&gt; SYSTEM STATUS: PRODUCTION GREEN. COLD START PROCEDURES STAND BY.</div>
                </div>
              ) : (
                <div className="text-slate-500 italic mt-6">
                  {isCleaning ? (
                    <div className="animate-pulse">&gt; Executing clean operations... liquidating demo nodes... STANDBY.</div>
                  ) : (
                    'Waiting to receive cleanup execution directives...'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
