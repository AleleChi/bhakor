import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  RefreshCw, 
  Plus, 
  MapPin, 
  Building2, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Eye,
  Share2,
  History,
  CheckCircle,
  FileText,
  Trash2,
  UserCheck,
  MoreHorizontal,
  Folder,
  Clock,
  Shield,
  HelpCircle,
  FileCode,
  Tag,
  Briefcase,
  Sliders,
  DollarSign,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Settings,
  Mail,
  Truck,
  Printer,
  File,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { OOMSModule } from '../types';

interface EmbeddedRegistryViewProps {
  moduleName: string; // 'Correspondence' | 'Subscriptions' | 'Inventory' | 'Fuel' | 'Printer' | 'Documents' | 'AuditLogs'
  globalDept?: string;
  globalLoc?: string;
  onTriggerQuickAdd: (mod: OOMSModule) => void;
}

export default function EmbeddedRegistryView({ 
  moduleName, 
  globalDept = '', 
  globalLoc = '',
  onTriggerQuickAdd
}: EmbeddedRegistryViewProps) {
  
  // Maps standard navigation sections to exact backend model tokens
  const activeModule = moduleName === 'Fleet' ? 'Fuel' : moduleName === 'Printers' ? 'Printer' : moduleName;
  
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>(globalDept);
  const [selectedLoc, setSelectedLoc] = useState<string>(globalLoc);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Enterprise Workspace subTab selection per module
  const [activeSubTab, setActiveSubTab] = useState<string>('all');

  // Selected Record details drawer state
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'activity' | 'versions' | 'approvals'>('overview');

  // Dual layout / Split Document Preview state
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);
  const [documentZoom, setDocumentZoom] = useState<number>(100);

  // Custom reusable deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ moduleName: string; id: string; label?: string } | null>(null);

  const confirmDeleteRecord = (modName: string, id: string, label: string) => {
    setDeleteCandidate({ moduleName: modName, id, label });
    setDeleteModalOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!deleteCandidate) return;
    const { moduleName: modName, id } = deleteCandidate;
    setDeleteModalOpen(false);
    setDeleteCandidate(null);

    const token = localStorage.getItem('ooms_token');
    try {
      const res = await fetch('/api/registry/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ moduleName: modName, id })
      });

      if (res.ok) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        let displayedMsg = `${modName} record deleted successfully`;
        if (modName === 'Correspondence') displayedMsg = "Correspondence record deleted successfully";
        else if (modName === 'Inventory') displayedMsg = "Inventory item deleted successfully";
        else if (modName === 'Printer') displayedMsg = "Printer profile deleted successfully";
        else if (modName === 'Subscriptions') displayedMsg = "Subscription deleted successfully";
        else if (modName === 'Fuel') displayedMsg = "Vehicle fuel consumption record deleted successfully";
        else if (modName === 'Documents') displayedMsg = "Document record deleted successfully";

        toast.success(displayedMsg, {
          style: {
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            color: '#0F172A',
          }
        });
        
        // Close drawer if deleted record was highlighted
        if (selectedRecord && selectedRecord.id === id) {
          setIsDrawerOpen(false);
        }
      } else {
        const payloadErr = await res.json().catch(() => ({}));
        throw new Error(payloadErr.message || "Failed to delete from OOMS registry.");
      }
    } catch (err: any) {
      toast.error(err.message || `Unable to delete record`, {
        style: {
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          color: '#EF4444',
        }
      });
    }
  };

  // Reset page and subTab on activeModule change
  useEffect(() => {
    setPage(1);
    setActiveSubTab('all');
    setSelectedRecord(null);
    setIsDrawerOpen(false);
  }, [activeModule]);

  // Adjust filters when subTab shifts
  useEffect(() => {
    setPage(1);
    setIsDrawerOpen(false);
  }, [activeSubTab]);

  useEffect(() => {
    setPage(1);
  }, [selectedDept, selectedLoc, selectedStatus, searchTerm]);

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

        const res = await fetch(`/api/list?${query.toString()}`, { headers });
        const result = await res.json();
        
        setRecords(result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotalRecords(result.total || 0);

        if (result.page > result.totalPages && result.totalPages > 0) {
          setPage(result.totalPages);
        }
      } catch (err) {
        console.error("Ops registry fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchList();
    }, 200);

    return () => clearTimeout(timer);
  }, [activeModule, page, limit, searchTerm, selectedDept, selectedLoc, selectedStatus, sortBy, sortOrder]);

  // Quick helper to filter local results based on subTab indicators
  const getSubTabsForModule = (mod: string) => {
    switch (mod) {
      case 'Documents':
        return [
          { label: 'All Documents', key: 'all' },
          { label: 'Recent', key: 'recent' },
          { label: 'Pending Approval', key: 'pending' },
          { label: 'Approved', key: 'approved' },
          { label: 'Archived', key: 'archived' },
          { label: 'Shared With Me', key: 'shared' },
          { label: 'Folders', key: 'folders' }
        ];
      case 'Correspondence':
        return [
          { label: 'Inbox', key: 'inbox' },
          { label: 'Outgoing', key: 'outgoing' },
          { label: 'Pending', key: 'pending' },
          { label: 'Archived', key: 'archived' },
          { label: 'Recent', key: 'recent' }
        ];
      case 'Inventory':
        return [
          { label: 'Items', key: 'all' },
          { label: 'Low Stock', key: 'low' },
          { label: 'Procurement', key: 'procurement' },
          { label: 'Warehouses', key: 'warehouses' },
          { label: 'Movements', key: 'movements' },
          { label: 'Activity', key: 'activity' }
        ];
      case 'Fuel':
      case 'Fleet':
        return [
          { label: 'Vehicles', key: 'vehicles' },
          { label: 'Maintenance', key: 'maint' },
          { label: 'Fuel Logs', key: 'all' },
          { label: 'Incidents', key: 'incidents' },
          { label: 'Assignments', key: 'assignments' }
        ];
      case 'Subscriptions':
        return [
          { label: 'Active', key: 'active' },
          { label: 'Expiring', key: 'expiring' },
          { label: 'Expired', key: 'expired' },
          { label: 'Vendors', key: 'vendors' },
          { label: 'Renewals', key: 'renewals' }
        ];
      case 'Printer':
      case 'Printers':
        return [
          { label: 'Fleet', key: 'all' },
          { label: 'Alerts', key: 'alerts' },
          { label: 'Consumables', key: 'consumables' },
          { label: 'Usage Analytics', key: 'usage' },
          { label: 'Maintenance', key: 'maint' }
        ];
      case 'AuditLogs':
        return [
          { label: 'All Events', key: 'all' },
          { label: 'Security', key: 'security' },
          { label: 'Workflow', key: 'workflow' },
          { label: 'Documents', key: 'documents' },
          { label: 'Printers', key: 'printers' },
          { label: 'Inventory', key: 'inventory' },
          { label: 'Fleet', key: 'fleet' },
          { label: 'Users', key: 'users' }
        ];
      default:
        return [
          { label: 'All Reports', key: 'all' }
        ];
    }
  };

  // Local filtering helper for high precision sub-tab experience
  const getFilteredRecordsBySubTab = () => {
    const raw = [...records];
    if (activeSubTab === 'all') return raw;

    return raw.filter(item => {
      const status = (item.status || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      
      switch (activeSubTab) {
        case 'recent':
          // Items younger than 7 days
          if (item.createdAt) {
            const ageMs = Date.now() - new Date(item.createdAt).getTime();
            return ageMs < (7 * 24 * 60 * 60 * 1000);
          }
          return true;
        case 'pending':
          return status.includes('pending') || status.includes('review') || status.includes('draft') || status.includes('submit') || status.includes('transit');
        case 'approved':
          return status.includes('approved') || status.includes('active') || status.includes('online') || status.includes('deliver') || status.includes('publish') || status.includes('success');
        case 'archived':
          return status.includes('archiv') || status.includes('expired');
        case 'shared':
          return item.department === 'Secretariat' || item.classification === 'Internal';
        case 'folders':
          return item.category && item.category !== '';
        
        // Correspondence
        case 'inbox':
          return !status.includes('archived') && (item.trackingNumber?.startsWith('IN') || item.department === 'Secretariat');
        case 'outgoing':
          return item.trackingNumber?.startsWith('OUT') || item.sender === 'Secretariat';
        
        // Inventory
        case 'low':
          return (item.quantity && item.quantity < 15) || status.includes('low') || status.includes('out-of-stock');
        case 'procurement':
          return item.quantity < 10 || status.includes('draft');
        case 'warehouses':
          return item.location && item.location !== '';
        case 'movements':
          return true;
        
        // Fleet
        case 'vehicles':
          return item.vehiclePlate !== undefined;
        case 'maint':
          return status.includes('maintenance') || status.includes('jam') || status.includes('low');
        case 'incidents':
          return status.includes('warning') || status.includes('offline') || status.includes('out');
        case 'assignments':
          return item.driverName && item.driverName !== '';
        
        // Subscriptions
        case 'active':
          return status.includes('active') || status.includes('approved');
        case 'expiring':
          return status.includes('warning') || status.includes('expir') || status.includes('transit');
        case 'expired':
          return status.includes('expired') || status.includes('reject');
        case 'vendors':
          return item.vendor && item.vendor !== '';
        case 'renewals':
          return item.billingCycle === 'Annual';

        // Printers
        case 'alerts':
          return status !== 'online';
        case 'consumables':
          return (item.tonerLevel && item.tonerLevel < 35);
        case 'usage':
          return item.tonerLevel > 0;
        
        // Audit Center
        case 'security':
          return item.action === 'LOGIN' || item.action === 'LOGOUT' || item.action === 'DELETE';
        case 'workflow':
          return item.action === 'APPROVAL' || item.action === 'TRANSITION' || item.action === 'ASSIGNMENT' || item.action === 'UPDATE';
        case 'documents':
          return item.module === 'Documents';
        case 'printers':
          return item.module === 'Printer' || item.module === 'Printers';
        case 'inventory':
          return item.module === 'Inventory';
        case 'fleet':
          return item.module === 'Fuel';
        case 'users':
          return item.action === 'LOGIN' || item.action === 'LOGOUT';
        
        default:
          return true;
      }
    });
  };

  const currentWorkspaceItems = getFilteredRecordsBySubTab();

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status ? status.toLowerCase().replace(/[\s_]+/g, '-') : '';
    let badgeType = 'neutral';
    
    if (s === 'approved' || s === 'delivered' || s === 'active' || s === 'in-stock' || s === 'online' || s === 'success' || s === 'published') {
      badgeType = 'delivered'; // green status banner
    } else if (s === 'in-transit' || s === 'processing' || s === 'in-progress' || s === 'pending-review' || s === 'expiring' || s === 'low-stock' || s === 'low-toner' || s === 'submitted' || s === 'warning' || s === 'review' || s === 'pending') {
      badgeType = 'in-transit'; // amber status banner
    } else if (s === 'rejected' || s === 'expired' || s === 'out-of-stock' || s === 'offline' || s === 'flagged' || s === 'returned' || s === 'danger') {
      badgeType = 'rejected'; // red status banner
    } else if (s === 'draft' || s === 'archived' || s === 'in-review') {
      badgeType = 'draft'; // gray slate banner
    }
    
    return `ooms-status-badge ooms-badge-${badgeType}`;
  };

  // Re-assign service action
  const handleAssignAction = async (itemId: string, departmentName: string, label: string) => {
    const token = localStorage.getItem('ooms_token');
    try {
      const res = await fetch('/api/registry/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ moduleName: activeModule, id: itemId, departmentName })
      });
      if (res.ok) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        toast.success(`"${label}" successfully routed to ${departmentName} department.`, {
          style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#10B981' }
        });
        // Update local highlighted active drawer record
        if (selectedRecord && selectedRecord.id === itemId) {
          setSelectedRecord({ ...selectedRecord, department: departmentName });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed re-assignment");
      }
    } catch (err: any) {
      toast.error(`Routing failed: ${err.message}`, {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
    }
  };

  // Transition state action
  const handleTransitionAction = async (itemId: string, statusName: string, label: string) => {
    const token = localStorage.getItem('ooms_token');
    try {
      const res = await fetch('/api/registry/transition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ moduleName: activeModule, id: itemId, status: statusName, remarks: `Transitioned via OOMS enterprise workspace panel.` })
      });
      if (res.ok) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        toast.success(`"${label}" status successfully changed to "${statusName}".`, {
          style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#10B981' }
        });
        // Update local state record
        if (selectedRecord && selectedRecord.id === itemId) {
          setSelectedRecord({ ...selectedRecord, status: statusName });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed transition");
      }
    } catch (err: any) {
      toast.error(`Transition rejected: ${err.message}`, {
        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#EF4444' }
      });
    }
  };

  const cellStyle = "h-14 py-3 px-4 text-xs font-semibold text-[#0F172A] border-b border-[#F1F5F9] font-sans transition-colors max-w-[200px] truncate";
  const headStyle = "sticky top-0 z-10 h-12 px-4 text-[10px] font-extrabold text-white uppercase tracking-widest text-left bg-[#0F172A] border-b border-[#E5E7EB] cursor-pointer select-none hover:bg-[#1E293B] transition-colors font-sans";

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-left">
      
      {/* SECTION TABS FOR ALL MODULES (TOOLBAR SUB-NAVIGATION PANEL) */}
      <div className="flex flex-col lg:flex-row gap-6 w-full select-none items-start">
        
        {/* LEFT COMPACT SUB-NAVIGATION SIDEBAR */}
        <div className="w-full lg:w-[220px] shrink-0 bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col gap-1 shadow-2xs">
          <div className="px-3.5 pb-2.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Views Registry</span>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
          </div>
          {getSubTabsForModule(activeModule).map((tab) => {
            const isTabActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  isTabActive 
                    ? 'bg-[#FFF7ED] text-[#D97706] border-l-2 border-[#F59E0B] px-3.5' 
                    : 'text-slate-650 hover:bg-[#FFF7ED]/30 hover:text-slate-900 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {tab.key === 'all' && <Layers className="w-3.5 h-3.5 shrink-0" />}
                  {tab.key === 'pending' && <X className="w-3.5 h-3.5 shrink-0 rotate-45 text-amber-500" />}
                  {tab.key === 'approved' && <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />}
                  {tab.key === 'archived' && <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                  {tab.key === 'recent' && <History className="w-3.5 h-3.5 shrink-0" />}
                  {tab.key === 'shared' && <Share2 className="w-3.5 h-3.5 shrink-0" />}
                  {tab.key === 'folders' && <Folder className="w-3.5 h-3.5 shrink-0" />}
                  {tab.key === 'low' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                  {tab.key !== 'all' && tab.key !== 'pending' && tab.key !== 'approved' && tab.key !== 'archived' && tab.key !== 'recent' && tab.key !== 'shared' && tab.key !== 'folders' && tab.key !== 'low' && <FileText className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* MAIN WORKSPACE SECTION */}
        <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[580px]">
          
          {/* SEARCH, SORT, AND FILTER WORKSPACE TOOLBAR */}
          <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Real Search bar */}
            <div className="relative w-full md:max-w-xs font-sans">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search OOMS ${moduleName}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl py-2.5 pl-10 pr-4 bg-white border border-[#E5E7EB] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] text-[#0F172A] outline-hidden tracking-wide transition-all font-semibold shadow-2xs"
              />
            </div>

            {/* Custom filters */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              
              {/* Dept select filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-white border border-[#E5E7EB] focus:border-[#F59E0B] outline-hidden text-[#0F172A] cursor-pointer"
              >
                <option value="">All Departments</option>
                <option value="Aviation">Aviation</option>
                <option value="Works & Housing">Works & Housing</option>
                <option value="Finance">Finance</option>
                <option value="Transportation">Transportation</option>
                <option value="Health Division">Health Division</option>
                <option value="Secretariat">Secretariat</option>
              </select>

              {/* Location Selector */}
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider rounded-xl bg-white border border-[#E5E7EB] focus:border-[#F59E0B] outline-hidden text-[#0F172A] cursor-pointer"
              >
                <option value="">All Branches</option>
                <option value="Abuja Headquarters">Abuja HQ</option>
                <option value="Lagos Sub-registry">Lagos Branch</option>
                <option value="Port Harcourt Link">Port Harcourt</option>
                <option value="Kano Annex">Kano Annex</option>
              </select>

              {/* Primary action alignment: One primary action per screen */}
              <button
                onClick={() => onTriggerQuickAdd(activeModule as OOMSModule)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-transparent shadow-xs transition-all cursor-pointer font-sans"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Add Record
              </button>
            </div>

          </div>

          {/* SPLIT VIEW WORKSPACE GRID: Left Document List + Right Adaptive Document Mock Preview */}
          <div className="flex-1 flex flex-col md:flex-row relative">
            
            {/* LEFT / CENTRAL DATABASE LISTINGS */}
            <div className={`flex-1 overflow-x-auto ${activeModule === 'Documents' ? 'md:max-w-[65%]' : ''}`}>
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 select-none">
                  <RefreshCw className="w-8 h-8 text-[#FA9E05] animate-spin" />
                  <span className="text-[10px] text-[#64748B] font-extrabold uppercase tracking-widest font-mono">
                    Handshaking secure database connection...
                  </span>
                </div>
              ) : currentWorkspaceItems.length === 0 ? (
                <div className="py-24 text-center select-none text-slate-405">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">No workspace records matching filters</p>
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">Change sub-navigation tabs or search terms to refresh indexing.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    {activeModule === 'Correspondence' && (
                      <tr>
                        <th onClick={() => toggleSort('id')} className={headStyle}>ID <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('trackingNumber')} className={headStyle}>Tracking # <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('subject')} className={headStyle}>Subject <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('sender')} className={headStyle}>Sender <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('department')} className={headStyle}>Department <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th className={headStyle}>Actions</th>
                      </tr>
                    )}
                    {activeModule === 'Subscriptions' && (
                      <tr>
                        <th onClick={() => toggleSort('id')} className={headStyle}>ID <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('serviceName')} className={headStyle}>Service Name <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('cost')} className={headStyle}>Total Cost <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('department')} className={headStyle}>Assigned <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('vendor')} className={headStyle}>Vendor <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th className={headStyle}>Actions</th>
                      </tr>
                    )}
                    {activeModule === 'Inventory' && (
                      <tr>
                        <th onClick={() => toggleSort('id')} className={headStyle}>ID <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('itemName')} className={headStyle}>Item Stock <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('sku')} className={headStyle}>SKU Code <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('quantity')} className={headStyle}>Qty <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('category')} className={headStyle}>Category <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th className={headStyle}>Actions</th>
                      </tr>
                    )}
                    {activeModule === 'Fuel' && (
                      <tr>
                        <th onClick={() => toggleSort('id')} className={headStyle}>ID <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('vehiclePlate')} className={headStyle}>Plate NO <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('driverName')} className={headStyle}>Assigned Driver <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('liters')} className={headStyle}>Litres <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('cost')} className={headStyle}>Total Cost <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th className={headStyle}>Actions</th>
                      </tr>
                    )}
                    {activeModule === 'Printer' && (
                      <tr>
                        <th onClick={() => toggleSort('printerName')} className={headStyle}>Device Name <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('model')} className={headStyle}>Model <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('department')} className={headStyle}>Department <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('ipAddress')} className={headStyle}>IP Network <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('tonerLevel')} className={headStyle}>Toner <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th className={headStyle}>Status</th>
                        <th className={headStyle}>Actions</th>
                      </tr>
                    )}
                    {activeModule === 'Documents' && (
                      <tr>
                        <th onClick={() => toggleSort('fileName')} className={headStyle}>File Name <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('sizeKb')} className={headStyle}>Size <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('classification')} className={headStyle}>Clearance <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('status')} className={headStyle}>Status <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('uploadedBy')} className={headStyle}>Owner <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th className={headStyle}>Actions</th>
                      </tr>
                    )}
                    {activeModule === 'AuditLogs' && (
                      <tr>
                        <th onClick={() => toggleSort('timestamp')} className={headStyle}>Timestamp <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('action')} className={headStyle}>Action <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th onClick={() => toggleSort('module')} className={headStyle}>Module <ArrowUpDown className="w-3 h-3 inline" /></th>
                        <th className={headStyle}>Operator</th>
                        <th className={headStyle} style={{ width: '40%' }}>Audit Changes</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 select-text">
                    {currentWorkspaceItems.map((item) => {
                      const isHighlighted = selectedRecord && selectedRecord.id === item.id;
                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => {
                            setSelectedRecord(item);
                            setIsDrawerOpen(true);
                          }}
                          className={`group cursor-pointer transition-all duration-150 ${
                            isHighlighted ? 'bg-[#FFF7ED] border-l-2 border-[#F59E0B]' : 'hover:bg-[#FFF7ED]/35 hover:border-l-2 hover:border-[#F59E0B]/50'
                          }`}
                        >
                          {/* CORRESPONDENCE COLUMNS */}
                          {activeModule === 'Correspondence' && (
                            <>
                              <td className={`${cellStyle} font-mono text-[#64748B] font-bold`}>#{String(item.id).substring(0, 5)}</td>
                              <td className={`${cellStyle} font-mono text-slate-800 font-bold`}>{item.trackingNumber}</td>
                              <td className={`${cellStyle} text-slate-900 font-semibold font-sans`}>{item.subject}</td>
                              <td className={cellStyle}>{item.sender}</td>
                              <td className={cellStyle}>
                                <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                              </td>
                              <td className={cellStyle}>
                                <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-md text-slate-650 inline-block font-sans">{item.department}</span>
                              </td>
                            </>
                          )}

                          {/* SUBSCRIPTIONS COLUMNS */}
                          {activeModule === 'Subscriptions' && (
                            <>
                              <td className={`${cellStyle} font-mono text-[#64748B] font-bold`}>#{String(item.id).substring(0, 5)}</td>
                              <td className={`${cellStyle} text-slate-900 font-bold`}>{item.serviceName}</td>
                              <td className={`${cellStyle} font-mono text-emerald-700 font-extrabold`}>₦{Number(item.cost).toLocaleString()}</td>
                              <td className={cellStyle}>
                                <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                              </td>
                              <td className={cellStyle}>
                                <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-md text-slate-650 inline-block">{item.department}</span>
                              </td>
                              <td className={cellStyle}>{item.vendor}</td>
                            </>
                          )}

                          {/* INVENTORY COLUMNS */}
                          {activeModule === 'Inventory' && (
                            <>
                              <td className={`${cellStyle} font-mono text-[#64748B] font-bold`}>#{String(item.id).substring(0, 5)}</td>
                              <td className={`${cellStyle} text-slate-900 font-bold`}>{item.itemName}</td>
                              <td className={`${cellStyle} font-mono font-bold text-slate-500`}>{item.sku}</td>
                              <td className={`${cellStyle} font-mono font-bold ${item.quantity < 15 ? 'text-rose-600 font-extrabold' : 'text-slate-700'}`}>{item.quantity} units</td>
                              <td className={cellStyle}>{item.category}</td>
                              <td className={cellStyle}>
                                <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                              </td>
                            </>
                          )}

                          {/* FLEET/FUEL COLUMNS */}
                          {activeModule === 'Fuel' && (
                            <>
                              <td className={`${cellStyle} font-mono text-[#64748B] font-bold`}>#{String(item.id).substring(0, 5)}</td>
                              <td className={`${cellStyle} font-mono text-slate-800 font-bold`}>{item.vehiclePlate}</td>
                              <td className={`${cellStyle} text-slate-900 font-bold`}>{item.driverName}</td>
                              <td className={`${cellStyle} font-mono text-slate-600`}>{item.liters} L</td>
                              <td className={`${cellStyle} font-mono text-emerald-700 font-extrabold`}>₦{Number(item.cost).toLocaleString()}</td>
                              <td className={cellStyle}>
                                <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                              </td>
                            </>
                          )}

                          {/* PRINTER WORKSPACE COLUMNS */}
                          {activeModule === 'Printer' && (
                            <>
                              <td className={`${cellStyle} font-bold text-[#0F172A]`}>{item.printerName}</td>
                              <td className={cellStyle}>{item.model}</td>
                              <td className={cellStyle}>
                                <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 border border-slate-100 rounded-md text-slate-650 inline-block">{item.department}</span>
                              </td>
                              <td className={`${cellStyle} font-mono text-slate-500`}>{item.ipAddress}</td>
                              <td className={`${cellStyle} font-mono`}>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <div className="w-12 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div 
                                      className={`h-full ${item.tonerLevel < 25 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${item.tonerLevel}%` }}
                                    />
                                  </div>
                                  <span>{item.tonerLevel}%</span>
                                </div>
                              </td>
                              <td className={cellStyle}>
                                <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                              </td>
                            </>
                          )}

                          {/* DOCUMENTS COLUMNS */}
                          {activeModule === 'Documents' && (
                            <>
                              <td className={`${cellStyle} text-slate-900 font-bold`}>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[#F59E0B] shrink-0" />
                                  <span className="truncate">{item.fileName}</span>
                                </div>
                              </td>
                              <td className={`${cellStyle} font-mono text-slate-500`}>{(item.sizeKb / 1024).toFixed(1)} MB</td>
                              <td className={cellStyle}>
                                <span className={`text-[9px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                  item.classification === 'Restricted' ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-slate-650 bg-slate-100 border-slate-200'
                                }`}>
                                  {item.classification}
                                </span>
                              </td>
                              <td className={cellStyle}>
                                <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                              </td>
                              <td className={cellStyle}>{item.uploadedBy}</td>
                            </>
                          )}

                          {/* AUDITLOGS COLUMNS */}
                          {activeModule === 'AuditLogs' && (
                            <>
                              <td className={`${cellStyle} font-mono text-[9.5px] text-slate-500 whitespace-nowrap`}>
                                {new Date(item.timestamp).toLocaleString('en-US', { hour12: true })}
                              </td>
                              <td className={cellStyle}>
                                <span className={`text-[8.5px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border inline-block ${
                                  item.action === 'LOGIN' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                  item.action === 'LOGOUT' ? 'text-slate-700 bg-slate-50 border-slate-200' :
                                  item.action === 'CREATE' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                  item.action === 'UPDATE' ? 'text-amber-850 bg-amber-50 border-amber-250' :
                                  item.action === 'DELETE' ? 'text-rose-700 bg-rose-50 border-rose-220 animate-pulse' : 'text-slate-600 bg-slate-100'
                                }`}>
                                  {item.action}
                                </span>
                              </td>
                              <td className={`${cellStyle} font-mono text-[10px] font-bold text-amber-600`}>
                                {item.module} {item.entityId ? `#${item.entityId.slice(0, 5)}` : ''}
                              </td>
                              <td className={cellStyle}>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 leading-none">{item.user?.name || 'Automated Operator'}</span>
                                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">{item.user?.email || 'system@ooms.com'}</span>
                                </div>
                              </td>
                              <td className={`${cellStyle} max-w-lg select-text`}>
                                {(() => {
                                  let oldVal: any = null;
                                  let newVal: any = null;
                                  try { if (item.oldValues) oldVal = JSON.parse(item.oldValues); } catch(e) {}
                                  try { if (item.newValues) newVal = JSON.parse(item.newValues); } catch(e) {}
                                  const keys = Array.from(new Set([...(oldVal ? Object.keys(oldVal) : []), ...(newVal ? Object.keys(newVal) : [])]));
                                  if (keys.length === 0) return <span className="text-slate-400 italic">No delta changes logs</span>;
                                  return (
                                    <div className="flex flex-col gap-0.5">
                                      {keys.slice(0, 2).map((k) => {
                                        const o = oldVal ? oldVal[k] : undefined;
                                        const n = newVal ? newVal[k] : undefined;
                                        return (
                                          <div key={k} className="text-[10px] font-mono leading-tight truncate">
                                            <span className="font-semibold text-slate-500">{k}:</span> {o !== undefined && <span className="line-through text-rose-500 bg-rose-50 px-1 rounded">{String(o)}</span>} → <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold">{String(n)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </td>
                            </>
                          )}

                          {/* ROW CONTEXTUAL ACTIONS */}
                          {activeModule !== 'AuditLogs' && (
                            <td className={cellStyle} onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedRecord(item);
                                    setIsDrawerOpen(true);
                                  }}
                                  className="text-[10px] font-bold text-[#F59E0B] hover:text-white hover:bg-[#F59E0B] bg-amber-50 p-1.5 px-2.5 rounded-lg transition-all opacity-100"
                                  title="View progressive details drawer"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => confirmDeleteRecord(activeModule, item.id, item.subject || item.fileName || item.itemName || item.printerName || item.serviceName || item.vehiclePlate || 'this item')}
                                  className="text-[10px] font-extrabold text-[#EF4444] hover:text-white hover:bg-[#EF4444] bg-red-50/75 p-1.5 px-2.5 rounded-lg transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* RIGHT SIDE / SPLIT SCREEN PREVIEW AREA (EXCLUSIVE TO DOCUMENTS MODULE FOR HIGHEST FIDELITY) */}
            {activeModule === 'Documents' && (
              <div className="hidden md:flex md:w-[35%] bg-slate-50/70 border-l border-[#E5E7EB] flex-col p-4 select-none">
                {selectedRecord ? (
                  <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#F59E0B]" />
                        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Live Workspace Document Preview</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setDocumentZoom(prev => Math.max(75, prev - 25))} 
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{documentZoom}%</span>
                        <button 
                          onClick={() => setDocumentZoom(prev => Math.min(150, prev + 25))} 
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* ENHANCED LIVE DYNAMIC MOCK DOCUMENT PREVIEW SCREEN (Nigeria letterhead standard) */}
                    <div className="flex-grow bg-white border border-slate-150 rounded-xl p-5 shadow-2xs overflow-y-auto max-h-[440px] text-center relative select-text" style={{ transform: `scale(${documentZoom / 100})`, transformOrigin: 'top center' }}>
                      <div className="border-b-2 border-[#1E3A8A] pb-2 mb-4">
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#64748B] block">OOMS Federal Republic of Nigeria Document Center</span>
                        <div className="w-7 h-7 bg-amber-500 rounded-full mx-auto my-1 flex items-center justify-center text-[10px] text-white font-black shadow-sm">
                          NG
                        </div>
                        <h4 className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider">National Operations Ledger Directory</h4>
                        <span className="text-[7.5px] font-mono text-slate-400">Classified Reference ID: {selectedRecord.id} • Registered Node Abuja</span>
                      </div>

                      <div className="text-left space-y-3 font-sans text-[10px] text-slate-800 leading-normal">
                        <div>
                          <strong className="text-[8.5px] uppercase text-slate-400 font-bold block mb-0.5">Subject Descriptor:</strong>
                          <span className="font-extrabold border-b border-dashed border-slate-200 block pb-1 text-[#030712]">{selectedRecord.fileName}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <strong className="text-[8.5px] uppercase text-slate-400 font-semibold block">Clearence:</strong>
                            <span className="font-bold text-rose-600 bg-rose-50 px-1.5 rounded inline-block mt-0.5 border border-rose-100 uppercase text-[9px]">{selectedRecord.classification}</span>
                          </div>
                          <div>
                            <strong className="text-[8.5px] uppercase text-slate-400 font-semibold block">Ingest Size:</strong>
                            <span className="font-bold text-slate-700 font-mono">{(selectedRecord.sizeKb / 1024).toFixed(2)} Megabytes</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <strong className="text-[8.5px] uppercase text-[#F59E0B] font-bold block mb-1">Authentic Operations Review Digest:</strong>
                          <p className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg text-[9px] text-slate-650 italic leading-relaxed">
                            "The state audit ledger hereby registers file of category <span className="font-bold text-slate-850">"{selectedRecord.category}"</span> uploaded securely by OOMS administrator <span className="font-bold text-slate-850">"{selectedRecord.uploadedBy}"</span> on {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toDateString() : 'recent shift'}. Approval chain verified for deployment."
                          </p>
                        </div>

                        {/* Interactive Seal mockup */}
                        <div className="pt-4 flex items-center justify-between">
                          <div className="text-center font-mono">
                            <div className="text-[8px] font-bold text-slate-500 uppercase">System Integrity Checked</div>
                            <span className="text-[9px] text-[#10B981] font-bold select-none mt-1 inline-block bg-emerald-50 border border-emerald-200 px-1.5 rounded uppercase">✓ Nominal Secure</span>
                          </div>
                          <div className="text-center">
                            <div className="w-10 h-10 border-4 border-dashed border-[#F59E0B] rounded-full flex items-center justify-center font-bold font-mono text-[7px] text-[#D97706] scale-100 rotate-12 select-none">
                              OOMS NG
                            </div>
                            <span className="text-[7px] block text-slate-400 mt-1 uppercase">HQ Seal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6 select-none font-sans">
                    <FileText className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-500">Live Preview Standby</span>
                    <p className="text-[10px] text-slate-400 mt-1">Select a workspace document from the database ledger to inspect raw Nigeria compliance preview charts instantly.</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* TABLE PAGINATION FOOTER */}
          <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B] select-none font-sans">
            <div className="font-semibold text-[#0F172A]">
              Showing <span className="font-bold">{currentWorkspaceItems.length}</span> of <span className="font-bold">{totalRecords}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1 || isLoading}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold flex items-center gap-1 transition-all cursor-pointer bg-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              
              <div className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] font-bold font-mono text-slate-700 min-w-[50px] text-center">
                {page} / {totalPages}
              </div>

              <button
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold flex items-center gap-1 transition-all cursor-pointer bg-white"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODERN SLIDING RIGHT-SIDE DETAILS DRAWER (PROGRESSIVE DISCLOSURE - WIDTH 420PX) */}
      <AnimatePresence>
        {isDrawerOpen && selectedRecord && (
          <>
            {/* Backdrop layer */}
            <div 
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setIsDrawerOpen(false)}
            />
            {/* 420px Right Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-ping" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Operations Details Log</h3>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[280px]">
                      {selectedRecord.subject || selectedRecord.fileName || selectedRecord.itemName || selectedRecord.printerName || selectedRecord.serviceName || selectedRecord.vehiclePlate || 'Asset specifications'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 px-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors cursor-pointer border border-slate-200 bg-white"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tabs select */}
              <div className="px-5 border-b border-slate-100 bg-slate-50 flex items-center gap-1 select-none">
                <button
                  onClick={() => setActiveDrawerTab('overview')}
                  className={`px-3 py-3 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === 'overview' ? 'border-[#F59E0B] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Overview & Assets
                </button>
                <button
                  onClick={() => setActiveDrawerTab('activity')}
                  className={`px-3 py-3 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === 'activity' ? 'border-[#F59E0B] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Timeline Activity
                </button>
                <button
                  onClick={() => setActiveDrawerTab('approvals')}
                  className={`px-3 py-3 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === 'approvals' ? 'border-[#F59E0B] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Approvals Chain
                </button>
              </div>

              {/* Drawer content area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 select-text">
                
                {/* 1. OVERVIEW DETAIL PANEL */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-5">
                    
                    {/* ID and quick stats */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                      <div className="text-left">
                        <span className="text-[8.5px] uppercase font-bold text-slate-400 font-mono leading-none">Security Reference ID</span>
                        <p className="text-xs font-mono font-bold text-[#D97706] mt-0.5">#{selectedRecord.id}</p>
                      </div>
                      <span className={getStatusBadgeClass(selectedRecord.status)}>{selectedRecord.status}</span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-black tracking-widest text-[#64748B] font-mono">Metadata Matrix</h4>

                      {/* Correspondence specifics */}
                      {activeModule === 'Correspondence' && (
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Tracking Identifier:</span>
                            <span className="text-xs font-bold font-mono text-slate-800">{selectedRecord.trackingNumber}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Authorized Sender:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.sender}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Ministerial Routing Department:</span>
                            <span className="text-xs font-extrabold text-[#F57C00]">{selectedRecord.department}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Registered Timestamp:</span>
                            <span className="text-xs text-slate-650">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Subscription specifics */}
                      {activeModule === 'Subscriptions' && (
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Renewal Service Name:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.serviceName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">National Vendor Host:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.vendor}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Total cost (Ex-VAT):</span>
                            <span className="text-xs font-extrabold text-emerald-600">₦{Number(selectedRecord.cost).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Billing Cycle agreement:</span>
                            <span className="text-xs font-bold font-mono text-slate-850 uppercase">{selectedRecord.billingCycle || 'Monthly'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Routing Branch:</span>
                            <span className="text-xs text-slate-650">{selectedRecord.department}</span>
                          </div>
                        </div>
                      )}

                      {/* Inventory specifics */}
                      {activeModule === 'Inventory' && (
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Material Asset Name:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.itemName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">SKU Barcode Indicator:</span>
                            <span className="text-xs font-bold font-mono text-slate-800">{selectedRecord.sku}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Operational In-Stock Level:</span>
                            <span className="text-xs font-extrabold text-[#F59E0B]">{selectedRecord.quantity} Unit slices</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Fusing Warehousing Node:</span>
                            <span className="text-xs text-slate-650">{selectedRecord.location}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Category Label:</span>
                            <span className="text-xs text-slate-650 font-bold">{selectedRecord.category}</span>
                          </div>
                        </div>
                      )}

                      {/* Fleet details */}
                      {activeModule === 'Fuel' && (
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Vehicle Registration Plate:</span>
                            <span className="text-xs font-bold font-mono text-slate-800">{selectedRecord.vehiclePlate}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Assigned Logistics Driver:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.driverName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Volume of Premium Fuel:</span>
                            <span className="text-xs font-bold font-mono text-slate-700">{selectedRecord.liters} L</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Handshake Fuel Cost:</span>
                            <span className="text-xs font-extrabold text-emerald-600">₦{Number(selectedRecord.cost).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Vendor filling node:</span>
                            <span className="text-xs text-slate-650">{selectedRecord.vendor || 'A&G Global Petroleum'}</span>
                          </div>
                        </div>
                      )}

                      {/* Printer specifications */}
                      {activeModule === 'Printer' && (
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Device Name & Alias:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.printerName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Hardware Model Spec:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.model}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Network Address IP:</span>
                            <span className="text-xs font-mono font-bold text-[#3B82F6]">{selectedRecord.ipAddress}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Ink/Toner Capacity level:</span>
                            <span className="text-xs font-extrabold text-[#10B981]">{selectedRecord.tonerLevel}% Nominal</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Fusing branch department:</span>
                            <span className="text-xs text-slate-650 font-semibold">{selectedRecord.department}</span>
                          </div>
                        </div>
                      )}

                      {/* Document specifications */}
                      {activeModule === 'Documents' && (
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Logical File Name:</span>
                            <span className="text-xs font-bold text-slate-800 block truncate">{selectedRecord.fileName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Database Category Tag:</span>
                            <span className="text-xs font-bold text-slate-800">{selectedRecord.category}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Classification Clearance Level:</span>
                            <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block uppercase text-[9.5px] font-mono">{selectedRecord.classification}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">File Data Size:</span>
                            <span className="text-xs font-mono font-bold text-slate-700">{(selectedRecord.sizeKb / 1024).toFixed(3)} Megabytes ({selectedRecord.sizeKb} Kilobytes)</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Ledger Uploader operator:</span>
                            <span className="text-xs text-slate-650 font-bold">{selectedRecord.uploadedBy}</span>
                          </div>
                        </div>
                      )}

                      {/* Audit Log details */}
                      {activeModule === 'AuditLogs' && (
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Action Flag:</span>
                            <span className="text-xs font-bold text-slate-800 uppercase bg-slate-50 p-1 border border-slate-200 inline-block rounded">{selectedRecord.action}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Sector Scope Link:</span>
                            <span className="text-xs font-bold text-amber-500 font-mono">{selectedRecord.module}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Audited Operator:</span>
                            <span className="text-xs font-bold text-slate-900">{selectedRecord.user?.name || 'System Auto Engine'} ({selectedRecord.user?.email || 'system@ooms.com'})</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-[#F59E0B] font-bold block mb-1">Raw audit JSON database Delta:</span>
                            <div className="bg-slate-950 text-emerald-450 border border-slate-850 p-3 rounded-lg overflow-x-auto max-h-[160px] font-mono text-[9px] text-left select-all leading-relaxed whitespace-pre-wrap">
                              {JSON.stringify({ 
                                Action: selectedRecord.action, 
                                Module: selectedRecord.module, 
                                Timestamp: selectedRecord.timestamp,
                                EntityID: selectedRecord.entityId,
                                OldValues: selectedRecord.oldValues ? JSON.parse(selectedRecord.oldValues) : null,
                                NewValues: selectedRecord.newValues ? JSON.parse(selectedRecord.newValues) : null
                              }, null, 2)}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* INTERACTIVE WORKFLOW AND GOVERNMENT ACTIONS INSIDE DRAWER (Progressive Disclosure) */}
                    {activeModule !== 'AuditLogs' && (
                      <div className="pt-4 border-t border-slate-100 space-y-4">
                        <h4 className="text-[10px] uppercase font-black tracking-widest text-[#64748B] font-mono">Goverment Operations</h4>
                        
                        <div className="grid grid-cols-2 gap-3 select-none">
                          
                          {/* Re-route branch department select */}
                          <div className="space-y-1">
                            <label className="block text-[8.5px] uppercase font-extrabold text-[#64748B]">Assign Department</label>
                            <select
                              aria-label="Assign department"
                              value={selectedRecord.department || ''}
                              className="w-full text-[10px] py-2 px-2 border border-slate-200 rounded-lg hover:border-[#F59E0B] transition-all bg-white font-bold text-slate-700 cursor-pointer outline-hidden"
                              onChange={(e) => handleAssignAction(selectedRecord.id, e.target.value, selectedRecord.subject || selectedRecord.fileName || 'this record')}
                            >
                              <option value="Aviation">Aviation</option>
                              <option value="Works & Housing">Works</option>
                              <option value="Finance">Finance</option>
                              <option value="Transportation">Transit</option>
                              <option value="Secretariat">Secretariat</option>
                            </select>
                          </div>

                          {/* Transition document classification status dropdown rules */}
                          <div className="space-y-1">
                            <label className="block text-[8.5px] uppercase font-extrabold text-[#64748B]">Transition Status</label>
                            <select
                              aria-label="Transition Status"
                              value={selectedRecord.status}
                              className="w-full text-[10px] py-2 px-2 border border-slate-200 rounded-lg hover:border-[#F59E0B] transition-all bg-white font-bold text-slate-700 cursor-pointer outline-hidden"
                              onChange={(e) => handleTransitionAction(selectedRecord.id, e.target.value, selectedRecord.subject || selectedRecord.fileName || 'this record')}
                            >
                              {activeModule === 'Documents' ? (
                                <>
                                  <option value="Draft">Draft</option>
                                  <option value="Review">Review</option>
                                  <option value="Approved">Approve</option>
                                  <option value="Published">Publish</option>
                                  <option value="Archived">Archive</option>
                                </>
                              ) : activeModule === 'Correspondence' ? (
                                <>
                                  <option value="Submitted">Submitted</option>
                                  <option value="Pending-Review">In-Review</option>
                                  <option value="Approved">Approve</option>
                                  <option value="Archived">Archive</option>
                                </>
                              ) : (
                                <>
                                  <option value="Active">Active</option>
                                  <option value="In-Transit">In-Transit</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Expired">Expired</option>
                                </>
                              )}
                            </select>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 2. ACTIVITY TIMELINE REPORT */}
                {activeDrawerTab === 'activity' && (
                  <div className="space-y-4 font-sans text-left">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-[#64748B] font-mono">Sequential Action Timeline</h4>
                    <div className="relative border-l-2 border-slate-100 pl-4 ml-2.5 space-y-5 py-2">
                      {[
                        { title: 'Authorized Security Handshake Ingestion', desc: 'Secure encryption keys checked. Record written to state database tables.', user: selectedRecord?.uploadedBy || 'Yusuf Musa', date: 'Just now' },
                        { title: 'Operational Node Ingress Gateway routing', desc: 'Auto routed via OOMS Abuja headquarters load-balancer system.', user: 'Automated Node Daemon', date: '5 mins ago' },
                        { title: 'Cryptographic Clearance Manifest approved', desc: 'Ledger identity checked.', user: 'Bhakor Consult System Ledger', date: '10 mins ago' }
                      ].map((evt, idx) => (
                        <div key={idx} className="relative group text-xs text-slate-800">
                          {/* Circle pointer */}
                          <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-[#FA9E05] border-2 border-white ring-4 ring-[#FFF7ED]" />
                          <div className="flex items-center justify-between font-bold leading-none">
                            <span className="text-[#0F172A] font-extrabold max-w-[200px] leading-tight block">{evt.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">{evt.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-450 leading-relaxed mt-1">{evt.desc}</p>
                          <span className="block text-[9px] text-[#64748B] font-bold mt-1 font-mono uppercase tracking-wider">Operator: {evt.user}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. APPROVALS CHAIN GRAPH */}
                {activeDrawerTab === 'approvals' && (
                  <div className="space-y-4 text-left font-sans">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-[#64748B] font-mono">Abuja Headquarters Sign-Off Chain</h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Logistics Officer Scan', role: 'Operator Signature', status: 'Approved', info: 'Scanning compliance completed.' },
                        { title: 'Sector Deputy Registrar Verification', role: 'Compliance Auditor', status: 'Approved', info: 'Check classification matrix.' },
                        { title: 'Honorable Federal Registry Director Sign-off', role: 'National Clearance Officer', status: 'Pending Approval', info: 'Final budget and dispatch authorization seal.' }
                      ].map((step, idx) => (
                        <div key={idx} className="p-3.5 border border-slate-100 bg-slate-50 rounded-xl leading-snug">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-850">{step.title}</span>
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              step.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            }`}>
                              {step.status}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-slate-400 font-mono tracking-wider block mt-0.5">{step.role}</span>
                          <p className="text-[10px] font-semibold text-slate-450 italic mt-1.5">"{step.info}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer footer utilities */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between select-none">
                <span className="text-[10px] text-slate-450 font-bold uppercase font-mono tracking-wider">OOMS Ledger Control</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toast.info(`Ledger manifest successfully generated for item ID #${selectedRecord?.id}.`, {
                        style: { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#0F172A' }
                      });
                    }}
                    className="p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-650 cursor-pointer text-xs font-bold"
                    title="Export complete record audit manifest"
                  >
                    Export Log
                  </button>
                  <button
                    onClick={() => confirmDeleteRecord(activeModule, selectedRecord.id, selectedRecord.subject || selectedRecord.fileName || 'this record')}
                    className="p-2 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-[10px] uppercase rounded-lg shadow-2xs select-none transition-all cursor-pointer font-sans"
                  >
                    Force Purge
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RETHINK REMOVAL / SOFT-DELETE WORKSPACE POPUP DIALOG */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2 text-left">
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider font-display shrink-0">Delete Record Ledger</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Are you absolutely sure you want to soft-delete this <strong className="text-slate-800 uppercase text-[10.5px] font-bold">{deleteCandidate?.moduleName}</strong> record entry?
                {deleteCandidate?.label && <span className="block mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 italic font-bold">"{deleteCandidate.label}"</span>}
              </p>
              <div className="text-rose-600 text-[10px] font-bold font-mono uppercase bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex items-center gap-1.5 leading-none select-none">
                <span>⚠️ This action alters national tracking history indexes.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-1.5 select-none font-sans">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-[#E5E7EB] hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExecute}
                className="px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
