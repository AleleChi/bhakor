import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ArrowRight, 
  Shield, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  Activity,
  Package,
  Truck,
  FileText,
  BarChart2,
  Calendar,
  LockKeyhole,
  CheckCircle,
  Database,
  Building2,
  Server,
  Layers,
  History,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Fingerprint,
  FileSpreadsheet,
  Network
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import { API_URL } from '../lib/api';

function AnimatedCount({ value, label }: { value: string; label: string }) {
  const numericStr = value.replace(/[^0-9]/g, '');
  const suffix = value.replace(/[0-9]/g, '');
  const numericVal = parseInt(numericStr, 10) || 0;
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = numericVal;
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 1250;
    const increment = Math.ceil(end / 40);
    const stepTime = 25;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [numericVal]);

  return (
    <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl text-center shadow-xs hover:border-[#F59E0B] hover:bg-[#FFF7ED]/30 transition-all duration-350 hover:scale-[1.03] hover:-translate-y-1">
      <span className="text-3xl md:text-4xl font-extrabold text-[#F59E0B] block font-mono leading-none tracking-tight">
        {count}
        {suffix}
      </span>
      <span className="text-[10px] md:text-xs text-[#0F172A] font-bold block mt-2 uppercase tracking-widest leading-tight">
        {label}
      </span>
    </div>
  );
}

