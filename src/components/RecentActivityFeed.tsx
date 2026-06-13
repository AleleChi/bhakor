import React, { useState } from 'react';
import { 
  History, 
  User, 
  SlidersHorizontal,
  Mail,
  Calendar,
  Package,
  Fuel,
  Printer,
  FileText,
  Activity
} from 'lucide-react';
import { ActivityLog, OOMSModule } from '../types';

interface RecentActivityFeedProps {
  activities: ActivityLog[];
  isLoading: boolean;
}

export default function RecentActivityFeed({ activities, isLoading }: RecentActivityFeedProps) {
  const [selectedFeedModule, setSelectedFeedModule] = useState<string>('');
  const [searchUser, setSearchUser] = useState<string>('');

  const renderTimelineIcon = (mod: OOMSModule) => {
    const props = { className: "w-3.5 h-3.5 text-slate-500" };
    switch (mod) {
      case "Correspondence": return <Mail {...props} />;
      case "Subscriptions": return <Calendar {...props} />;
      case "Inventory": return <Package {...props} />;
      case "Fuel": return <Fuel {...props} />;
      case "Printer": return <Printer {...props} />;
      case "Documents": return <FileText {...props} />;
      default: return <Activity {...props} />;
    }
  };

  const getTimelineBorderColor = (mod: OOMSModule) => {
    switch (mod) {
      case "Correspondence": return "bg-[#F59E0B]";
      case "Subscriptions": return "bg-emerald-500";
      case "Inventory": return "bg-amber-600";
      case "Fuel": return "bg-slate-900";
      case "Printer": return "bg-slate-400";
      case "Documents": return "bg-stone-550";
      default: return "bg-amber-500";
    }
  };

  const defaultTimelineActivities = [
    { id: '1', user: 'Alex Rivera (Abuja)', action: 'Logistics: Assigned vehicle KX-OOMS-01 to Fleet Logistics Sector 4.', module: 'Fuel' as const, timestamp: '10 Mins Ago' },
    { id: '2', user: 'Musa Bello', action: 'Mail Received: Sector B incoming policy proposal letter tracked.', module: 'Correspondence' as const, timestamp: '1 Hr Ago' },
    { id: '3', user: 'Emeka Okafor', action: 'Subscription Renewed: Cloud storage ledger license active state restored.', module: 'Subscriptions' as const, timestamp: '3 Hrs Ago' },
    { id: '4', user: 'Chioma Nwachukwu', action: 'Document Uploaded: National Operations manual added to Vault.', module: 'Documents' as const, timestamp: 'Yesterday' }
  ];

  const targetActivities = activities && activities.length > 0 ? activities : defaultTimelineActivities;

  const filteredFeed = targetActivities.filter(act => {
    if (selectedFeedModule && act.module !== selectedFeedModule) return false;
    if (searchUser && !act.user.toLowerCase().includes(searchUser.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-2xs flex flex-col gap-4 animate-pulse">
        <div className="w-32 h-6 bg-slate-100 rounded-md" />
        <div className="w-full h-8 bg-slate-50 rounded-xl" />
        <div className="space-y-4 pt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="w-2/3 h-4 bg-slate-100 rounded-md" />
                <div className="w-1/3 h-3 bg-slate-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xs flex flex-col h-full text-slate-800">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#64748B]" />
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
              Recent Activity Feed
            </h2>
            <p className="text-[10px] text-[#64748B] font-medium font-sans">
              Chronological operational logs computed in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Mini Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 bg-slate-50 p-2 border border-slate-100 rounded-xl">
        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            id="activity-user-search"
            type="text"
            placeholder="Filter User..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 text-xs rounded-xl shadow-2xs focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] font-semibold text-slate-800 outline-hidden"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <select
            id="activity-module-filter"
            aria-label="Filter activity category"
            value={selectedFeedModule}
            onChange={(e) => setSelectedFeedModule(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 text-xs rounded-xl shadow-2xs focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] font-semibold text-slate-800 appearance-none cursor-pointer outline-hidden"
          >
            <option value="">All Segments</option>
            <option value="Correspondence">Correspondence</option>
            <option value="Subscriptions">Subscriptions</option>
            <option value="Inventory">Inventory</option>
            <option value="Fuel">Fuel</option>
            <option value="Printer">Printer</option>
            <option value="Documents">Documents</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-500 w-0 h-0" />
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-grow overflow-y-auto max-h-[380px] pr-1">
        {filteredFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center select-none text-slate-400">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2.5">
              <History className="w-4 h-4 text-slate-400 animate-pulse" />
            </div>
            <p className="font-extrabold text-xs text-slate-705 uppercase tracking-wider">No logs match criteria</p>
            <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">Try widening search scopes or active filters.</p>
          </div>
        ) : (
          <div className="relative border-l border-slate-100 pl-4 space-y-4 py-1">
            {filteredFeed.map((activity) => (
              <div id={`activity-feed-item-${activity.id}`} key={activity.id} className="relative group">
                {/* Timeline ball marker */}
                <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ring-slate-100 group-hover:scale-125 transition-transform ${getTimelineBorderColor(activity.module)}`} />

                <div className="flex flex-col">
                  {/* Actor details line */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-slate-800">
                      {activity.user}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono tracking-tight font-medium">
                      {activity.timestamp}
                    </span>
                  </div>

                  {/* Log description card */}
                  <div className="bg-slate-50/50 hover:bg-[#FFF7ED]/30 group-hover:border-amber-200 border border-slate-100 rounded-xl p-2.5 flex items-start gap-2.5 transition-all">
                    <div className="mt-0.5 p-1 bg-white rounded-lg border border-slate-105 shrink-0 select-none">
                      {renderTimelineIcon(activity.module)}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <p className="text-[11px] text-slate-700 font-medium break-words leading-tight">
                        {activity.action}
                      </p>
                      <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wide mt-1">
                        {activity.module} Log
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 text-center text-[10px] text-[#64748B] font-bold uppercase tracking-wider border-t border-slate-100 mt-3 select-none font-mono">
        In-Memory Auditing Active
      </div>
    </div>
  );
}
