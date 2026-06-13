import React from 'react';
import { Filter, Calendar, MapPin, Building2, RefreshCw } from 'lucide-react';

interface GlobalFiltersProps {
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedLoc: string;
  setSelectedLoc: (loc: string) => void;
  selectedRange: string;
  setSelectedRange: (range: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DEPARTMENTS = [
  'Logistics', 
  'Finance', 
  'Human Resources', 
  'Operations', 
  'Executive Office', 
  'Legal', 
  'IT Support', 
  'Procurement'
];

export const LOCATIONS = [
  'North Wing', 
  'South Wing', 
  'HQ Seventh Floor', 
  'Warehouse A', 
  'Fleet Depot', 
  'Annex Building', 
  'Main Reception'
];

export default function GlobalFilters({
  selectedDept,
  setSelectedDept,
  selectedLoc,
  setSelectedLoc,
  selectedRange,
  setSelectedRange,
  onRefresh,
  isRefreshing
}: GlobalFiltersProps) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[16px] shadow-2xs flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 text-left">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-left">
        <div className="flex items-center text-[#64748B] text-xs font-bold uppercase tracking-wider mr-2 gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        {/* Department Selection */}
        <div className="relative flex-1 sm:flex-initial">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            id="dept-filter"
            aria-label="Department filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-48 pl-9 pr-8 py-2 bg-stone-50/50 border border-[#E5E7EB] rounded-[12px] text-xs text-[#0F172A] font-bold focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:bg-white transition-all appearance-none cursor-pointer outline-hidden hover:bg-[rgba(245,158,11,0.06)]"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-500 w-0 h-0" />
        </div>

        {/* Location Selection */}
        <div className="relative flex-1 sm:flex-initial text-left">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            id="loc-filter"
            aria-label="Location filter"
            value={selectedLoc}
            onChange={(e) => setSelectedLoc(e.target.value)}
            className="w-full sm:w-48 pl-9 pr-8 py-2 bg-stone-50/50 border border-[#E5E7EB] rounded-[12px] text-xs text-[#0F172A] font-bold focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:bg-white transition-all appearance-none cursor-pointer outline-hidden hover:bg-[rgba(245,158,11,0.06)]"
          >
            <option value="">All Regional Locations</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-500 w-0 h-0" />
        </div>

        {/* Date range Selection */}
        <div className="relative flex-1 sm:flex-initial text-left">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            id="range-filter"
            aria-label="Date range filter"
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="w-full sm:w-44 pl-9 pr-8 py-2 bg-stone-50/50 border border-[#E5E7EB] rounded-[12px] text-xs text-[#0F172A] font-bold focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:bg-white transition-all appearance-none cursor-pointer outline-hidden hover:bg-[rgba(245,158,11,0.06)]"
          >
            <option value="all">Full Log History</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-500 w-0 h-0" />
        </div>

        {/* Clear Filter Indicator */}
        {(selectedDept || selectedLoc || selectedRange !== 'all') && (
          <button
            id="clear-filters-btn"
            onClick={() => {
              setSelectedDept('');
              setSelectedLoc('');
              setSelectedRange('all');
            }}
            className="text-[11px] text-[#0F172A] hover:bg-[rgba(245,158,11,0.12)] hover:text-[#F59E0B] font-bold px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-[10px] cursor-pointer transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      <button
        id="refresh-btn"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 border border-transparent hover:bg-[rgba(245,158,11,0.12)] hover:text-[#0F172A] hover:border-[#F59E0B] text-white text-xs font-semibold uppercase tracking-wider py-2  px-4 rounded-[10px] transition-all disabled:opacity-50 cursor-pointer outline-hidden"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#F59E0B]' : 'text-[#64748B]'}`} />
        <span>{isRefreshing ? 'Syncing...' : 'Sync Logs'}</span>
      </button>
    </div>
  );
}
