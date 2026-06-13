import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Download,
  Building2,
  MapPin,
  RefreshCw,
  Mail,
  Calendar,
  Package,
  Fuel,
  Printer,
  FileText
} from 'lucide-react';
import { OOMSModule } from '../types';
import { API_URL } from '../lib/api';

interface RecordBrowserModalProps {
  initialModule: string;
  onClose: () => void;
  globalDept: string;
  globalLoc: string;
}

export default function RecordBrowserModal({ 
  initialModule, 
  onClose,
  globalDept,
  globalLoc 
}: RecordBrowserModalProps) {
  const [activeModule, setActiveModule] = useState<string>(initialModule);
  const [records, setRecords] = useState<any[]>([]);
  
  // S-S Pagination States
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  
  // Search & Metadata filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>(globalDept);
  const [selectedLoc, setSelectedLoc] = useState<string>(globalLoc);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Sort parameters
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Trigger S-S Retrieval whenever params update
  useEffect(() => {
    async function fetchList() {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          module: activeModule,
          page: page.toString(),
          limit: limit.toString(),
          search: searchTerm,
          department: selectedDept,
          location: selectedLoc,
          status: selectedStatus,
          sortBy,
          sortOrder
        });

        const token = localStorage.getItem('ooms_token');
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/api/list?${query.toString()}`, { headers });
        const result = await res.json();
        
        setRecords(result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotalRecords(result.total || 0);

        // Clamping current page to limits
        if (result.page > result.totalPages && result.totalPages > 0) {
          setPage(result.totalPages);
        }
      } catch (err) {
        console.error("Ops browser query failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchList();
    }, 250); // Debounce typing searches

    return () => clearTimeout(timer);
  }, [activeModule, page, limit, searchTerm, selectedDept, selectedLoc, selectedStatus, sortBy, sortOrder]);

  // Reset page whenever we switch core modules
  const handleModuleSwitch = (mod: string) => {
    setActiveModule(mod);
    setPage(1);
    setSearchTerm('');
    setSelectedStatus('');
    setSortBy('');
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderModuleTabs = () => {
    const segments = ['Correspondence', 'Subscriptions', 'Inventory', 'Fuel', 'Printer', 'Documents'];
    return (
      <div className="flex border-b border-slate-200 overflow-x-auto select-none mt-2">
        {segments.map((s) => {
          const isActive = activeModule === s;
          return (
            <button
              id={`browser-tab-${s.toLowerCase()}`}
              key={s}
              onClick={() => handleModuleSwitch(s)}
              className={`py-3.5 px-5 font-bold font-sans text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                isActive 
                  ? 'border-[#EA580C] text-[#EA580C] font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200 font-semibold'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    );
  };

  // Render Table content based on active OOMS segment
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#F59E0B] animate-spin" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Loading {totalRecords > 0 ? 'Page...' : 'Operational Database Slices...'}
          </span>
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="py-20 text-center text-slate-400">
          <p className="font-semibold text-sm text-slate-700">Zero database entries found</p>
          <p className="text-xs mt-1">Refine your query filters or log some operational actions</p>
        </div>
      );
    }

    const cellStyle = "py-3 px-4 text-xs font-medium text-slate-700";
    const headStyle = "py-3 px-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-left bg-[#F8FAFC] border-y border-slate-250 select-none cursor-pointer hover:bg-slate-100 transition-colors";

    switch (activeModule) {
      case "Correspondence":
        return (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th id="cor-th-id" onClick={() => toggleSort('id')} className={headStyle}>Correspondence ID <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="cor-th-trk" onClick={() => toggleSort('trackingNumber')} className={headStyle}>Tracking Number <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="cor-th-subject" onClick={() => toggleSort('subject')} className={headStyle}>Subject <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="cor-th-sender" onClick={() => toggleSort('sender')} className={headStyle}>Sender <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="cor-th-status" onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="cor-th-department" onClick={() => toggleSort('department')} className={headStyle}>Department <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((item) => (
                <tr id={`row-${item.id}`} key={item.id} className="ooms-table-row hover:bg-[rgba(245,158,11,0.06)] transition-all duration-150">
                  <td className={`${cellStyle} font-mono font-bold text-slate-500`}>{item.id}</td>
                  <td className={`${cellStyle} font-mono text-slate-600 font-semibold`}>{item.trackingNumber}</td>
                  <td className={`${cellStyle} font-semibold text-slate-800 max-w-sm truncate`}>{item.subject}</td>
                  <td className={cellStyle}>{item.sender}</td>
                  <td className={cellStyle}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none ${
                      item.status === 'Delivered' ? 'text-emerald-700 bg-emerald-50' : 
                      item.status === 'Processing' ? 'text-amber-800 bg-amber-50 border border-amber-205' : 
                      item.status === 'Returned' ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={cellStyle}>{item.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "Subscriptions":
        return (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th id="sub-th-id" onClick={() => toggleSort('id')} className={headStyle}>Sub ID <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="sub-th-srv" onClick={() => toggleSort('serviceName')} className={headStyle}>Service License <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="sub-th-cost" onClick={() => toggleSort('cost')} className={headStyle}>Pricing Cost <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="sub-th-cycle" onClick={() => toggleSort('billingCycle')} className={headStyle}>Billing <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="sub-th-status" onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="sub-th-dueDate" onClick={() => toggleSort('dueDate')} className={headStyle}>Expirations <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="sub-th-owner" onClick={() => toggleSort('owner')} className={headStyle}>Owner <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((item) => (
                <tr id={`row-${item.id}`} key={item.id} className="ooms-table-row hover:bg-[rgba(245,158,11,0.06)] transition-all duration-150">
                  <td className={`${cellStyle} font-mono font-bold text-slate-500`}>{item.id}</td>
                  <td className={`${cellStyle} font-bold text-slate-800`}>{item.serviceName}</td>
                  <td className={`${cellStyle} font-mono font-bold text-slate-900`}>${item.cost.toFixed(2)}</td>
                  <td className={`${cellStyle} uppercase text-[10px] text-slate-500 font-bold`}>{item.billingCycle}</td>
                  <td className={cellStyle}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.status === 'Active' ? 'text-emerald-700 bg-emerald-50' : 
                      item.status === 'Expiring' ? 'text-amber-700 bg-amber-50' : 
                      item.status === 'Expired' ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={`${cellStyle} font-mono font-semibold`}>{item.dueDate}</td>
                  <td className={cellStyle}>{item.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "Inventory":
        return (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th id="inv-th-id" onClick={() => toggleSort('id')} className={headStyle}>ID <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="inv-th-item" onClick={() => toggleSort('itemName')} className={headStyle}>Hardware / Supplies <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="inv-th-sku" onClick={() => toggleSort('sku')} className={headStyle}>SKU Number <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="inv-th-stock" onClick={() => toggleSort('stock')} className={headStyle}>In Stock <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="inv-th-status" onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="inv-th-location" onClick={() => toggleSort('location')} className={headStyle}>Location <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((item) => (
                <tr id={`row-${item.id}`} key={item.id} className="ooms-table-row hover:bg-[rgba(245,158,11,0.06)] transition-all duration-150">
                  <td className={`${cellStyle} font-mono font-bold text-slate-500`}>{item.id}</td>
                  <td className={`${cellStyle} font-semibold text-slate-800`}>{item.itemName}</td>
                  <td className={`${cellStyle} font-mono text-slate-500`}>{item.sku}</td>
                  <td className={`${cellStyle} font-mono font-bold text-slate-800`}>{item.stock} {item.unit}</td>
                  <td className={cellStyle}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.status === 'In Stock' ? 'text-emerald-700 bg-emerald-50' : 
                      item.status === 'Low Stock' ? 'text-amber-700 bg-amber-50 animate-pulse' : 
                      item.status === 'Out of Stock' ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={cellStyle}>{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "Fuel":
        return (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th id="fuel-th-id" onClick={() => toggleSort('id')} className={headStyle}>Log ID <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="fuel-th-plate" onClick={() => toggleSort('vehiclePlate')} className={headStyle}>Plate <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="fuel-th-type" onClick={() => toggleSort('vehicleType')} className={headStyle}>Vehicle Type <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="fuel-th-liters" onClick={() => toggleSort('liters')} className={headStyle}>Liters <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="fuel-th-cost" onClick={() => toggleSort('totalCost')} className={headStyle}>Receipt Price <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="fuel-th-driver" onClick={() => toggleSort('driver')} className={headStyle}>Driver <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="fuel-th-vendor" onClick={() => toggleSort('vendor')} className={headStyle}>Retail Vendor <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((item) => (
                <tr id={`row-${item.id}`} key={item.id} className="ooms-table-row hover:bg-[rgba(245,158,11,0.06)] transition-all duration-150">
                  <td className={`${cellStyle} font-mono font-bold text-slate-500`}>{item.id}</td>
                  <td className={`${cellStyle} font-mono font-bold text-slate-800`}>{item.vehiclePlate}</td>
                  <td className={cellStyle}>{item.vehicleType}</td>
                  <td className={`${cellStyle} font-mono`}>{item.liters}L</td>
                  <td className={`${cellStyle} font-mono font-bold text-slate-900`}>${item.totalCost.toFixed(2)}</td>
                  <td className={`${cellStyle} font-semibold text-slate-700`}>{item.driver}</td>
                  <td className={cellStyle}>{item.vendor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "Printer":
        return (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th id="prn-th-id" onClick={() => toggleSort('id')} className={headStyle}>ID <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="prn-th-name" onClick={() => toggleSort('printerName')} className={headStyle}>Printer <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="prn-th-model" onClick={() => toggleSort('model')} className={headStyle}>Model <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="prn-th-dep" onClick={() => toggleSort('department')} className={headStyle}>Dept <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="prn-th-ip" onClick={() => toggleSort('ipAddress')} className={headStyle}>IP Config <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="prn-th-toner" onClick={() => toggleSort('tonerLevel')} className={headStyle}>Toner <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="prn-th-status" onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((item) => (
                <tr id={`row-${item.id}`} key={item.id} className="ooms-table-row hover:bg-[rgba(245,158,11,0.06)] transition-all duration-150">
                  <td className={`${cellStyle} font-mono font-bold text-slate-500`}>{item.id}</td>
                  <td className={`${cellStyle} font-bold text-slate-800`}>{item.printerName}</td>
                  <td className={cellStyle}>{item.model}</td>
                  <td className={cellStyle}>{item.department}</td>
                  <td className={`${cellStyle} font-mono text-slate-500`}>{item.ipAddress}</td>
                  <td className={`${cellStyle} font-mono font-bold text-slate-850`}>{item.tonerLevel}%</td>
                  <td className={cellStyle}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.status === 'Online' ? 'text-emerald-700 bg-emerald-50' : 
                      item.status === 'Low Toner' ? 'text-amber-700 bg-amber-50' : 
                      item.status === 'Offline' ? 'text-red-700 bg-red-50' : 'text-rose-700 bg-rose-50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "Documents":
        return (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th id="doc-th-id" onClick={() => toggleSort('id')} className={headStyle}>ID <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="doc-th-name" onClick={() => toggleSort('fileName')} className={headStyle}>File Name <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="doc-th-weight" onClick={() => toggleSort('sizeKb')} className={headStyle}>Weight <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="doc-th-category" onClick={() => toggleSort('category')} className={headStyle}>Category <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="doc-th-class" onClick={() => toggleSort('classification')} className={headStyle}>Classification <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="doc-th-status" onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
                <th id="doc-th-uploader" onClick={() => toggleSort('uploadedBy')} className={headStyle}>Staff <ArrowUpDown className="w-3 h-3 inline ml-1" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((item) => (
                <tr id={`row-${item.id}`} key={item.id} className="ooms-table-row hover:bg-[rgba(245,158,11,0.06)] transition-all duration-150">
                  <td className={`${cellStyle} font-mono font-bold text-slate-500`}>{item.id}</td>
                  <td className={`${cellStyle} font-semibold text-slate-800 break-all max-w-[200px] truncate`}>{item.fileName}</td>
                  <td className={`${cellStyle} font-mono`}>{(item.sizeKb/1024).toFixed(1)} MB</td>
                  <td className={cellStyle}>{item.category}</td>
                  <td className={cellStyle}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.2 rounded border ${
                      item.classification === 'Restricted' ? 'text-rose-700 bg-rose-50 border-rose-155 font-extrabold' : 
                      item.classification === 'Internal' ? 'text-amber-700 bg-amber-50 border-amber-155' : 'text-slate-650 bg-slate-50'
                    }`}>
                      {item.classification}
                    </span>
                  </td>
                  <td className={cellStyle}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border ${
                      item.status === 'Approved' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                      item.status === 'Pending Review' ? 'text-amber-805 bg-amber-50 border-amber-200' : 
                      item.status === 'Flagged' ? 'text-red-750 bg-red-50 border-red-200' : 'text-slate-650 bg-slate-50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={cellStyle}>{item.uploadedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-35 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-3xl w-full h-full sm:h-[90vh] max-w-6xl shadow-2xl border border-slate-220 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 select-none bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-[#EA580C] rounded-xl border border-amber-100">
              {activeModule === "Correspondence" && <Mail className="w-5 h-5"/>}
              {activeModule === "Subscriptions" && <Calendar className="w-5 h-5"/>}
              {activeModule === "Inventory" && <Package className="w-5 h-5"/>}
              {activeModule === "Fuel" && <Fuel className="w-5 h-5"/>}
              {activeModule === "Printer" && <Printer className="w-5 h-5"/>}
              {activeModule === "Documents" && <FileText className="w-5 h-5"/>}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-display text-slate-900">
                OOMS Registry Segment Inspector
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium leading-none mt-1">
                Auditing <strong className="text-slate-800">{totalRecords.toLocaleString()}</strong> active records in workspace database
              </p>
            </div>
          </div>
          
          <button
            id="browser-close-btn"
            onClick={onClose}
            className="p-1 px-2.5 text-slate-400 hover:text-slate-705 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Category Tabs */}
        {renderModuleTabs()}

        {/* Sub filter control panel */}
        <div className="p-3 sm:p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                id="modal-search-field"
                type="text"
                placeholder="Search across columns..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // reset page on search filter change
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-sans focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-hidden"
              />
            </div>

            {/* Department selector */}
            <div className="relative">
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
              <select
                id="modal-dept-selector"
                aria-label="Filter browser department"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-6 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-slate-650 appearance-none cursor-pointer outline-hidden focus:border-[#EA580C]"
              >
                <option value="">Department: All</option>
                <option value="IT Support">IT Support</option>
                <option value="Finance">Finance</option>
                <option value="Logistics">Logistics</option>
                <option value="Operations">Operations</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            {/* Status specific filtering */}
            <select
              id="modal-status-selector"
              aria-label="Filter browser status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-slate-650 cursor-pointer outline-hidden focus:border-[#EA580C]"
            >
              <option value="">Status: All</option>
              {activeModule === "Correspondence" && (
                <>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                </>
              )}
              {activeModule === "Subscriptions" && (
                <>
                  <option value="active">Active</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                </>
              )}
              {activeModule === "Inventory" && (
                <>
                  <option value="in stock">In Stock</option>
                  <option value="low stock">Low Stock</option>
                  <option value="out of stock">Out of Stock</option>
                </>
              )}
              {activeModule === "Documents" && (
                <>
                  <option value="approved">Approved</option>
                  <option value="pending review">Pending Review</option>
                  <option value="flagged">Flagged</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>Limit:</span>
            <select
              id="modal-limit-selector"
              aria-label="Change rows per page"
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-[#E5E7EB] py-1.5 px-2 rounded-xl text-xs font-semibold py-1 focus:border-[#EA580C] cursor-pointer text-slate-700 outline-hidden"
            >
              <option value={15}>15 rows</option>
              <option value={30}>30 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>
        </div>

        {/* Scrollable Database table center */}
        <div className="flex-grow overflow-auto">
          {renderTableContent()}
        </div>

        {/* S-S Pagination Controllers */}
        <div className="p-4 border-t border-slate-200 bg-white font-medium text-xs text-slate-500 flex items-center justify-between select-none">
          <span>
            Displaying lines <strong className="text-slate-800">{(page - 1) * limit + 1}</strong> to <strong className="text-slate-800">{Math.min(page * limit, totalRecords)}</strong> of <strong className="text-slate-800">{totalRecords.toLocaleString()}</strong> rows
          </span>

          <div className="flex items-center gap-2">
            <button
              id="pagination-prev-btn"
              aria-label="Previous page"
              disabled={page === 1 || isLoading}
              onClick={() => setPage(page - 1)}
              className="p-1 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 inline" /> Prev
            </button>
            <span className="font-semibold text-slate-850">
              Page {page} of {totalPages}
            </span>
            <button
              id="pagination-next-btn"
              aria-label="Next page"
              disabled={page === totalPages || isLoading}
              onClick={() => setPage(page + 1)}
              className="p-1 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
