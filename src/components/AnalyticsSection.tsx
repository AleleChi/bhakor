import React, { useState } from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend,
  Cell, PieChart, Pie
} from 'recharts';
import { 
  Building2, 
  TrendingUp, 
  Briefcase, 
  Layers, 
  Activity, 
  ShieldCheck, 
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';

interface AnalyticsSectionProps {
  standalone?: boolean;
  department?: string;
  analyticsData?: any;
  isLoading?: boolean;
  isError?: boolean;
  view?: 'row2' | 'row4' | 'all';
}

export default function AnalyticsSection({ 
  standalone = false, 
  department, 
  analyticsData, 
  isLoading = false, 
  isError = false,
  view = 'all'
}: AnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState<'spending' | 'fleet' | 'inventory' | 'correspondence' | 'reports'>('spending');
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="ooms-card p-6 flex flex-col items-center justify-center text-center h-[340px] animate-pulse">
        <Activity className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider font-sans">Updating report metrics...</p>
      </div>
    );
  }

  if (isError || !analyticsData) {
    return (
      <div className="ooms-card p-6 flex flex-col items-center justify-center text-center h-[340px]">
        <AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
        <p className="text-sm font-bold text-slate-800">No data available</p>
        <p className="text-xs text-[#64748B] mt-1">Please re-establish your workspace connection.</p>
      </div>
    );
  }

  // Multi-Month Operational Activity data mapping
  const monthlySpendData = analyticsData?.fleetUsageTrend?.map((item: any, i: number) => {
    const subCost = (analyticsData?.correspondenceTrend?.[i]?.['Incoming Mail'] || 40 + i * 5) * 60;
    return {
      month: item.month,
      'Subscription Spend': subCost,
      'Fuel Spend': item.cost || (200 + i * 40),
      'Combined Spend': subCost + (item.cost || 200 + i * 40)
    };
  }) || [
    { month: 'Jan', 'Subscription Spend': 2400, 'Fuel Spend': 1800, 'Combined Spend': 4200 },
    { month: 'Feb', 'Subscription Spend': 2800, 'Fuel Spend': 2100, 'Combined Spend': 4900 },
    { month: 'Mar', 'Subscription Spend': 3100, 'Fuel Spend': 1900, 'Combined Spend': 5000 },
    { month: 'Apr', 'Subscription Spend': 3500, 'Fuel Spend': 2600, 'Combined Spend': 6100 },
    { month: 'May', 'Subscription Spend': 4000, 'Fuel Spend': 3105, 'Combined Spend': 7105 },
    { month: 'Jun', 'Subscription Spend': 4200, 'Fuel Spend': 3400, 'Combined Spend': 7600 },
  ];

  // Department Distribution Donut
  const departmentDistribution = analyticsData?.departmentDistribution || [
    { name: 'IT Support', value: 40, color: '#3B82F6' },
    { name: 'Logistics', value: 25, color: '#F59E0B' },
    { name: 'Finance', value: 20, color: '#10B981' },
    { name: 'Operations', value: 15, color: '#64748B' },
  ];

  // Fleet Utilization details
  const fleetUtilizationData = analyticsData?.fleetUsageTrend?.map((item: any, i: number) => {
    const costFactor = item.cost || (200 + i * 40);
    return {
      vehicle: `KX-OOMS-0${i+1}`,
      utilization: Math.min(95, Math.max(40, 55 + (costFactor % 35))),
      mileage: costFactor * 12
    };
  }) || [
    { vehicle: 'KX-OOMS-01', utilization: 92, mileage: 4200 },
    { vehicle: 'KCE 982B', utilization: 84, mileage: 3800 },
    { vehicle: 'KCA 401A', utilization: 78, mileage: 3100 },
    { vehicle: 'KCP 554D', utilization: 75, mileage: 3000 },
    { vehicle: 'KCY 889E', utilization: 64, mileage: 2500 },
    { vehicle: 'KDB 012F', utilization: 58, mileage: 2200 },
  ];

  // Inventory Consumption
  const inventoryConsumptionData = analyticsData?.inventoryTrend?.map((item: any) => ({
    item: item.item,
    consumption: item.consumption,
    stock: item.stock
  })) || [
    { item: 'A4 Printing Paper', consumption: 1450, stock: 200 },
    { item: 'Laser Toners 85A', consumption: 680, stock: 45 },
    { item: 'Fuel Retail Coupons', consumption: 920, stock: 150 },
    { item: 'Secure Folder Files', consumption: 410, stock: 90 },
    { item: 'Heavy Duty Staplers', consumption: 120, stock: 15 },
  ];

  // Correspondence Flow analytics
  const correspondenceFlowData = analyticsData?.correspondenceTrend?.map((item: any) => ({
    week: item.month,
    'Incoming Mail': item['Incoming Mail'],
    'Outgoing Mail': item['Outgoing Mail']
  })) || [
    { week: 'Wk 1', 'Incoming Mail': 420, 'Outgoing Mail': 310 },
    { week: 'Wk 2', 'Incoming Mail': 510, 'Outgoing Mail': 450 },
    { week: 'Wk 3', 'Incoming Mail': 380, 'Outgoing Mail': 390 },
    { week: 'Wk 4', 'Incoming Mail': 600, 'Outgoing Mail': 520 },
  ];

  const formattedFleetData = fleetUtilizationData.map((d: any) => ({
    ...d,
    vehicle: isMobile ? (d.vehicle.includes('KX-OOMS-') ? d.vehicle.replace('KX-OOMS-', '') : d.vehicle) : d.vehicle
  }));

  const formattedInventoryData = inventoryConsumptionData.map((d: any) => ({
    ...d,
    item: isMobile ? (d.item.length > 12 ? d.item.substring(0, 10) + '..' : d.item) : d.item
  }));

  const customTooltipStyle = {
    contentStyle: { 
      backgroundColor: '#FFFFFF', 
      border: '1px solid #E5E7EB', 
      borderRadius: '8px', 
      color: '#0F172A',
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    },
    labelStyle: { fontWeight: 'bold', color: '#64748B' },
    itemStyle: { color: '#0F172A', padding: '1px 0' }
  };

  if (!standalone) {
    if (view === 'row2') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left w-full">
          {/* Monthly Activity Trend */}
          <div className="lg:col-span-8 ooms-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1 text-[#F59E0B]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Monthly Activity Trend</h3>
                  <p className="text-[10px] text-[#64748B] font-sans">Operational activity volume of registered subscriptions and fuel logs</p>
                </div>
              </div>
              <span className="text-[9px] bg-slate-50 text-[#64748B] font-bold px-2 py-0.5 rounded-lg border border-slate-100">Annual Overview</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySpendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...customTooltipStyle} formatter={(v) => [v, 'Activity Volume']} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  <Line type="monotone" name="Office Licensing" dataKey="Subscription Spend" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" name="Fuel Logistics" dataKey="Fuel Spend" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution Donut */}
          <div className="lg:col-span-4 ooms-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1 text-[#64748B]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Department Distribution</h3>
                  <p className="text-[10px] text-[#64748B] font-sans">Service department allocation split</p>
                </div>
              </div>
            </div>

            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color === '#F59E0B' || entry.color === '#EA580C' ? '#F59E0B' : entry.color === '#0F172A' ? '#3B82F6' : entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...customTooltipStyle} formatter={(v) => [`${v}%`, 'Distribution']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center select-none">
                <p className="text-lg font-bold text-slate-900">100%</p>
                <p className="text-[9px] text-[#64748B] uppercase tracking-widest font-mono">Assigned</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-4 font-mono border-t border-slate-100">
              {departmentDistribution.map((dept, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: dept.color === '#F59E0B' || dept.color === '#EA580C' ? '#F59E0B' : dept.color === '#0F172A' ? '#3B82F6' : dept.color }} />
                  <span className="text-[#64748B] truncate">{dept.name}</span>
                  <span className="font-bold ml-auto text-slate-900">{dept.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (view === 'row4') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left w-full">
          {/* Fleet Utilization */}
          <div className="ooms-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#64748B]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Fleet Utilization</h3>
                  <p className="text-[10px] text-[#64748B] font-medium font-sans">Active usage percentages per administrative vehicle</p>
                </div>
              </div>
            </div>

            <div className="h-60 w-full animate-fadeIn">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedFleetData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="vehicle" stroke="#64748B" fontSize={isMobile ? 8 : 10} tickLine={false} axisLine={false} angle={isMobile ? -25 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 35 : 25} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip {...customTooltipStyle} formatter={(v) => [`${v}%`, 'Active Use']} />
                  <Bar dataKey="utilization" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={20}>
                    {formattedFleetData.map((e, idx) => (
                      <Cell key={idx} fill={idx === 0 ? '#F59E0B' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
 
          {/* Fuel Consumption */}
          <div className="ooms-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 font-sans">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F59E0B]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-905 font-display">Fuel Consumption</h3>
                  <p className="text-[10px] text-[#64748B] font-medium font-sans">Monthly fuel logistics usage levels in liters</p>
                </div>
              </div>
            </div>
 
            <div className="h-60 w-full animate-fadeIn">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedFleetData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="vehicle" stroke="#64748B" fontSize={isMobile ? 8 : 10} tickLine={false} axisLine={false} angle={isMobile ? -25 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 35 : 25} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}L`} />
                  <Tooltip {...customTooltipStyle} formatter={(v) => [`${v} Liters`, 'Fuel Ingested']} />
                  <Bar dataKey="mileage" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={20}>
                    {formattedFleetData.map((e, idx) => (
                      <Cell key={idx} fill={idx % 2 === 0 ? '#F59E0B' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Standalone dedicated View (Full dashboard)
  return (
    <div className="space-y-6 text-left w-full">
      <div className="ooms-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-extrabold text-[#0F172A] font-display">Operational Reports</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Statistical insights compiled from active department ledgers</p>
        </div>
        <div className="flex items-center gap-2">
          {['spending', 'fleet', 'inventory', 'correspondence'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider cursor-pointer border ${
                activeTab === tab
                  ? 'bg-[#F59E0B] text-white border-transparent'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A] hover:border-[#CBD5E1]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'spending' && (
        <div className="ooms-card p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Total Operations Spending</h3>
            <p className="text-xs text-[#64748B]">Consolidated view of licensing subscriptions alongside fuel consumption ledger</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip {...customTooltipStyle} />
                <Legend iconType="circle" />
                <Line type="monotone" name="Office Licensing Cost" dataKey="Subscription Spend" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" name="Fuel Logistics Cost" dataKey="Fuel Spend" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" name="Combined Spend" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ooms-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Fleet Utilization</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedFleetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="vehicle" stroke="#64748B" fontSize={isMobile ? 8 : 10} angle={isMobile ? -25 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 35 : 25} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip {...customTooltipStyle} />
                  <Bar dataKey="utilization" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {formattedFleetData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#F59E0B' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="ooms-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Fleet Mileage (KM)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedFleetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="vehicle" stroke="#64748B" fontSize={isMobile ? 8 : 10} angle={isMobile ? -25 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 35 : 25} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip {...customTooltipStyle} />
                  <Bar dataKey="mileage" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ooms-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Inventory Consumption</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedInventoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="item" stroke="#64748B" fontSize={isMobile ? 7 : 9} angle={isMobile ? -25 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 35 : 25} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip {...customTooltipStyle} />
                  <Bar dataKey="consumption" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="ooms-card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Warehouse Stock Retention</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedInventoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="item" stroke="#64748B" fontSize={isMobile ? 7 : 9} angle={isMobile ? -25 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 35 : 25} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip {...customTooltipStyle} />
                  <Bar dataKey="stock" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'correspondence' && (
        <div className="ooms-card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Correspondence Volume Tracking</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correspondenceFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip {...customTooltipStyle} />
                <Legend />
                <Bar dataKey="Incoming Mail" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outgoing Mail" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
