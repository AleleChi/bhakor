import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShieldAlert, CheckCircle, XCircle, Download, RefreshCw, 
  Computer, Globe, Clock, SlidersHorizontal, ArrowUpDown, FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../lib/api';

interface LoginHistoryCenterProps {
  token: string;
}

export default function LoginHistoryCenter({ token }: LoginHistoryCenterProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [browserFilter, setBrowserFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data || []);
      } else {
        toast.error('Failed to poll login registry ledger.');
      }
    } catch (err) {
      toast.error('Network timeout during login database query.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique browsers for filter dropdown
  const uniqueBrowsers = useMemo(() => {
    const set = new Set<string>();
    history.forEach(h => h.browser && set.add(h.browser));
    return Array.from(set);
  }, [history]);

  // Filtering list
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const matchSearch = 
        h.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.ipAddress?.includes(searchQuery) ||
        h.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter ? h.status === statusFilter : true;
      const matchBrowser = browserFilter ? h.browser === browserFilter : true;

      return matchSearch && matchStatus && matchBrowser;
    });
  }, [history, searchQuery, statusFilter, browserFilter]);

  // Download Report Ledger (CSV)
  const downloadSecurityReport = () => {
    if (filteredHistory.length === 0) {
      toast('No log records available inside historical buffer.');
      return;
    }

    const headers = ['Timestamp', 'Employee Name', 'Registered Email', 'IP Address', 'Location Coordinates', 'Browser/Device Agent', 'Status'];
    const rows = filteredHistory.map(h => [
      new Date(h.timestamp).toLocaleString(),
      h.user?.name || 'Unknown',
      h.user?.email || 'N/A',
      h.ipAddress || '127.0.0.1',
      h.location || 'Nigeria',
      h.device || 'Web Terminal',
      h.status || 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OOMS_Login_Security_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Central security login attempts report downloaded successfully.');
  };

  const getStatusBadge = (status: string) => {
    const val = status?.toUpperCase();
    if (val === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-[#12B76A] border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
          Success
        </span>
      );
    } else if (val === 'BLOCKED' || val === 'LOCKED') {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-[#FEF3F2] text-[#F04438] border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]" />
          Blocked
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-[#FEF3F2] text-[#F04438] border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]" />
          Failed
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Card Info with Left Orange Accent Border */}
      <div className="bg-white border-l-4 border-l-[#F59E0B] border-y border-r border-[#E4E7EC] p-6 rounded-r-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-left shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#111827] font-sans">
            Identity Audit Logs
          </h3>
          <p className="text-xs text-[#6B7280] font-medium mt-1 leading-relaxed">
            Live monitoring and tracking authorization attempts across central OOMS Nigeria personnel directory portals.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={downloadSecurityReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-[#6B7280] border border-[#E4E7EC] rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#6B7280]" />
            Download Security Report
          </button>

          <button
            onClick={fetchHistory}
            className="p-2 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg shadow-sm hover:shadow-md active:translate-y-0 transition-all cursor-pointer"
            title="Refresh History Buffer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Database control filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search by name, email, IP or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-2.5 bg-white border border-[#E5E7EB] pl-10 pr-4 rounded-lg outline-hidden focus:border-[#F59E0B] placeholder-[#6B7280] shadow-xs text-[#111827] transition-all font-semibold"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs py-2.5 bg-white border border-[#E5E7EB] px-4 rounded-lg outline-hidden cursor-pointer text-[#6B7280] font-semibold shadow-xs focus:border-[#F59E0B]"
          >
            <option value="">All Access Profiles</option>
            <option value="SUCCESS">Success Attempts</option>
            <option value="FAILED">Failed Attempts</option>
            <option value="BLOCKED">Blocked Requests</option>
          </select>
        </div>

        <div>
          <select
            value={browserFilter}
            onChange={(e) => setBrowserFilter(e.target.value)}
            className="w-full text-xs py-2.5 bg-white border border-[#E5E7EB] px-4 rounded-lg outline-hidden cursor-pointer text-[#6B7280] font-semibold shadow-xs focus:border-[#F59E0B]"
          >
            <option value="">All Device Fingerprints</option>
            {uniqueBrowsers.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Database Layout */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs relative">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm select-none">
            <thead className="sticky top-0 z-10 bg-[#F8FAFC] shadow-2xs border-b border-[#E5E7EB]">
              <tr className="text-[#6B7280] font-sans text-xs font-semibold select-none border-b border-[#E5E7EB]">
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Employee</th>
                <th className="py-4 px-5 font-sans">IP Address</th>
                <th className="py-4 px-5">Location</th>
                <th className="py-4 px-5">Device Client Agent</th>
                <th className="py-4 px-5 text-center">Access Status</th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody className="divide-y divide-[#E5E7EB] bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#6B7280] font-medium font-sans">
                    Querying secure login logs ledger...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#6B7280] font-medium font-sans uppercase tracking-wider">
                    Zero login logs recorded in this period
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr 
                    key={h.id} 
                    className="border-b border-[#E5E7EB] cursor-pointer select-none transition-all duration-150 hover:bg-[#FFFBEB] border-l-[4px] border-l-transparent hover:border-l-[#F59E0B]"
                  >
                    {/* Timestamp */}
                    <td className="py-4 px-5 text-xs font-medium text-[#6B7280]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#6B7280] shrink-0" />
                        <span>{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Employee Profile */}
                    <td className="py-4 px-5">
                      <span className="font-bold text-[#111827] block max-w-[150px] truncate leading-tight">{h.user?.name}</span>
                      <span className="text-xs text-[#6B7280] block mt-0.5 max-w-[150px] truncate">{h.user?.email}</span>
                    </td>

                    {/* IPAddress */}
                    <td className="py-4 px-5 font-mono text-xs text-[#6B7280]">
                      <span className="bg-[#F8FAFC] border border-[#E5E7EB] px-2.5 py-1 rounded-md text-xs font-semibold">
                        {h.ipAddress || '127.0.0.1'}
                      </span>
                    </td>

                    {/* Location Area */}
                    <td className="py-4 px-5 text-xs text-[#6B7280] font-semibold">
                      <div className="flex items-center gap-1.5 justify-start">
                        <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{h.location || 'Abuja HQ (Nigeria)'}</span>
                      </div>
                    </td>

                    {/* Device Client Agent description */}
                    <td className="py-4 px-5 text-[#6B7280] font-sans max-w-[180px] truncate">
                      <span className="font-bold text-xs text-[#111827] block truncate">{h.browser || 'Chrome'}</span>
                      <span className="text-[11px] text-[#6B7280] block mt-0.5 truncate">{h.device || 'Windows Device'}</span>
                    </td>

                    {/* Status badges */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(h.status)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
