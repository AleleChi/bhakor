import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Search, 
  Plus, 
  Layers, 
  Sliders, 
  Settings, 
  HardDrive, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  LayoutDashboard, 
  Wrench, 
  BarChart3, 
  X, 
  FileText, 
  Download, 
  ChevronRight, 
  Mail, 
  Clock, 
  Terminal,
  Play,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PrinterRecord, OOMSModule } from '../types';
import { 
  PrinterConnector, 
  SimulationConnector, 
  SNMPConnector, 
  IPPConnector 
} from '../lib/printerConnector';

interface PrintersDashboardViewProps {
  globalDept: string;
  globalLoc: string;
  onTriggerQuickAdd: (mod: OOMSModule) => void;
}

// Initial default printers to guarantee live dashboard seeding
const INITIAL_PRINTERS: PrinterRecord[] = [];

export default function PrintersDashboardView({ 
  globalDept, 
  globalLoc, 
  onTriggerQuickAdd 
}: PrintersDashboardViewProps) {
  
  // Tabs: overview, monitoring, alerts, consumables, maintenance, analytics, drivers, settings
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'alerts' | 'consumables' | 'maintenance' | 'analytics' | 'drivers' | 'settings'>('overview');
  
  const [printers, setPrinters] = useState<PrinterRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('');
  
  // Detail Drawer state
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'consumables' | 'maintenance' | 'activity' | 'configuration'>('overview');

  // Interactive firmware diagnostics/Replenish panel state
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([]);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [activeConnectorType, setActiveConnectorType] = useState<'Simulation' | 'SNMP' | 'IPP'>('Simulation');

  // Logs database for alert simulations
  const [simulatedAlerts, setSimulatedAlerts] = useState<Array<{
    id: string;
    printerId: string;
    printerName: string;
    type: string;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    timestamp: string;
  }>>([]);

  const notifiedStates = useRef<Record<string, string>>({});

  useEffect(() => {
    // Synchronize or load default initial state
    const saved = localStorage.getItem('ooms_printers_registry');
    if (saved) {
      setPrinters(JSON.parse(saved));
    } else {
      localStorage.setItem('ooms_printers_registry', JSON.stringify(INITIAL_PRINTERS));
      setPrinters(INITIAL_PRINTERS);
    }
    setIsLoading(false);

    // Seed default alert system warnings
    setSimulatedAlerts([]);
  }, []);

  // Fleet Alerts triggers
  useEffect(() => {
    printers.forEach(p => {
      const id = p.id;
      const lastStatus = notifiedStates.current[id];

      if (lastStatus !== p.status && lastStatus !== undefined) {
        if (p.status === 'Offline') {
          toast.error(`Device Offline Alarm: "${p.name}" has stopped responding to SNMP health ping.`);
        } else if (p.status === 'Online') {
          toast.success(`Device Connected: "${p.name}" is back online and accepting secure IPP jobs.`);
        }
      }
      notifiedStates.current[id] = p.status;
    });

    localStorage.setItem('ooms_printers_registry', JSON.stringify(printers));
  }, [printers]);

  // Connectors handshakes
  const triggerConnectorDiagnostics = async (printer: PrinterRecord) => {
    setIsQuerying(true);
    setDiagnosticsLogs([`Handshake: Allocating micro-bridge to ${activeConnectorType} agent...`]);
    
    let connector: PrinterConnector;
    if (activeConnectorType === 'SNMP') {
      connector = new SNMPConnector(printer);
    } else if (activeConnectorType === 'IPP') {
      connector = new IPPConnector(printer);
    } else {
      connector = new SimulationConnector(printer);
    }

    try {
      const logs = await connector.connect();
      setDiagnosticsLogs(prev => [...prev, ...logs]);

      const consumables = await connector.fetchConsumables();
      setDiagnosticsLogs(prev => [
        ...prev,
        `[COMMUNICATION-GATEWAY] SNMP MIB response checked: Toner ${consumables.toner}%, Paper Feed ${consumables.paper}%, Kit Life ${consumables.maintenanceKit}%`
      ]);

      toast.success(`Diagnostics Handshake Successful with ${printer.name}`);
    } catch {
      setDiagnosticsLogs(prev => [...prev, `[ERROR] Handshake failed on dedicated channel.`]);
      toast.error(`Ingress error communicating with printer address ${printer.ipAddress}`);
    } finally {
      setIsQuerying(false);
    }
  };

  // Calibrate & Replenish Consumables
  const handleReplenishConsumable = async (printerId: string, type: 'toner' | 'paper' | 'maintenance' | 'drum') => {
    setPrinters(prev => prev.map(p => {
      if (p.id === printerId) {
        let updatedStatus = p.status;
        let uToner = p.tonerLevel;
        let uPaper = p.paperLevel ?? 80;
        let uDrum = p.drumLife ?? 85;
        let uMaint = p.maintenanceKitLife ?? 75;

        if (type === 'toner') {
          uToner = 100;
          if (updatedStatus === 'Low Toner') updatedStatus = 'Online';
        } else if (type === 'paper') {
          uPaper = 100;
        } else if (type === 'drum') {
          uDrum = 100;
        } else if (type === 'maintenance') {
          uMaint = 100;
        }

        return {
          ...p,
          status: updatedStatus,
          tonerLevel: uToner,
          paperLevel: uPaper,
          drumLife: uDrum,
          maintenanceKitLife: uMaint
        };
      }
      return p;
    }));

    toast.success(`Replenished: Calibration complete! ${type.toUpperCase()} level restored to 100% on S/N ${printers.find(p=>p.id===printerId)?.serialNumber}`);
  };

  const filteredPrinters = printers.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ipAddress.includes(searchTerm) ||
      p.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = !selectedDeptFilter || p.department === selectedDeptFilter;
    const matchesStatus = !selectedStatusFilter || p.status === selectedStatusFilter;
    const matchesVendor = !selectedVendorFilter || p.vendor === selectedVendorFilter;

    return matchesSearch && matchesDept && matchesStatus && matchesVendor;
  });

  // KPI math
  const countTotal = printers.length;
  const countOnline = printers.filter(p => p.status === 'Online').length;
  const countOffline = printers.filter(p => p.status === 'Offline').length;
  const countLowToner = printers.filter(p => p.status === 'Low Toner' || p.tonerLevel < 15).length;
  const countLowPaper = printers.filter(p => (p.paperLevel ?? 80) < 15).length;
  const countMaintDue = printers.filter(p => (p.maintenanceKitLife ?? 75) < 20).length;

  const fleetHealth = Math.max(0, Math.floor(100 - (countOffline * 20 + countLowToner * 10 + countLowPaper * 5)));

  // Analytics data
  const ANALYTICS_DATA = [
    { name: 'Mon', blackPrints: 3400, colorPrints: 1200 },
    { name: 'Tue', blackPrints: 4800, colorPrints: 2200 },
    { name: 'Wed', blackPrints: 5100, colorPrints: 1800 },
    { name: 'Thu', blackPrints: 4400, colorPrints: 2000 },
    { name: 'Fri', blackPrints: 6200, colorPrints: 2700 },
    { name: 'Sat', blackPrints: 1100, colorPrints: 400 },
    { name: 'Sun', blackPrints: 800, colorPrints: 200 }
  ];

  return (
    <div className="flex gap-6 min-h-[580px] bg-[#F8FAFC] select-none font-sans">
      
      {/* 1. LEFT PRINTER FLIGHT SIDEBAR (WIDTH 260PX) */}
      <div className="w-[260px] shrink-0 border border-[#E5E7EB] bg-[#0F172A] rounded-2xl p-4.5 text-left flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-3 select-none leading-none border-b border-slate-800 pb-4">
            <Printer className="w-5 h-5 text-[#F59E0B]" />
            <div className="text-left">
              <h3 className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest">Supervisor</h3>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-0.5">Printer Fleet</h4>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: 'overview', label: 'Fleet Overview', icon: LayoutDashboard },
              { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
              { id: 'alerts', label: 'Alert Center', icon: ShieldAlert, badge: countLowToner + countOffline },
              { id: 'consumables', label: 'Consumables Shelf', icon: Layers },
              { id: 'maintenance', label: 'Maintenance Hub', icon: Wrench },
              { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
              { id: 'drivers', label: 'Driver Registry', icon: HardDrive },
              { id: 'settings', label: 'Engine Settings', icon: Settings }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3.5 text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#FFF7ED] text-[#D97706] border-l-4 border-[#F59E0B] pl-2.5 font-extrabold' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <tab.icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#D97706]' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[8px] tracking-none font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand foot credit */}
        <div className="px-3 py-2 border-t border-slate-800 pt-4 text-left leading-normal">
          <p className="text-[8.5px] font-mono font-bold text-slate-500 uppercase">Supervising Node</p>
          <p className="text-[8.5px] font-bold text-slate-350">Bhakor Consult Limited</p>
        </div>
      </div>

      {/* 2. MAIN HUB WORKSPACE GRID */}
      <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs p-6 overflow-hidden flex flex-col justify-between">
        
        {/* TITLE AND SEARCH ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div className="text-left">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
              {activeTab === 'overview' && 'Hardware Fleet Operational Board'}
              {activeTab === 'monitoring' && 'Live Device Health Core'}
              {activeTab === 'alerts' && 'Critical Printer Fleet Alerts Warning Console'}
              {activeTab === 'consumables' && 'Consumables Capacity Controller Table'}
              {activeTab === 'maintenance' && 'Facilities Maintenance Kit Ingress'}
              {activeTab === 'analytics' && 'Mined Usage & Prints Statistics'}
              {activeTab === 'drivers' && 'Sovereign Driver Package Repository'}
              {activeTab === 'settings' && 'Systems Hardware SNMP Community Settings'}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Active telemetry channel: Host port 161 SNMP monitoring active
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onTriggerQuickAdd('Printers')} 
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-transparent shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5 font-bold" />
              Register Printer
            </button>
          </div>
        </div>

        {/* VIEW CONDITIONAL BLOCKS */}

        {/* A. FLEET OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-4 gap-4 text-left select-none">
              <div className="p-4.5 border border-[#E5E7EB] bg-slate-50 rounded-2xl relative overflow-hidden">
                <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-widest block">Operational Ratio</span>
                <span className="text-2xl font-black text-slate-800 block mt-1.5 font-mono">{fleetHealth}%</span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3 block">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${fleetHealth}%` }}></div>
                </div>
                <p className="text-[9.5px] text-slate-450 font-semibold mt-2">Aggregated Fleet reliability score</p>
              </div>

              <div className="p-4.5 border border-[#E5E7EB] bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-widest block">Active Devices</span>
                <span className="text-2xl font-black text-slate-850 block mt-1.5 font-mono">{countOnline} <span className="text-slate-400 text-xs">/ {countTotal}</span></span>
                <p className="text-[9.5px] text-slate-450 font-semibold mt-5">Active networked SNMP hardware</p>
              </div>

              <div className="p-4.5 border border-[#E5E7EB] bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-rose-500 font-mono tracking-widest block">Offline Alarms</span>
                <span className="text-2xl font-black text-rose-600 block mt-1.5 font-mono">{countOffline}</span>
                <p className="text-[9.5px] text-rose-500 font-semibold mt-5">Host unreachable over Port 161</p>
              </div>

              <div className="p-4.5 border border-[#E5E7EB] bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-amber-600 font-mono tracking-widest block">Consumables Warning</span>
                <span className="text-2xl font-black text-[#D97706] block mt-1.5 font-mono">{countLowToner + countLowPaper}</span>
                <p className="text-[9.5px] text-slate-450 font-semibold mt-5">Reserve drops below 15%</p>
              </div>
            </div>

            {/* Split row - quick trace + health summary */}
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Quick test control console */}
              <div className="col-span-7 border border-[#E5E7EB] rounded-2xl p-5 text-left space-y-4">
                <div className="flex items-center justify-between border-b pb-2 mb-2 leading-none">
                  <div className="text-left">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">DMS Micro-diagnostic handshake</h3>
                    <h4 className="text-xs font-black text-[#0F172A] mt-0.5">ACTIVE DEVICE TELEMETRY TRACER</h4>
                  </div>
                  
                  {/* Select printer to test */}
                  <select 
                    id="telemetry-device-selection-box"
                    aria-label="Target hardware address selection"
                    onChange={(e) => {
                      const found = printers.find(pr => pr.id === e.target.value);
                      if (found) setSelectedPrinter(found);
                    }}
                    className="p-1 px-2 border rounded text-[10px] font-bold text-slate-700 outline-hidden bg-white"
                  >
                    {printers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950 p-4.5 rounded-xl font-mono text-[10.5px] text-emerald-400 leading-relaxed min-h-[160px] max-h-[160px] overflow-y-auto antialiased">
                  {diagnosticsLogs.length === 0 ? (
                    <span className="text-slate-500 italic">Console ready. Select communication model schema and hit "Execute Ping Diagnostic Pipeline".</span>
                  ) : (
                    diagnosticsLogs.map((log, i) => (
                      <div key={i} className="border-b border-slate-900/30 pb-0.5 last:border-b-0 whitespace-pre">
                        {log}
                      </div>
                    ))
                  )}
                </div>

                {/* Handshake actions toolbar */}
                <div className="flex items-center justify-between pt-1 uppercase">
                  <div className="flex gap-2 text-[10px] uppercase font-mono font-black">
                    {['Simulation', 'SNMP', 'IPP'].map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveConnectorType(type as any)}
                        className={`px-3 py-1 mr-1 border rounded-md transition-all cursor-pointer ${
                          activeConnectorType === type 
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white text-slate-550 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type} Mode
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => selectedPrinter && triggerConnectorDiagnostics(selectedPrinter)}
                    disabled={isQuerying || !selectedPrinter}
                    className="p-2 px-4 bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-black uppercase rounded-xl cursor-not-allowed cursor-pointer disabled:opacity-50"
                  >
                    {isQuerying ? 'Querying...' : 'Execute Ping Diagnostic'}
                  </button>
                </div>
              </div>

              {/* Status breakdown logs */}
              <div className="col-span-5 border border-[#E5E7EB] rounded-2xl p-5 text-left space-y-3.5 max-h-[305px] overflow-y-auto">
                <div className="border-b pb-2 mb-1.5 leading-none">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-rose-500 font-mono">Immediate Handshake Alerts</h3>
                  <h4 className="text-xs font-black text-[#0F172A] mt-0.5">ACTIVE DEVICE EXHAUSTION WARNINGS</h4>
                </div>

                {simulatedAlerts.map(alert => (
                  <div key={alert.id} className="p-3 border border-slate-150 rounded-xl relative hover:bg-slate-50 transition-colors flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 block ${
                      alert.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                    }`}></span>
                    <div className="text-xs leading-normal">
                      <span className="font-bold text-slate-855 block">{alert.printerName}</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Quick telemetry footer */}
            <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-[9px] uppercase tracking-wider font-bold text-slate-450 font-mono mt-3 leading-none select-none">
              <span>ACTIVE INVENTORY POLLING FREQUENCY: 60 SECONDS (SNMP v3 MIB POLLING INTERFACE)</span>
              <span>NOMINAL OPERATIONS: 100% HEALTH</span>
            </div>
          </div>
        )}

        {/* B. LIVE MONITORING TABLE TAB */}
        {activeTab === 'monitoring' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 select-none text-left">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search and query active network printer nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs rounded-xl py-3 pl-11 pr-4 bg-slate-50 focus:bg-white border border-[#E5E7EB] focus:border-[#F59E0B] outline-hidden font-semibold transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto font-bold text-xs uppercase tracking-wider">
                <select 
                  aria-label="Filter devices by brand"
                  value={selectedVendorFilter} 
                  onChange={(e) => setSelectedVendorFilter(e.target.value)}
                  className="p-2.5 px-3 border border-slate-200 bg-white rounded-xl text-[10px] font-black cursor-pointer text-slate-700 outline-hidden"
                >
                  <option value="">All Brands</option>
                  <option value="HP">HP LaserJet</option>
                  <option value="Canon">Canon ImageRUNNER</option>
                  <option value="Kyocera">Kyocera</option>
                  <option value="Ricoh">Ricoh IMC</option>
                </select>

                <select 
                  aria-label="Filter devices by department"
                  value={selectedDeptFilter} 
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="p-2.5 px-3 border border-slate-200 bg-white rounded-xl text-[10px] font-black cursor-pointer text-slate-700 outline-hidden"
                >
                  <option value="">All Regions</option>
                  <option value="Operations">Operations</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Finance">Finance Department</option>
                  <option value="Executive Office">Executive Suite</option>
                </select>
              </div>
            </div>

            {/* Standardized hover table layout */}
            <div className="flex-1 overflow-x-auto border border-[#E5E7EB] rounded-2xl bg-white max-h-[360px] overflow-y-auto">
              <table className="w-full text-[11px] text-left border-collapse select-none leading-normal">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E5E7EB] text-[9.5px] font-bold font-mono text-slate-450 uppercase select-none">
                    <th className="p-3.5 pl-5 select-none">Printer Unit Detail</th>
                    <th className="p-3.5 select-none">Category Location</th>
                    <th className="p-3.5 select-none">Network Address</th>
                    <th className="p-3.5 select-none">Toner</th>
                    <th className="p-3.5 select-none">Paper Stock</th>
                    <th className="p-3.5 select-none">Drum Life</th>
                    <th className="p-3.5 select-none">Monthly Usage</th>
                    <th className="p-3.5 pr-5 select-none text-right">Unit status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrinters.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center select-none text-slate-400">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                          <Printer className="w-5 h-5 text-slate-400 animate-pulse" />
                        </div>
                        <p className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider">No Records Found</p>
                        <p className="text-[10px] text-slate-450 mt-1 font-semibold mb-4">No active devices have been discovered or manually registered.</p>
                        <button
                          type="button"
                          onClick={() => onTriggerQuickAdd('Printers')}
                          className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase rounded-lg shadow-xs cursor-pointer transition"
                        >
                          Register Device
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPrinters.map(p => (
                      <tr 
                        key={p.id}
                        onClick={() => {
                          setSelectedPrinter(p);
                          setDrawerOpen(true);
                        }}
                        className="hover:bg-[#FFF7ED] transition-all border-b border-slate-100 last:border-b-0 cursor-pointer group hover:border-l-4 hover:border-l-[#F59E0B]"
                      >
                        <td className="p-3.5 pl-5 group-hover:pl-4 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Printer className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] shrink-0" />
                            <div className="min-w-0 text-left">
                              <span className="font-bold text-slate-850 block truncate group-hover:text-slate-900">{p.printerName}</span>
                              <span className="text-[9px] text-slate-400 font-semibold font-mono block mt-0.5">{p.serialNumber}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-left">
                          <span className="font-bold text-slate-700 block">{p.department}</span>
                          <span className="text-[9.5px] text-slate-400 block font-semibold truncate max-w-[130px]">{p.location}</span>
                        </td>

                        <td className="p-3.5 font-mono text-[9px] font-bold text-slate-500">
                          {p.ipAddress}
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 min-w-[70px]">
                            <span className={`text-[9.5px] font-bold font-mono ${p.tonerLevel < 15 ? 'text-rose-600' : 'text-slate-700'}`}>{p.tonerLevel}%</span>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden block">
                              <div className={`h-full ${p.tonerLevel < 15 ? 'bg-rose-500 animate-pulse' : 'bg-slate-800'}`} style={{ width: `${p.tonerLevel}%` }}></div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 min-w-[70px]">
                            <span className={`text-[9.5px] font-bold font-mono ${(p.paperLevel ?? 80) < 15 ? 'text-rose-600' : 'text-slate-700'}`}>{p.paperLevel ?? 80}%</span>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden block">
                              <div className="h-full bg-slate-900" style={{ width: `${p.paperLevel ?? 80}%` }}></div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 min-w-[70px]">
                            <span className="text-[9.5px] font-bold font-mono text-slate-700">{p.drumLife ?? 85}%</span>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden block">
                              <div className="h-full bg-amber-500" style={{ width: `${p.drumLife ?? 85}%` }}></div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-[9px] font-bold text-slate-600">
                          {p.pagesPrintedMonth.toLocaleString()} pgs
                        </td>

                        <td className="p-3.5 pr-5 text-right">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                            p.status === 'Online' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : p.status === 'Offline' 
                              ? 'bg-rose-50 text-rose-700 border-rose-100' 
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${p.status === 'Online' ? 'bg-emerald-500' : p.status === 'Offline' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[9.5px] text-slate-400 font-bold uppercase font-mono text-left leading-none mt-2">
              CONCATENATED DEVICE FLIGHT DECK GRID STATUS DIRECTORY • PRESS ROW TO SUMMON OVERVIEW CONTROL SYSTEM
            </p>
          </div>
        )}

        {/* C. ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-left font-sans select-none space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-800 font-mono tracking-wider block">Supervisory Command Center Alarm Logs</span>
              <p className="text-[10.5px] text-rose-700 leading-normal font-medium">
                The alerts below are dispatched directly from device SNMP MIBS, and link in real-time to supervisor email notifications & dashboard alerts systems.
              </p>
            </div>

            <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto pr-1 text-left">
              {simulatedAlerts.map(alert => (
                <div key={alert.id} className="p-3.5 border border-slate-150 rounded-xl relative hover:bg-slate-50 transition-colors flex items-start gap-3.5">
                  <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                    alert.severity === 'critical' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-amber-100 text-[#D97706] border-amber-200'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#0F172A]">{alert.printerName}</span>
                      <span className="text-[9.5px] text-slate-400 font-mono font-bold">{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-rose-500 font-mono block mt-1">{alert.type}</span>
                    <p className="text-[11px] text-slate-650 font-semibold leading-normal mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Trigger buttons */}
            <div className="flex justify-end gap-3.5 text-[9.5px] font-mono font-black border-t pt-3 uppercase">
              <button 
                onClick={() => {
                  toast.success('Simulation: Electronic alert stream dispatched back to OOMS dashboard notifications center.');
                }}
                className="p-2.5 px-4 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-slate-800"
              >
                Sync with Global Notification center
              </button>
            </div>
          </div>
        )}

        {/* D. CONSUMABLES SHELF TAB */}
        {activeTab === 'consumables' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between text-left">
            <div className="grid grid-cols-2 gap-4">
              {printers.map(p => (
                <div key={p.id} className="p-4 border rounded-xl bg-slate-50 space-y-3.5">
                  <div className="flex items-center justify-between border-b pb-2 leading-none">
                    <div className="text-left">
                      <h4 className="text-xs font-black text-[#0F172A] truncate max-w-[190px]">{p.printerName}</h4>
                      <p className="text-[9.5px] text-slate-400 font-mono font-bold mt-0.5">{p.serialNumber}</p>
                    </div>
                    <span className="p-1 px-1.5 rounded bg-white border font-mono text-[9px] font-extrabold">{p.ipAddress}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs leading-none">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-500">Black Toner</span>
                        <span className="font-mono text-slate-800">{p.tonerLevel}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden block">
                        <div className={`h-full ${p.tonerLevel < 15 ? 'bg-rose-500' : 'bg-slate-800'}`} style={{ width: `${p.tonerLevel}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-500">Paper Tray</span>
                        <span className="font-mono text-slate-800">{p.paperLevel ?? 80}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden block">
                        <div className="h-full bg-slate-900" style={{ width: `${p.paperLevel ?? 80}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-500">Drum Life</span>
                        <span className="font-mono text-slate-800">{p.drumLife ?? 85}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden block">
                        <div className="h-full bg-amber-500" style={{ width: `${p.drumLife ?? 85}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-slate-500">Maint Kit</span>
                        <span className="font-mono text-slate-800">{p.maintenanceKitLife ?? 75}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden block">
                        <div className="h-full bg-amber-600" style={{ width: `${p.maintenanceKitLife ?? 75}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 text-[8.5px] font-mono font-black uppercase pt-1 border-t">
                    <button onClick={() => handleReplenishConsumable(p.id, 'toner')} className="text-amber-600 hover:underline">Refill Toner</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleReplenishConsumable(p.id, 'paper')} className="text-slate-650 hover:underline">Replenish Paper</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E. MAINTENANCE HUB TAB */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between text-left">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest block">Next Schedule Overhaul</span>
                <span className="text-sm font-extrabold text-slate-800 block">Friday, 18 June 2126</span>
                <p className="text-[10px] text-slate-450 leading-relaxed">Sovereign audit calibration triggers mandatory mechanical overhaul on all HP models.</p>
              </div>

              <div className="p-4 border rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest block">Emergency Repair Hotlines</span>
                <span className="text-sm font-extrabold text-slate-800 block">HP Care-Pack Gold</span>
                <p className="text-[10px] text-slate-450 leading-relaxed">Dedicated contractor engineering support contract code: <strong className="font-mono text-slate-800">BK-DMS-LaserJet-902</strong></p>
              </div>

              <div className="p-4 border rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-[#F59E0B] font-mono tracking-widest block">Primary technician</span>
                <span className="text-sm font-extrabold text-slate-800 block">Bako Sani Consults</span>
                <p className="text-[10px] text-slate-450 leading-relaxed">Contract certified hardware engineering supervisor for Bhakor Consult.</p>
              </div>
            </div>

            {/* Scheduled checklist list */}
            <div className="space-y-3.5 border border-slate-100 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-2 leading-none">Facilities checklist history dockets logs</span>
              {[
                { printer: 'Procurement Canon IR C5535i', serial: 'SND-CAN-IR-C5535-992', task: 'Reset high fidelity drum kit & optical fusers calibrate', date: '08 June 2026', technician: 'Bako Sani' },
                { printer: 'Finance Kyocera TASKalfa', serial: 'SND-KYO-TA-4002-331', task: 'Vacuum toner residue assembly and replenish secondary tray feed sensors', date: '01 June 2026', technician: 'Musa Abdullahi' }
              ].map((task, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-slate-50/50 flex justify-between items-center text-xs">
                  <div className="text-left">
                    <span className="font-bold text-slate-800 block">{task.printer}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block font-semibold">{task.task}</span>
                  </div>
                  <div className="text-right text-[10px] font-mono leading-normal">
                    <p className="font-bold text-slate-700">Date: {task.date}</p>
                    <p className="text-slate-400 font-medium">Tech: {task.technician}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* F. USAGE ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between text-left relative">
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 font-mono block leading-none">Weekly Print Telemetry Analysis</span>
                <h4 className="text-xs font-black text-[#0F172A] mt-1">Cumulative Ingress Prints Metric (color vs black-mono streams)</h4>
              </div>
            </div>

            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={ANALYTICS_DATA}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBlack" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontStyle="bold" />
                  <YAxis stroke="#64748B" fontSize={10} fontStyle="bold" />
                  <Tooltip />
                  <Area type="monotone" dataKey="blackPrints" stroke="#0F172A" fillOpacity={1} fill="url(#colorBlack)" />
                  <Area type="monotone" dataKey="colorPrints" stroke="#F59E0B" fillOpacity={1} fill="url(#colorColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* G. DRIVERS TAB */}
        {activeTab === 'drivers' && (
          <div className="grid grid-cols-2 gap-4 flex-1 text-left">
            {[
              { vendor: 'HP', desc: 'HP LaserJet printer subsystem driver package', size: '185 MB', version: 'v6.2201_64x', tag: 'PCL6 Universal Driver' },
              { vendor: 'Canon', desc: 'Canon generic UFR II and PS printer drivers package standard', size: '220 MB', version: 'v30.45.02', tag: 'UFRII Print Gateway' },
              { vendor: 'Kyocera', desc: 'Kyocera KPDL print interpreter package', size: '94 MB', version: 'v8.112', tag: 'KPDL/KUIO Interpreter' },
              { vendor: 'Ricoh', desc: 'Ricoh universal composite print package driver', size: '135 MB', version: 'v4.11', tag: 'Universal V4 composite' }
            ].map((dr, i) => (
              <div key={i} className="p-4 border rounded-xl bg-slate-50 flex items-start gap-4">
                <div className="p-3 bg-white border rounded-xl text-[#F59E0B] shrink-0 font-extrabold uppercase text-xs font-mono">
                  {dr.vendor}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0F172A]">{dr.tag}</span>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">{dr.version}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal">{dr.desc}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t">
                    <span className="text-[10px] text-slate-400 font-mono font-bold leading-none">{dr.size} Archive</span>
                    <button 
                      onClick={() => toast.success(`Simulated driver archive download: printer driver docket key initiated.`)} 
                      className="text-[#D97706] hover:underline uppercase text-[9px] font-mono font-black"
                    >
                      Retrieve package
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* H. ENGINE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4 flex-1 text-left">
            <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">SNMP Community Network Handshake Settings</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-450 font-mono block mb-1">SNMP Read Community (Default)</label>
                  <input type="text" defaultValue="public" className="w-full p-2.5 bg-white border text-xs font-mono font-bold text-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-450 font-mono block mb-1">SNMP Write Community</label>
                  <input type="text" defaultValue="private" className="w-full p-2.5 bg-white border text-xs font-mono font-bold text-slate-700 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-450 font-mono block mb-1">Heartbeat Polling Interval</label>
                  <select className="w-full p-2.5 bg-white border text-xs font-mono font-bold text-slate-700 rounded-xl">
                    <option value="60">60 Seconds (Sovereign default)</option>
                    <option value="120">120 Seconds</option>
                    <option value="300">5 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-450 font-mono block mb-1">Alert Broadcast Trigger System</label>
                  <select className="w-full p-2.5 bg-white border text-xs font-mono font-bold text-slate-700 rounded-xl">
                    <option value="both">Both Email & Toast Notify</option>
                    <option value="email">SMTP Email channel only</option>
                    <option value="toast">HUD browser alert only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button 
                  onClick={() => toast.success('Sovereign SNMP network settings persisted successfully.')}
                  className="p-2.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl text-[10px] tracking-wider uppercase font-extrabold"
                >
                  Save settings
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. RIGHT HAND DETAILED SLIDE-OUT DRAWER (WIDTH 420PX) */}
      {drawerOpen && selectedPrinter && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="w-[420px] bg-white h-full border-l p-6 shadow-2xl flex flex-col justify-between text-left animate-in slide-in-from-right duration-200">
            
            {/* Header drawer info */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 leading-none select-none">
              <div className="text-left">
                <h3 className="text-[10px] font-black uppercase text-[#F59E0B] font-mono tracking-widest">{selectedPrinter.vendor} {selectedPrinter.model}</h3>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mt-1 truncate max-w-[280px]">
                  {selectedPrinter.printerName}
                </h4>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)} 
                className="p-1 px-1.5 rounded bg-slate-50 hover:bg-slate-100 border text-slate-500 cursor-pointer text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector drawer subtabs */}
            <div className="flex items-center gap-1 border-b pb-2 mb-4 text-[10px] font-mono font-black uppercase overflow-x-auto select-none">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'consumables', label: 'Consumables' },
                { id: 'maintenance', label: 'Maintenance' },
                { id: 'activity', label: 'Activity Logs' },
                { id: 'configuration', label: 'Config' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id as any)}
                  className={`px-3 py-1.5 border rounded-md shrink-0 cursor-pointer transition-all ${
                    drawerTab === tab.id 
                      ? 'bg-slate-900 text-white border-slate-900 font-extrabold' 
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 font-bold'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT OVERLAYS */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Drawer overview subtab */}
              {drawerTab === 'overview' && (
                <div className="space-y-4 select-none leading-normal">
                  <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Device Model</span>
                      <span className="font-bold text-slate-750">{selectedPrinter.vendor} {selectedPrinter.model}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Serial Registry Key</span>
                      <span className="font-mono font-bold text-slate-650">{selectedPrinter.serialNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Department Location</span>
                      <span className="font-extrabold text-slate-805">{selectedPrinter.department}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Physical Coordinates</span>
                      <span className="font-semibold text-slate-500">{selectedPrinter.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Device address IP</span>
                      <span className="font-mono bg-white p-0.5 px-1.5 border text-[9.5px] rounded-md font-extrabold">{selectedPrinter.ipAddress}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl">
                    <span className="text-[9px] uppercase font-extrabold text-[#D97706] font-mono tracking-wider block">Diagnostics telemetry pinger</span>
                    <p className="text-[10px] text-amber-800 leading-normal mt-1 font-semibold">
                      Verify connection heartbeat via local port: S/N {selectedPrinter.serialNumber} communicates on standard v3 MIB channels.
                    </p>
                  </div>
                </div>
              )}

              {/* Drawer consumables subtab (strictly horizontal progress bars) */}
              {drawerTab === 'consumables' && (
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-2">Reserved Capacity meters</span>
                  {[
                    { label: 'Black Carbon Toner', val: selectedPrinter.tonerLevel, color: '#0F172A' },
                    { label: 'Cyan Chemical reserve', val: Math.min(100, selectedPrinter.tonerLevel + 11), color: '#3B82F6' },
                    { label: 'Magenta Chemical reserve', val: Math.min(100, selectedPrinter.tonerLevel + 4), color: '#EC4899' },
                    { label: 'Yellow Chemical reserve', val: Math.min(100, selectedPrinter.tonerLevel + 9), color: '#EAB308' },
                    { label: 'Paper Tray 1 Feed', val: selectedPrinter.paperLevel ?? 80, color: '#64748B' }
                  ].map((subc, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{subc.label}</span>
                        <span className="font-mono">{subc.val}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden block">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${subc.val}%`, backgroundColor: subc.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Drawer maintenance subtab */}
              {drawerTab === 'maintenance' && (
                <div className="space-y-4 text-xs select-none">
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Maintenance Kit reserves</span>
                      <span className="font-mono text-slate-800">{selectedPrinter.maintenanceKitLife ?? 75}% remaining</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden block">
                      <div className="h-full bg-amber-600" style={{ width: `${selectedPrinter.maintenanceKitLife ?? 75}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-lg mt-3 text-left leading-normal space-y-1.5">
                    <span className="font-bold text-[#0F172A] block text-[10px] uppercase font-mono text-slate-400">Task Log checklists</span>
                    <div className="text-[10.5px] text-slate-650 font-semibold text-slate-600">
                      • Replace roller feed feed-sensor (Due at 45,000 prints). <br />
                      • Calibrate thermal fuser elements.
                    </div>
                  </div>
                </div>
              )}

              {/* Drawer Activity Logs */}
              {drawerTab === 'activity' && (
                <div className="space-y-3 max-h-[290px] overflow-y-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">Heartbeat audit logs stream</span>
                  {[
                    { log: `SNMP query: completed nominal system ping. Response: OK.`, d: 'Today, 14:26:00' },
                    { log: `Heartbeat check: established tcp handshake over port 161.`, d: 'Today, 14:15:20' },
                    { log: `Print task: processed continuous job queue 18 pgs.`, d: 'Today, 13:42:15' }
                  ].map((act, i) => (
                    <div key={i} className="p-2.5 border rounded-lg bg-slate-50/50 text-[10.5px]">
                      <p className="font-semibold text-slate-750 font-medium leading-normal">{act.log}</p>
                      <span className="text-[9px] text-slate-400 font-mono font-semibold block mt-0.5 leading-none">{act.d}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Drawer Configuration */}
              {drawerTab === 'configuration' && (
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-3 leading-none select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">SNMP community</span>
                    <span className="font-mono font-bold text-slate-705">public / private</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Driver package level</span>
                    <span className="font-mono font-bold text-slate-705">HP Universal v6.2.1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Supported features</span>
                    <span className="font-mono font-bold text-slate-705 text-right font-semibold">Duplex, A4, Letter, PostScript3</span>
                  </div>
                </div>
              )}

            </div>

            {/* Calibration commands bottom shelf */}
            <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono font-black uppercase">
              <button 
                onClick={() => handleReplenishConsumable(selectedPrinter.id, 'toner')}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl cursor-pointer text-center"
              >
                Refill Toner
              </button>
              <button 
                onClick={() => handleReplenishConsumable(selectedPrinter.id, 'paper')}
                className="py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl cursor-pointer text-center animate-in"
              >
                Refill Paper Tray
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