function LiveOperationsCommandCenter() {
  return (
    <div className="relative w-full h-full min-h-[440px] flex items-center justify-center p-2">
      {/* Absolute grid decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:16px_16px] opacity-40 rounded-2xl" />
      
      <div className="relative w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-md p-6 space-y-5">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-105 border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">Live Operations Command Center</h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">100% Operational</span>
        </div>

        {/* Stack of Cards */}
        <div className="space-y-3">
          {/* Card 1 */}
          <div className="flex items-center justify-between p-3.5 bg-[#FFFBF5] border border-[#F59E0B]/35 rounded-xl transition-all duration-200 hover:shadow-xs hover:translate-x-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shadow-2xs">
                <Mail className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Today's Mail Influx</h4>
                <p className="text-[10px] text-slate-500 font-medium">Bhakor Logistics Hub</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-[#F59E0B] font-mono">24 Incoming</span>
              <p className="text-[9px] text-[#64748B] font-semibold">Registered</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center justify-between p-3.5 bg-[#FAFAF9] border border-slate-200 rounded-xl transition-all duration-200 hover:shadow-xs hover:translate-x-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shadow-2xs">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Document Controls</h4>
                <p className="text-[10px] text-slate-500 font-medium">Clearance Audits</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">8 Pending Approvals</span>
              <p className="text-[9px] text-[#64748B] font-semibold mt-0.5">Stream active</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center justify-between p-3.5 bg-[#FAFAF9] border border-slate-200 rounded-xl transition-all duration-200 hover:shadow-xs hover:translate-x-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Network Devices</h4>
                <p className="text-[10px] text-slate-500 font-medium">Printer Diagnoses</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">3 Printer Alerts</span>
              <p className="text-[9px] text-rose-500 font-semibold mt-0.5 font-sans">Toner capacity critical</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex items-center justify-between p-3.5 bg-[#FAFAF9] border border-slate-200 rounded-xl transition-all duration-200 hover:shadow-xs hover:translate-x-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shadow-2xs">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Office Equipment</h4>
                <p className="text-[10px] text-slate-500 font-medium">Warehouse Repositories</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full">12 Inventory Warnings</span>
              <p className="text-[9px] text-amber-600 font-semibold mt-0.5">Replenish now</p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="flex items-center justify-between p-3.5 bg-[#FAFAF9] border border-slate-200 rounded-xl transition-all duration-200 hover:shadow-xs hover:translate-x-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shadow-2xs">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Contract Subscriptions</h4>
                <p className="text-[10px] text-slate-500 font-medium">Sovereign Compliance</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">5 Expiring Licenses</span>
              <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">Grace tracking active</p>
            </div>
          </div>

        </div>

        {/* Live Traffic Overlay Tracker */}
        <div className="pt-2 flex justify-between items-center text-[9px] text-slate-400 font-mono">
          <span>OOMS SYNC: OK</span>
          <span>REFRESHED IN REALTIME</span>
        </div>
      </div>
    </div>
  );
}

function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<'documents' | 'correspondence' | 'inventory' | 'fleet' | 'printers' | 'analytics'>('documents');

  const tabsList = [
    { key: 'documents', label: 'Documents' },
    { key: 'correspondence', label: 'Correspondence' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'fleet', label: 'Fleet' },
    { key: 'printers', label: 'Printers' },
    { key: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none justify-center lg:justify-start">
        {tabsList.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#FFF7ED] text-[#0F172A] border-b-2 border-[#F59E0B]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Showcase area with animated transitions (with simple animate-fadeIn) */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs min-h-[340px] relative overflow-hidden text-left animate-fadeIn">
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-[#F59E0B]" /> Document Management Vault
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">Strictly classified sovereign records repository</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[6px]">APPROVED STANDARD</span>
            </div>
            
            <div className="space-y-2.5">
              {[
                { title: 'Standard Operational Guidelines 2026.pdf', size: '4.2 MB', dept: 'Aviation', ver: 'v1.4', status: 'Approved' },
                { title: 'Bhakor Consult Vendor Agreement.pdf', size: '1.8 MB', dept: 'Legal Operations', ver: 'v2.1', status: 'Restricted' },
                { title: 'Annual Logistical Outflow Statement.xlsx', size: '12.4 MB', dept: 'Finance Sector', ver: 'v3.0', status: 'Approved' }
              ].map((doc, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#FAFAF9] border border-slate-100 rounded-xl gap-2 hover:bg-[#FFF7ED] hover:border-[#F59E0B]/30 transition-all duration-150">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">{doc.title}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.dept}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">{doc.ver}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      doc.status === 'Approved' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                    }`}>{doc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'correspondence' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-4.5 h-4.5 text-[#F59E0B]" /> Mail Correspondence Ledger
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">Real-time official incoming and outgoing dispatch</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-[6px]">12,431 SECURED LOGS</span>
            </div>
            
            <div className="space-y-2.5">
              {[
                { ref: 'OOMS/CR/2026/091', from: 'Ministry of Works & Housing', desc: 'Road infrastructure mapping blueprint approval proposal', date: 'Today, 09:21 AM', state: 'Delivered' },
                { ref: 'OOMS/CR/2026/089', from: 'Aviation Safety Committee', desc: 'Critical compliance diagnostic telemetry and reporting guidelines', date: 'Yesterday', state: 'Pending Verification' }
              ].map((mail, i) => (
                <div key={i} className="p-3.5 bg-[#FAFAF9] border border-slate-100 rounded-xl hover:bg-[#FFF7ED] hover:border-[#F59E0B]/30 transition-all duration-150 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="font-mono text-[#F59E0B] font-bold">{mail.ref}</span>
                    <span className="text-slate-400">{mail.date}</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">{mail.from}</div>
                  <p className="text-[11px] text-[#64748B] font-medium leading-relaxed">{mail.desc}</p>
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${mail.state === 'Delivered' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-[10px] text-slate-500 font-bold">{mail.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4.5 h-4.5 text-[#F59E0B]" /> Office Asset Inventory Index
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">Track resource velocity and trigger autostock pipelines</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-[6px]">12 REPLENISHMENTS NEEDED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Duplex A4 Printing Sheets', stock: '24 boxes', limit: '100 boxes', pct: 24, status: 'Critical' },
                { name: 'Standard Office Swivel Chairs', stock: '85 units', limit: '100 units', pct: 85, status: 'Healthy' }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-[#FAFAF9] border border-slate-100 rounded-xl space-y-2 hover:bg-[#FFF7ED] transition-all">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    item.status === 'Critical' ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'
                  }`}>{item.status}</span>
                  <div className="text-xs font-bold text-slate-900 pt-1">{item.name}</div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Stock: {item.stock}</span>
                    <span>Min Limit: {item.limit}</span>
                  </div>
                  {/* Visual Bar progress */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${item.status === 'Critical' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${item.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4.5 h-4.5 text-[#F59E0B]" /> Transport Logistics & Fleet Registry
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">Operational fuel quota allocation and dispatch status</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-[6px]">24 VEHICLES NOMINAL</span>
            </div>

            <div className="space-y-2.5">
              {[
                { plate: 'ABJ-382-XA', model: 'Toyota Hilux Double-Cabin V8', driver: 'M. Ibrahim', quota: '40L / Week', state: 'Active' },
                { plate: 'KD-904-YY', model: 'Peugeot Partner Cargo Dispatch Van', driver: 'A. Chidera', quota: '50L / Week', state: 'Standby' }
              ].map((veh, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#FAFAF9] border border-slate-100 rounded-xl gap-2 hover:bg-[#FFF7ED] hover:border-[#F59E0B]/30 transition-all duration-150">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-900 text-xs">🚗</div>
                    <div className="text-left">
                      <span className="text-xs font-extrabold text-slate-900">{veh.model}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{veh.plate}</span>
                        <span>•</span>
                        <span>Assignee: {veh.driver}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono font-bold text-slate-600">Quota: {veh.quota}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      veh.state === 'Active' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                    }`}>{veh.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'printers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4.5 h-4.5 text-[#F59E0B]" /> Printer Operations Command Bridge
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">Protocol connectors and toner level live diagnostic alerts</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-[6px]">3 PENDING QUEUES</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Floor 2 East Wing - HP LaserJet Enterprise 600', status: 'Online', toner: '84%', ip: '10.12.184.2' },
                { name: 'Secretariat General Desk - Brother HL-L8360CDW', status: 'Toner Alert', toner: '4%', ip: '10.12.184.11' }
              ].map((print, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#FAFAF9] border border-slate-100 rounded-xl gap-2 hover:bg-[#FFF7ED] hover:border-[#F59E0B]/30 transition-all duration-150">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ backgroundColor: print.status === 'Online' ? '#10B981' : '#F59E0B' }} />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">{print.name}</span>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{print.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold">Toner Capacity</span>
                      <span className={`text-[10px] font-bold font-mono ${print.status === 'Online' ? 'text-emerald-600' : 'text-rose-600'}`}>{print.toner}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      print.status === 'Online' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-750 bg-amber-50'
                    }`}>{print.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <BarChart2 className="w-4.5 h-4.5 text-[#F59E0B]" /> Logistical Velocity Analytics
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">Ministerial throughput index tracking</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#F59E0B] bg-amber-50 px-2.5 py-1 rounded-[6px]">LOGS ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Ministry of Aviation', metric: '1,240 Correspondence', rate: '+14% month-over-month' },
                { name: 'Ministry of Works & Housing', metric: '2,100 Correspondence', rate: '+28% intensive spikes' },
                { name: 'Finance Secretariat', metric: '1,840 Correspondence', rate: 'Stable index curves' }
              ].map((stat, i) => (
                <div key={i} className="p-3.5 bg-[#FAFAF9] border border-slate-100 rounded-xl space-y-1.5 hover:bg-[#FFF7ED]">
                  <div className="text-[10px] font-bold text-[#F59E0B] font-mono tracking-wider uppercase">{stat.name}</div>
                  <div className="text-sm font-extrabold text-slate-900">{stat.metric}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">📈 {stat.rate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AuthFlowProps {
  onLoginSuccess: (user: any, token: string) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AuthFlow({ onLoginSuccess, darkMode, setDarkMode }: AuthFlowProps) {
  const [view, setView] = useState<'landing' | 'login' | 'forgot' | 'reset' | 'invite'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [photoPath, setPhotoPath] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<{
    email: string;
    name: string;
    role: string;
    departmentId: string | null;
    jobTitle: string | null;
    phone: string | null;
    branch: string | null;
    manager: string | null;
    expiresAt: string | null;
  } | null>(null);

  const [simulatedResetToken, setSimulatedResetToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [footerAccordions, setFooterAccordions] = useState<Record<string, boolean>>({
    platform: false,
    company: false,
    legal: false
  });

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: 'UNSET', color: 'bg-slate-200 text-slate-400', pct: 0 };
    let score = 0;
    if (pw.length >= 12) score += 1;
    if (/[a-z]/.test(pw)) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    let label = 'CRITICAL WEAKNESS';
    let color = 'bg-rose-500';
    let pct = 20;

    if (score >= 5) {
      label = 'HIGH SECURITY STRENGTH';
      color = 'bg-emerald-500';
      pct = 100;
    } else if (score >= 3) {
      label = 'MODERATE AMBIENT';
      color = 'bg-amber-500';
      pct = 60;
    }

    return { score, label, color, pct };
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid image type. Supported: PNG, JPEG, and WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File exceeds 2MB maximum limit.');
      return;
    }

    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/upload-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: reader.result as string,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');

        setPhotoPath(data.url);
        toast.success('Profile photo uploaded and processed successfully!');
      } catch (err: any) {
        toast.error(`Photo upload failed: ${err.message}`);
      } finally {
        setPhotoLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlView = params.get('view') || (window.location.pathname === '/accept-invitation' ? 'accept' : '');
    const urlToken = params.get('token');
    
    if (urlView === 'accept' || urlView === 'invite') {
      setView('invite');
      if (urlToken) {
        setToken(urlToken);
      }
    } else if (urlView === 'reset') {
      setView('reset');
      if (urlToken) setToken(urlToken);
    }
  }, []);

  // Realtime invitation fetch effect
  useEffect(() => {
    if (token && token.length > 10 && view === 'invite') {
      fetch(`${API_URL}/api/auth/invitation-details/${token}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Verification endpoint rejection');
          return data;
        })
        .then(data => {
          setInvitationDetails(data);
          if (data.name) {
            setName(data.name);
          }
        })
        .catch((err) => {
          setInvitationDetails(null);
        });
    } else {
      setInvitationDetails(null);
    }
  }, [token, view]);

  const displayMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
  };

  const clearMessages = () => {
    setMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification endpoint rejection');
      }
      
      displayMessage('success', 'Authenticating Secure Session...');
      toast.success(`Login Success: Welcome back, ${data.user?.name || 'Officer'}!`, {
        description: 'Session handshakes authorized.',
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#10B981' }
      });
      localStorage.setItem('ooms_token', data.token);
      localStorage.setItem('ooms_user', JSON.stringify(data.user));
      
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 600);

    } catch (err: any) {
      displayMessage('error', err.message);
      toast.error(`Authentication Denied: ${err.message}`, {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Recovery deployment rejected');
      }

      displayMessage('success', 'Handshake initialized. Recovery token displayed below.');
      toast.info('Recovery token generated: Copy the token shown below to proceed.', {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#0F172A' }
      });
      setSimulatedResetToken(data.resetToken || 'TOKEN-SIM-VERIFIED');

    } catch (err: any) {
      displayMessage('error', err.message);
      toast.error(`Recovery handshake failed: ${err.message}`, {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Handshake failed to sync password');
      }

      displayMessage('success', 'Password updated successfully. Return to sign in.');
      toast.success('Security password renewed successfully. Ready for login.', {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#10B981' }
      });
      setToken('');
      setPassword('');
      setTimeout(() => {
        setView('login');
        clearMessages();
      }, 1200);

    } catch (err: any) {
      displayMessage('error', err.message);
      toast.error(`Password sync failed: ${err.message}`, {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    if (password !== confirmPassword) {
      setLoading(false);
      displayMessage('error', 'Passcode mismatch error: Password and Confirm Password inputs must match precisely.');
      toast.error('Passcode mismatch error: Passwords do not match.', {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name, photoPath })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invitation token is expired or altered');
      }

      displayMessage('success', 'Invitation activated. Personnel account successfully established.');
      toast.success('Personnel Account Provisioned successfully.', {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#10B981' }
      });
      setTimeout(() => {
        setView('login');
        clearMessages();
      }, 1200);

    } catch (err: any) {
      displayMessage('error', err.message);
      toast.error(`Invitation activation failed: ${err.message}`, {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
    } finally {
      setLoading(false);
    }
  };

  // Pristine white theme chart datasets
  const mockDeptPerformance = [
    { name: 'Aviation', Correspondence: 1240, Procurement: 840 },
    { name: 'Works & Housing', Correspondence: 2100, Procurement: 1540 },
    { name: 'Finance', Correspondence: 1840, Procurement: 2300 },
    { name: 'Health', Correspondence: 1450, Procurement: 990 },
    { name: 'Secretariat', Correspondence: 3100, Procurement: 1100 }
  ];

  const mockCostTrend = [
    { month: 'Jan', subscriptions: 43200, fuel: 18400 },
    { month: 'Feb', subscriptions: 41100, fuel: 19100 },
    { month: 'Mar', subscriptions: 45600, fuel: 17200 },
    { month: 'Apr', subscriptions: 48900, fuel: 21300 },
    { month: 'May', subscriptions: 47200, fuel: 22800 },
    { month: 'Jun', subscriptions: 49400, fuel: 24700 }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans antialiased bg-[#FAFAF9] text-slate-900 selection:bg-amber-100 transition-colors duration-200">
      
      {/* WHITE-FIRST GLOBAL TOP MENU (72px Height alignment) */}
      <header className="sticky top-0 z-50 h-[72px] bg-white border-b border-[#E5E7EB] shadow-2xs">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div 
            onClick={() => setView('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-[36px] h-[36px] bg-[#F59E0B] flex items-center justify-center font-bold text-white text-xs rounded-lg shadow-2xs">
              OO
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">OOMS NIGERIA</span>
              <span className="text-[9px] text-[#64748B] font-mono tracking-widest uppercase mt-0.5 font-bold">V2 DESIGN SYSTEM</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            <a href="#hero" className="hover:text-[#F59E0B] transition-colors">Platform</a>
            <a href="#features" className="hover:text-[#F59E0B] transition-colors">Core Modules</a>
            <a href="#timeline" className="hover:text-[#F59E0B] transition-colors">Operations</a>
            <a href="#analytics" className="hover:text-[#F59E0B] transition-colors">Department Intel</a>
            <a href="#security" className="hover:text-[#F59E0B] transition-colors">Compliance</a>
          </nav>

          <div className="flex items-center gap-3">
            {view === 'landing' ? (
              <button
                onClick={() => setView('login')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={() => setView('landing')}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </header>

      {/* PORTAL MAIN SPACE */}
      <main className="flex-grow">        {/* LANDING PAGE - LUXURY MINIMALIST WHITE-FIRST DESIGN */}
        {view === 'landing' && (
          <div className="bg-[#FAFAF9] text-left space-y-20 pb-16">
            
            {/* HERO SECTION WITH MASSIVE TYPOGRAPHY */}
            <section id="hero" className="max-w-7xl mx-auto px-6 pt-20 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              
              {/* Core pitches */}
              <div className="lg:col-span-6 space-y-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E7EB] rounded-full shadow-2xs">
                  <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] font-mono">
                    Enterprise Operations System • Bhakor Consult Limited
                  </span>
                </div>

                <div className="space-y-6">
                  {/* MASSIVE TYPOGRAPHY HIERARCHY */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-display leading-[1.08]">
                    Operational tools <br />
                    <span className="text-[#F59E0B]">designed for visibility</span> <br />
                    and accountability.
                  </h1>
                  
                  <p className="text-sm md:text-base text-[#64748B] leading-relaxed max-w-xl font-normal">
                    A secure administrative ledger system designed by Bhakor Consult Limited to manage official correspondence, physical office inventory, fleet fuel allocations, and subscription renewals with complete transparency.
                  </p>
                </div>

                {/* TRUST INDICATORS BAR */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#64748B] font-mono block">Enterprise Capabilities</span>
                  <div className="flex flex-wrap gap-2 pt-1 select-none">
                    {[
                      'Correspondence Management',
                      'Document Control',
                      'Inventory Operations',
                      'Fleet Monitoring',
                      'Subscription Governance',
                      'Printer Operations',
                      'Audit Compliance'
                    ].map((badge, idx) => (
                      <div 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF7ED] border border-[#F59E0B] rounded-full text-[10px] font-bold text-[#0F172A] hover:scale-[1.03] transition-all"
                      >
                        <span className="text-[#F59E0B] font-extrabold">✓</span>
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <button
                    onClick={() => setView('login')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-[11px] uppercase tracking-widest rounded-[10px] shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-amber-600 font-sans hover:scale-[1.02] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200"
                  >
                    Enter Workspace <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setView('invite')}
                    className="w-full sm:w-auto px-6 py-3.5 border border-[#E5E7EB] hover:bg-slate-50 bg-white text-slate-800 font-bold text-[11px] uppercase tracking-widest rounded-[10px] flex items-center justify-center gap-2 cursor-pointer font-sans hover:scale-[1.02] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200"
                  >
                    Redeem Invitation
                  </button>
                </div>
              </div>

              {/* LIVE OPERATIONS COMMAND CENTER */}
              <div className="lg:col-span-6 animate-fadeIn">
                <LiveOperationsCommandCenter />
              </div>

            </section>

            {/* OPERATIONAL METRICS SECTION */}
            <section id="metrics" className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              <AnimatedCount value="150+" label="Tracked Correspondence" />
              <AnimatedCount value="120+" label="Inventory Assets" />
              <AnimatedCount value="65+" label="Managed Subscriptions" />
              <AnimatedCount value="80+" label="Fleet Records" />
              <AnimatedCount value="100%" label="Audit Traceability" />
            </section>

            {/* PLATFORM MODULE SHOWCASE SECTION (Phase 3) */}
            <section id="features" className="bg-white border-y border-[#E5E7EB] py-24 select-none">
              <div className="max-w-7xl mx-auto px-6 space-y-16">
                
                <div className="max-w-xl text-left space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F59E0B] font-mono block">OPERATIONAL BLUEPRINT</span>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
                    Everything Needed To Run Operations Efficiently
                  </h2>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    Developed by Bhakor Consult Limited to replace manual legacy files and disconnected logbooks with integrated digital registries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    {
                      icon: <Mail className="w-5 h-5 text-[#F59E0B]" />,
                      title: 'Correspondence',
                      desc: 'Capture, process, audit, and systematically map inbound/outbound registry envelopes with complete dispatch monitoring.'
                    },
                    {
                      icon: <FileText className="w-5 h-5 text-[#F59E0B]" />,
                      title: 'Documents',
                      desc: 'Organize executive directives, operational guidelines, and vendor agreements on a modular cabinet with department clearing tier parameters.'
                    },
                    {
                      icon: <Package className="w-5 h-5 text-[#F59E0B]" />,
                      title: 'Inventory',
                      desc: 'Control consumable volumes across corporate office warehouses. Track utilization rates and generate automatic stock shortage alerts.'
                    },
                    {
                      icon: <Truck className="w-5 h-5 text-[#F59E0B]" />,
                      title: 'Fleet',
                      desc: 'Trace driver logs, monitor routine vehicle servicing calendars, and allocate secure timestamped fuel quotas to control leaks.'
                    },
                    {
                      icon: <Calendar className="w-5 h-5 text-[#F59E0B]" />,
                      title: 'Subscriptions',
                      desc: 'Sovereign contract renewals manager. Identify monthly SaaS overhead, assign financial lines, and maintain clearance records.'
                    },
                    {
                      icon: <Zap className="w-5 h-5 text-[#F59E0B]" />,
                      title: 'Printers',
                      desc: 'Command dashboard tracking local network printing terminals, print queues, and real-time toner diagnostics to minimize idle periods.'
                    }
                  ].map((feat, idx) => (
                    <div 
                      key={idx}
                      className="p-8 bg-white border border-[#E5E7EB] rounded-[16px] shadow-2xs hover:bg-[#FFF7ED] hover:border-[#F59E0B] text-left space-y-4 hover:border-l-[4px] hover:border-l-[#F59E0B] duration-200 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-[10px] flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-2xs">
                        {feat.icon}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 font-display tracking-tight group-hover:text-[#F59E0B] transition-colors">{feat.title}</h3>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold transition-colors group-hover:text-[#0F172A]">{feat.desc}</p>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* INTERACTIVE PRODUCT PREVIEW SECTION (Phase 4) */}
            <section id="product-preview" className="max-w-7xl mx-auto px-6 py-8 space-y-8 text-center lg:text-left animate-fadeIn">
              <div className="max-w-xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F59E0B] font-mono block">LIVE DEMONSTRATION</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Experience Live Operations</h2>
                <p className="text-sm text-[#64748B]">Explore how administrative ledgers segment records and automate monitoring streams dynamically.</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                <InteractiveShowcase />
              </div>
            </section>

            {/* WHY TEAMS USE OOMS SECTION (Phase 5) */}
            <section id="why-ooms" className="bg-[#FFFBF5]/40 border-y border-[#E5E7EB] py-24 select-none">
              <div className="max-w-7xl mx-auto px-6 space-y-16">
                
                <div className="max-w-xl text-left space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F59E0B] font-mono block">THE OOMS ADVANTAGE</span>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Why Teams Run On OOMS</h2>
                  <p className="text-sm text-[#64748B]">Optimized administrative protocols built to deliver complete organizational visibility and compliance readiness.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    {
                      icon: <Layers className="w-5 h-5 text-[#F59E0B]" />,
                      title: "Centralized Operations",
                      desc: "Unify mail, documents, assets, fleet, and workspace tooling under a single secure ledger, eliminating disparate legacy logs."
                    },
                    {
                      icon: <History className="w-5 h-5 text-[#F59E0B]" />,
                      title: "Complete Audit Trail",
                      desc: "Permanent chronological action registers record timestamps, active sessions, and supervisor credentials for transparent review."
                    },
                    {
                      icon: <Check className="w-5 h-5 text-[#F59E0B]" />,
                      title: "Workflow Automation",
                      desc: "Automate low-stock alerts, pending supervisor approvals, and renewal task notifications to minimize manual dispatch latency."
                    },
                    {
                      icon: <Building2 className="w-5 h-5 text-[#F59E0B]" />,
                      title: "Department Visibility",
                      desc: "Enable management to oversee state-level sub-registries and headquarters operations with high-fidelity analytics."
                    },
                    {
                      icon: <Shield className="w-5 h-5 text-[#F59E0B]" />,
                      title: "Compliance Readiness",
                      desc: "Enforce Level-3 clearance requirements and mandatory classification markings standard for public administrative auditing."
                    },
                    {
                      icon: <Server className="w-5 h-5 text-[#F59E0B]" />,
                      title: "Production Scalability",
                      desc: "Engineered with resilient data architectures built to easily absorb extensive multi-department transaction volumes."
                    }
                  ].map((card, idx) => (
                    <div 
                      key={idx}
                      className="p-8 bg-white border border-[#E5E7EB] rounded-[16px] shadow-2xs hover:border-[#F59E0B] hover:bg-[#FFF7ED]/55 transition-all duration-300 text-left space-y-4 hover:-translate-y-1 block cursor-pointer group"
                    >
                      <div className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-center shadow-2xs transition-transform duration-200 group-hover:scale-105">
                        {card.icon}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 font-display tracking-tight group-hover:text-[#F59E0B]">{card.title}</h3>
                      <p className="text-xs text-[#64748B] leading-relaxed font-semibold">{card.desc}</p>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* SECURITY & COMPLIANCE SECTION (Phase 6) */}
            <section id="security" className="max-w-7xl mx-auto px-6 py-6 space-y-16 animate-fadeIn">
              
              <div className="text-left space-y-3 max-w-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10B981] font-mono block">SYSTEM SECURITY ENVELOPE</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Security Built Into Every Workflow</h2>
                <p className="text-sm text-[#64748B]">
                  Regulatory controls protecting state records from cross-tenant leakage with modern cryptography.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { title: "JWT Authentication", desc: "Rigid session tokens with continuous authorization handshakes." },
                  { title: "Role-Based Access Control", desc: "Siloed clearing levels isolate confidential correspondence." },
                  { title: "Document Versioning", desc: "Timestamped ledger approvals prevent unauthorized file alterations." },
                  { title: "Audit History", desc: "Immutable action trails compiled for permanent administrative records." },
                  { title: "Activity Monitoring", desc: "Continuous surveillance of session actions and credential usage." },
                  { title: "Data Integrity Controls", desc: "Strict schema verification ensures persistent information matches exactly." }
                ].map((sec, idx) => (
                  <div key={idx} className="p-6 bg-white border border-[#E5E7EB] rounded-xl text-left space-y-4 shadow-2xs hover:border-emerald-400 hover:bg-emerald-50/15 duration-200 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-md shadow-emerald-400 animate-ping" />
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold uppercase">SECURED</span>
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">{sec.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed font-semibold">{sec.desc}</p>
                  </div>
                ))}
              </div>

            </section>

            {/* ABOUT BHAKOR CONSULT (Phase 7) */}
            <section id="about-bhakor" className="max-w-7xl mx-auto px-6 py-8">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 lg:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
                
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF7ED] border border-[#F59E0B] rounded-full">
                    <span className="text-xs text-[#F59E0B] font-extrabold">✓</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F172A] font-mono">
                      Bhakor Consult Limited Certification
                    </span>
                  </div>
                  
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Built By Bhakor Consult Limited
                  </h2>
                  
                  <p className="text-sm md:text-base text-[#64748B] leading-relaxed font-normal">
                    Bhakor Consult Limited develops enterprise software solutions that help organizations manage records, workflows, assets, compliance processes, and operational activities from a unified platform.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {[
                      { title: "Enterprise Software", desc: "Robust visual ledger engines." },
                      { title: "Digital Transformation", desc: "Modernize public logistics layers." },
                      { title: "Operations Consulting", desc: "Audit trail pipeline structure." },
                      { title: "Process Optimization", desc: "Reduce administrative latency." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="text-[#F59E0B] font-extrabold pt-0.5">✓</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">{item.title}</h4>
                          <p className="text-[10px] text-[#64748B]">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 bg-[#FAFAF9] border border-[#E5E7EB] rounded-xl text-center space-y-4">
                  <div className="w-[54px] h-[54px] bg-[#F59E0B] flex items-center justify-center font-extrabold text-white text-lg rounded-2xl mx-auto shadow-xs">
                    BC
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900">Bhakor Consult Limited</h3>
                    <p className="text-[10px] text-slate-400 font-mono">ESTABLISHED SOLUTIONS PROVIDER</p>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-around text-xs font-mono font-bold text-slate-500 text-center">
                    <span>99.9% Up</span>
                    <span>•</span>
                    <span>Sovereign SaaS</span>
                    <span>•</span>
                    <span>Abuja HQ</span>
                  </div>
                </div>

              </div>
            </section>

            {/* PREMIUM FOOTER SECTION (Phase 8 & 10) */}
            <footer className="bg-white border-t border-[#E5E7EB] pt-16 pb-12 select-none">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-100 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#F59E0B] flex items-center justify-center font-bold text-white text-xs rounded-[10px]">OO</div>
                    <span className="text-sm font-extrabold tracking-tight text-slate-900">OOMS NIGERIA</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed max-w-xs font-semibold">
                    Operational and Office Management System designed and maintained by Bhakor Consult Limited to provide transparency and workflow performance in public administration.
                  </p>
                </div>

                {/* Platform Section Accordion */}
                <div className="border-b md:border-b-0 pb-4 md:pb-0">
                  <button 
                    type="button"
                    onClick={() => setFooterAccordions(prev => ({ ...prev, platform: !prev.platform }))}
                    className="w-full md:w-auto text-left flex justify-between items-center text-xs uppercase font-extrabold tracking-wider text-slate-800 mb-2 md:mb-4 font-mono focus:outline-none"
                  >
                    <span>Platform</span>
                    <span className="md:hidden text-slate-400">{footerAccordions.platform ? '−' : '+'}</span>
                  </button>
                  <ul className={`${footerAccordions.platform ? 'block' : 'hidden md:block'} space-y-2 text-xs text-slate-500 font-semibold font-sans pt-2 md:pt-0`}>
                    <li><a href="#product-preview" className="hover:text-[#F59E0B]">Documents</a></li>
                    <li><a href="#product-preview" className="hover:text-[#F59E0B]">Correspondence</a></li>
                    <li><a href="#product-preview" className="hover:text-[#F59E0B]">Inventory</a></li>
                    <li><a href="#product-preview" className="hover:text-[#F59E0B]">Fleet</a></li>
                    <li><a href="#product-preview" className="hover:text-[#F59E0B]">Printers</a></li>
                  </ul>
                </div>

                {/* Company Section Accordion */}
                <div className="border-b md:border-b-0 pb-4 md:pb-0">
                  <button 
                    type="button"
                    onClick={() => setFooterAccordions(prev => ({ ...prev, company: !prev.company }))}
                    className="w-full md:w-auto text-left flex justify-between items-center text-xs uppercase font-extrabold tracking-wider text-slate-800 mb-2 md:mb-4 font-mono focus:outline-none"
                  >
                    <span>Company</span>
                    <span className="md:hidden text-slate-400">{footerAccordions.company ? '−' : '+'}</span>
                  </button>
                  <ul className={`${footerAccordions.company ? 'block' : 'hidden md:block'} space-y-2 text-xs text-slate-500 font-semibold font-sans pt-2 md:pt-0`}>
                    <li><a href="#about-bhakor" className="hover:text-[#F59E0B]">About</a></li>
                    <li><a href="mailto:info@bhakorconsult.com" className="hover:text-[#F59E0B]">Contact</a></li>
                    <li><button type="button" onClick={() => setView('login')} className="hover:text-[#F59E0B] text-left focus:outline-none">Request Demo</button></li>
                    <li><a href="mailto:support@bhakorconsult.com" className="hover:text-[#F59E0B]">Support</a></li>
                  </ul>
                </div>

                {/* Legal Section Accordion */}
                <div className="pb-4 md:pb-0">
                  <button 
                    type="button"
                    onClick={() => setFooterAccordions(prev => ({ ...prev, legal: !prev.legal }))}
                    className="w-full md:w-auto text-left flex justify-between items-center text-xs uppercase font-extrabold tracking-wider text-slate-800 mb-2 md:mb-4 font-mono focus:outline-none"
                  >
                    <span>Legal</span>
                    <span className="md:hidden text-slate-400">{footerAccordions.legal ? '−' : '+'}</span>
                  </button>
                  <ul className={`${footerAccordions.legal ? 'block' : 'hidden md:block'} space-y-2 text-xs text-slate-500 font-semibold font-sans pt-2 md:pt-0`}>
                    <li><a href="#security" className="hover:text-[#F59E0B]">Privacy Policy</a></li>
                    <li><a href="#security" className="hover:text-[#F59E0B]">Terms</a></li>
                    <li><a href="#security" className="hover:text-[#F59E0B]">Security</a></li>
                  </ul>
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-4">
                <span>OOMS Core Engine v3.5 • Maintained by Bhakor Consult Limited</span>
                <span>&copy; {new Date().getFullYear()} Bhakor Consult Limited. All rights reserved.</span>
              </div>
            </footer>

          </div>
        )}

        {/* SECURED LOGIN CARD - MINIMALIST PREMIUM NOTION/STRIPE-STYLE */}
        {view === 'login' && (
          <div className="px-6 py-20 flex items-center justify-center bg-[#FAFAF9] min-h-[calc(100vh-72px)] text-left">
            <div className="w-full max-w-md bg-white border border-[#E5E7EB] p-8 shadow-sm rounded-[16px] space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-10 h-10 bg-[#F59E0B] flex items-center justify-center font-bold text-white text-xs rounded-[10px] mx-auto shadow-2xs">
                  OO
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight">Access Command Center</h2>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                  Provide administrative credentials to open safe registry logs.
                </p>
              </div>

              {message && (
                <div className={`p-3 border text-xs leading-relaxed rounded-[12px] flex items-start gap-2 ${
                  message.type === 'error' 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-bold">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Ministry Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="superadmin@ooms.com"
                      className="w-full text-xs rounded-[12px] py-3 pl-10 pr-4 bg-[#FAFAF9] border border-slate-200 focus:border-[#F59E0B] focus:bg-white text-slate-900 outline-hidden transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Access Password</label>
                    <button 
                      type="button"
                      onClick={() => { setView('forgot'); clearMessages(); }}
                      className="text-[10px] text-[#F59E0B] hover:underline font-bold font-mono uppercase tracking-wider"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs rounded-[12px] py-3 pl-10 pr-10 bg-[#FAFAF9] border border-slate-200 focus:border-[#F59E0B] focus:bg-white text-slate-900 outline-hidden transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between select-none">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#F59E0B] border-slate-200 focus:ring-0 rounded-sm cursor-pointer accent-[#F59E0B]"
                    />
                    <span className="text-xs text-slate-500 font-bold">Keep verified node active</span>
                  </label>
                </div>

                {/* Demo autofill section cleared as per standard regulatory guidelines */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-55 text-white text-xs font-bold uppercase tracking-widest rounded-[10px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" /> Accessing...
                    </>
                  ) : (
                    'Authenticate Account'
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setView('landing'); clearMessages(); }}
                  className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-800 tracking-wider font-mono"
                >
                  ← Go Back to Homepage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD gate */}
        {view === 'forgot' && (
          <div className="px-6 py-20 flex items-center justify-center bg-[#FAFAF9] min-h-[calc(100vh-72px)] text-left">
            <div className="w-full max-w-md bg-white border border-[#E5E7EB] p-8 shadow-sm rounded-[16px] space-y-6">
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight">Credentials Recovery</h2>
                <p className="text-xs text-[#64748B]">Provide your organizational mail address to generate reset tokens.</p>
              </div>

              {message && (
                <div className={`p-3 border text-xs rounded-[12px] flex items-start gap-2 ${
                  message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-bold">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Registry Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="superadmin@ooms.com"
                      className="w-full text-xs rounded-[12px] py-3 pl-10 pr-4 bg-[#FAFAF9] border border-slate-200 focus:border-[#F59E0B] text-slate-900 outline-hidden tracking-wide font-semibold"
                    />
                  </div>
                </div>

                {simulatedResetToken && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-[12px] space-y-2">
                    <span className="text-[9px] font-bold text-[#D97706] block uppercase font-mono">National Verification Ticket</span>
                    <span className="text-xs font-mono bg-slate-900 text-amber-300 p-2.5 rounded-[10px] select-all block text-center font-bold">{simulatedResetToken}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setToken(simulatedResetToken);
                        setView('reset');
                        clearMessages();
                      }}
                      className="mt-1 text-xs text-[#F59E0B] hover:underline font-bold font-mono uppercase block text-center"
                    >
                      Authenticate Reset Ticket →
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-[10px] cursor-pointer"
                >
                  Generate Recovery Token
                </button>
              </form>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-[10px] font-mono tracking-wider font-bold uppercase">
                <button onClick={() => { setView('login'); clearMessages(); }} className="text-slate-450 hover:text-slate-850">
                  ← Sign In
                </button>
                <button onClick={() => { setView('reset'); clearMessages(); }} className="text-[#F59E0B] hover:underline">
                  Submit Token →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COMPREHENSIVE PASSWORD RESET FORM */}
        {view === 'reset' && (
          <div className="px-6 py-20 flex items-center justify-center bg-[#FAFAF9] min-h-[calc(100vh-72px)] text-left">
            <div className="w-full max-w-md bg-white border border-[#E5E7EB] p-8 shadow-sm rounded-[16px] space-y-6">
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-slate-909 font-display tracking-tight">Set Safe Credentials</h2>
                <p className="text-xs text-[#64748B]">Apply security tokens to finalize credential changes.</p>
              </div>

              {message && (
                <div className={`p-3 border text-xs rounded-[12px] flex items-start gap-2 ${
                  message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-bold">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Security Token Code</label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="E.g. TOKEN-SIM-VERIFIED"
                    className="w-full text-xs rounded-[12px] py-3 px-4 bg-[#FAFAF9] border border-slate-200 text-slate-900 outline-hidden font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Establish Password passcode</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 Characters Code"
                    className="w-full text-xs rounded-[12px] py-3 px-4 bg-[#FAFAF9] border border-slate-200 text-slate-900 outline-hidden font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-[10px] cursor-pointer transition-colors"
                >
                  Confirm Passcode Ingestion
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100">
                <button onClick={() => { setView('login'); clearMessages(); }} className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-800 font-mono tracking-wider">
                  ← Exit To Login Gate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REDEEM INVITATION PORTAL CARD */}
        {view === 'invite' && (
          <div className="px-6 py-20 flex items-center justify-center bg-[#FAFAF9] min-h-[calc(100vh-72px)] text-left">
            <div className="w-full max-w-lg bg-white border border-[#E5E7EB] p-8 shadow-sm rounded-[16px] space-y-6">
              
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900 font-display tracking-tight border-b pb-3 border-slate-50">Redeem Staff Invitation</h2>
                <p className="text-xs text-[#64748B]">Activate your state credentials using the invite token key issued.</p>
              </div>

              {/* Dynamic verified details banner */}
              {invitationDetails ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-[12px] space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <span className="text-[10px] font-bold text-emerald-800 font-mono tracking-wider">SECURE DISCOVERY IDENTITY</span>
                    <span className="text-[9px] bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">Abuja HQ Authorized</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="block text-[9px] text-[#64748B] font-mono uppercase font-bold">Mail Identity</span>
                      <span className="font-bold text-slate-800 truncate block">{invitationDetails.email}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#64748B] font-mono uppercase font-bold">Designated Role</span>
                      <span className="font-extrabold text-slate-800 block font-mono">{invitationDetails.role}</span>
                    </div>
                    {invitationDetails.departmentId && (
                      <div>
                        <span className="block text-[9px] text-[#64748B] font-mono uppercase font-bold">State Department</span>
                        <span className="font-bold text-slate-800 block truncate">{invitationDetails.departmentId}</span>
                      </div>
                    )}
                    {invitationDetails.jobTitle && (
                      <div>
                        <span className="block text-[9px] text-[#64748B] font-mono uppercase font-bold">Registry Title</span>
                        <span className="font-bold text-slate-800 block truncate">{invitationDetails.jobTitle}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : token && token.length > 10 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-[12px] flex items-center justify-center text-xs text-slate-500 gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-800 border-t-transparent" />
                  <span className="font-medium font-mono text-[10px] uppercase tracking-wider">Verifying Cryptographic Ledger Identity...</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-[12px] text-left text-[11px] font-medium leading-relaxed">
                  Enter your assigned invitation token key coordinate below to decrypt and review your official Nigeria OOMS department credentials.
                </div>
              )}

              {message && (
                <div className={`p-3 border text-xs rounded-[12px] flex items-start gap-2 ${
                  message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-bold">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleAcceptInvitation} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Preferred Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Alex Rivera"
                    className="w-full text-xs rounded-[12px] py-3 px-4 bg-[#FAFAF9] border border-slate-200 text-slate-900 outline-hidden font-bold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Invitation Code</label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="INV-XXXXX-XXXXX"
                    className="w-full text-xs rounded-[12px] py-3 px-4 bg-[#FAFAF9] border border-slate-200 text-slate-900 outline-hidden font-mono font-semibold"
                  />
                </div>

                {/* Identity Uploader Component */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Upload Identity Photo (PNG, JPEG, WebP - Max 2MB)</label>
                  <div className="flex items-center gap-4 p-3 bg-[#FAFAF9] border border-dashed border-slate-200 rounded-[12px] hover:bg-slate-50 transition-colors relative">
                    <div className="w-12 h-12 rounded-full border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {photoPath ? (
                        <img src={photoPath} alt="Preview" className="w-full h-full object-cover" />
                      ) : photoLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent" />
                      ) : (
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">Avatar</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[11px] font-bold text-slate-700">Drag & drop or click</p>
                      <p className="text-[9px] text-[#64748B]">PNG, JPG, WebP (2MB Max limit)</p>
                    </div>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={photoLoading}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* Dynamic Password Elements */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Create Secure Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs rounded-[12px] py-3 px-4 bg-[#FAFAF9] border border-slate-200 text-slate-900 outline-hidden font-mono"
                  />
                </div>

                {/* Confirm Password field */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Confirm Secure Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs rounded-[12px] py-3 px-4 bg-[#FAFAF9] border border-slate-200 text-slate-900 outline-hidden font-mono"
                  />
                </div>

                {/* Password Complexity Visual Checklist Box */}
                {password && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-[12px] text-left space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                      <span className="text-[#64748B] uppercase">Strength Meter Score:</span>
                      <span className={`${
                        getPasswordStrength(password).score >= 5 ? 'text-emerald-700' : getPasswordStrength(password).score >= 3 ? 'text-amber-700' : 'text-rose-700'
                      } uppercase`}>
                        {getPasswordStrength(password).label}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-250 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrength(password).color} transition-all duration-300`} 
                        style={{ width: `${getPasswordStrength(password).pct}%` }} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono text-[#64748B]">
                      <div className="flex items-center gap-1">
                        <span className={password.length >= 12 ? "text-emerald-500 font-extrabold" : "text-slate-300 font-extrabold"}>✓</span>
                        <span>Min 12 Characters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={/[A-Z]/.test(password) ? "text-emerald-500 font-extrabold" : "text-slate-300 font-extrabold"}>✓</span>
                        <span>Uppercase Letters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={/[a-z]/.test(password) ? "text-emerald-500 font-extrabold" : "text-slate-300 font-extrabold"}>✓</span>
                        <span>Lowercase Letters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={/[0-9]/.test(password) ? "text-emerald-500 font-extrabold" : "text-slate-300 font-extrabold"}>✓</span>
                        <span>Numeric Digits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-500 font-extrabold" : "text-slate-300 font-extrabold"}>✓</span>
                        <span>Special Characters</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || photoLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-[10px] cursor-pointer transition-colors"
                >
                  {loading ? 'Redeeming Credentials Ledger...' : 'Activate Personnel Membership'}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100">
                <button onClick={() => { setView('login'); clearMessages(); }} className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-800 font-mono tracking-wider">
                  ← Already active? Sign In
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
