import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowUpDown, Download, Edit3, Trash2, Lock, Unlock, 
  MoreVertical, CheckSquare, Square, RefreshCw, SlidersHorizontal,
  FileSpreadsheet, FileDown, ShieldCheck, UserX, UserCheck, 
  ChevronDown, Building, Briefcase, MapPin, Check, Plus, AlertCircle, Database, ChevronRight, Mail, User
} from 'lucide-react';
import { toast } from 'sonner';

interface UserDirectoryTableProps {
  users: any[];
  currentUser: any;
  onSelectUser: (user: any) => void;
  selectedUser: any | null;
  onRefresh: () => void;
  token: string;
  onBulkAction: (action: string, selectedIds: string[], data?: any) => void;
}

type SortField = 'name' | 'email' | 'role' | 'status' | 'lastLogin' | 'createdAt' | 'department';
type SortOrder = 'asc' | 'desc';

export default function UserDirectoryTable({
  users,
  currentUser,
  onSelectUser,
  selectedUser,
  onRefresh,
  token,
  onBulkAction
}: UserDirectoryTableProps) {
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Search and Multi-filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Bulk operation variables
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState('VIEWER');
  const [bulkDept, setBulkDept] = useState('Advisory & Compliance');

  // Multi-Filter Panel toggle
  const [showFilters, setShowFilters] = useState(false);

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Extract unique departments & branches
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => u.department && set.add(u.department));
    return Array.from(set);
  }, [users]);

  const branches = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => u.branch && set.add(u.branch));
    return Array.from(set);
  }, [users]);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter ? u.role === roleFilter : true;
      const matchStatus = statusFilter ? u.status === statusFilter : true;
      const matchDept = deptFilter ? u.department === deptFilter : true;
      const matchBranch = branchFilter ? u.branch === branchFilter : true;

      return matchSearch && matchRole && matchStatus && matchDept && matchBranch;
    });
  }, [users, searchQuery, roleFilter, statusFilter, deptFilter, branchFilter]);

  // Sorted and filtered
  const sortedAndFilteredUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'lastLogin' || sortField === 'createdAt') {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUsers, sortField, sortOrder]);

  // Bulk select operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = sortedAndFilteredUsers.map(u => u.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // EXPORT CSV UTILITY
  const exportToCSV = () => {
    if (sortedAndFilteredUsers.length === 0) {
      toast.error('No user records available to export.');
      return;
    }

    const headers = ['Employee ID', 'Full Name', 'Email Address', 'Clearance Role', 'Department', 'Branch', 'Job Title', 'Current Status', 'Last Login', 'Created Date'];
    const rows = sortedAndFilteredUsers.map(u => [
      u.employeeId || 'N/A',
      u.name || 'N/A',
      u.email || 'N/A',
      u.role || 'N/A',
      u.department || 'N/A',
      u.branch || 'N/A',
      u.jobTitle || 'N/A',
      u.status || 'N/A',
      u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OOMS_Personnel_Directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Personnel record CSV ledger successfully preparado and exported!');
  };

  // EXPORT EXCEL
  const exportToExcel = () => {
    if (sortedAndFilteredUsers.length === 0) {
      toast.error('No records matched current query.');
      return;
    }

    let tableHtml = `<table border="1">
      <tr style="background-color: #F5A623; color: white; font-weight: bold;">
        <th>Employee ID</th>
        <th>Full Name</th>
        <th>Email Address</th>
        <th>Clearance Role</th>
        <th>Department</th>
        <th>Branch</th>
        <th>Job Title</th>
        <th>Current Status</th>
        <th>Last Login</th>
        <th>Created Date</th>
      </tr>`;

    sortedAndFilteredUsers.forEach(u => {
      tableHtml += `<tr>
        <td>${u.employeeId || 'N/A'}</td>
        <td>${u.name || 'N/A'}</td>
        <td>${u.email || 'N/A'}</td>
        <td>${u.role || 'N/A'}</td>
        <td>${u.department || 'N/A'}</td>
        <td>${u.branch || 'N/A'}</td>
        <td>${u.jobTitle || 'N/A'}</td>
        <td>${u.status || 'N/A'}</td>
        <td>${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
      </tr>`;
    });

    tableHtml += '</table>';
    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `OOMS_ActiveDirectory_Ledger_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Personnel Directory Excel ledger file generated successfully!');
  };

  const getStatusBadge = (status: string) => {
    const val = status?.toUpperCase();
    switch (val) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#ECFDF3] border border-[#ABEFC6] text-[#027A48]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
            Active
          </span>
        );
      case 'INVITED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#F0F9FF] border border-[#B9E6FE] text-[#026AA2]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
            Invited
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#FFFBFA] border border-[#FDA29B] text-[#B42318]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]" />
            Suspended
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#FEF6EE] border border-[#F9DBAF] text-[#B54708]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F79009]" />
            Locked
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#F8FAFC] border border-[#E4E7EC] text-[#475467]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#667085]" />
            Inactive
          </span>
        );
      case 'PASSWORD_RESET_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#F9F5FF] border border-[#E9D7FE] text-[#5925DC]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9b5de5]" />
            Reset Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 border border-slate-100 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status}
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] rounded-md font-mono">
            super admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#FEF6EE] text-[#B54708] border border-[#F9DBAF] rounded-md font-mono">
            admin
          </span>
        );
      case 'MANAGER':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#F9F5FF] text-[#6941C6] border border-[#E9D7FE] rounded-md font-mono">
            manager
          </span>
        );
      case 'OFFICER':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] rounded-md font-mono">
            officer
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#F8FAFC] text-[#344054] border border-[#E2E8F0] rounded-md font-mono">
            viewer
          </span>
        );
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setDeptFilter('');
    setBranchFilter('');
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 5: SEARCH EXPERIENCE - Light, high-contrast, cohesive toolbar */}
      <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between text-[#111827] shadow-xs">
        
        {/* Dynamic Search Box Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            id="directory-search-input"
            type="text"
            placeholder="Search personnel directory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm py-2 bg-[#F8FAFC] border border-[#E5E7EB] pl-10 pr-4 rounded-lg outline-hidden focus:border-[#F59E0B] text-[#111827] placeholder-[#6B7280]"
          />
        </div>

        {/* Filters and Utilities Area */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Sub-Filters Selector for Role */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-semibold py-2 px-3 rounded-lg outline-hidden text-[#111827] cursor-pointer focus:border-[#F59E0B]"
          >
            <option value="">All Clearance Levels</option>
            <option value="SUPER_ADMIN">Cabinet Super Admin</option>
            <option value="ADMIN">Registry Admin</option>
            <option value="MANAGER">Branch Manager</option>
            <option value="OFFICER">Operations Officer</option>
            <option value="VIEWER">Compliance Viewer</option>
          </select>

          {/* Sub-Filters Selector for Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-semibold py-2 px-3 rounded-lg outline-hidden text-[#111827] cursor-pointer focus:border-[#F59E0B]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Users</option>
            <option value="INVITED">Pending Invited</option>
            <option value="SUSPENDED">Suspended Block</option>
            <option value="LOCKED">Account Locked</option>
          </select>

          {/* Sort Controller */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-semibold py-2 px-3 rounded-lg outline-hidden text-[#111827] cursor-pointer focus:border-[#F59E0B]"
          >
            <option value="createdAt">Date Created (New) </option>
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="role">Sort by Role</option>
            <option value="department">Sort by Department</option>
            <option value="status">Sort by Status</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-[#F8FAFC] hover:bg-slate-50 border border-[#E5E7EB] rounded-lg text-[#6B7280] transition-all cursor-pointer"
            title="Toggle Sort Directions"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* Bulk Action Controls Toggle when checked */}
          {(roleFilter || statusFilter || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold px-3 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg border border-rose-100 cursor-pointer"
            >
              Clear Filters
            </button>
          )}

          {/* Export Action Tools */}
          <div className="flex items-center gap-1 border-l pl-3 ml-1 border-[#E5E7EB]">
            <button
              onClick={exportToCSV}
              className="p-2 bg-[#F8FAFC] hover:bg-[#FFF7ED] text-[#6B7280] border border-[#E5E7EB] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export as CSV ledger"
            >
              <FileDown className="w-4 h-4 text-[#6B7280]" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={exportToExcel}
              className="p-2 bg-[#F8FAFC] hover:bg-[#FFF7ED] text-[#6B7280] border border-[#E5E7EB] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export as Excel ledger"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#6B7280]" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Controls Panel Drawer */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-[#FFF9F2] border border-[#F59E0B]/30 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-left shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <span className="font-bold text-[#111827] text-sm block">
                Bulk Operations Enabled ({selectedIds.length} personnel selected)
              </span>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Bulk change authority levels, clearance states, or issue instant suspension blocks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={() => onBulkAction('ACTIVATE', selectedIds)}
              className="px-3 py-1.5 bg-[#10B981] hover:bg-[#027A48] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Activate All
            </button>
            <button
              onClick={() => onBulkAction('SUSPEND', selectedIds)}
              className="px-3 py-1.5 bg-[#EF4444] hover:bg-[#B42318] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Suspend All
            </button>
            <button
              onClick={() => onBulkAction('RESEND_INVITATION', selectedIds)}
              className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              Resend Invitations
            </button>

            {/* Set Role */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2 py-1 rounded-lg">
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                className="text-xs font-bold bg-transparent outline-none cursor-pointer text-[#6B7280]"
              >
                <option value="VIEWER">Viewer</option>
                <option value="OFFICER">Officer</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                onClick={() => onBulkAction('ASSIGN_ROLE', selectedIds, { role: bulkRole })}
                className="px-2 py-0.5 bg-[#FFF7ED] text-[#F59E0B] hover:bg-[#FFF4E5] border border-amber-200 rounded text-[10px] font-bold"
              >
                Apply
              </button>
            </div>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 border border-[#E5E7EB] bg-white text-[#6B7280] text-xs font-bold rounded-lg cursor-pointer hover:bg-[#FFFBEB]"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* MASTER TITLE BAR WITH SCHEMA DATA */}
      <div className="flex items-center justify-between border-b pb-3 border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#111827]">
            Registered Personnel
          </h3>
          <span className="bg-[#FFF9F2] text-[#F59E0B] border border-[#F59E0B]/20 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
            {sortedAndFilteredUsers.length} records found
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={sortedAndFilteredUsers.length > 0 && selectedIds.length === sortedAndFilteredUsers.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-[#E5E7EB] text-[#F59E0B] focus:ring-[#F59E0B]/25 cursor-pointer w-4 h-4 bg-white"
          />
          <span className="text-xs text-[#6B7280] font-semibold">Select All Listing</span>
        </div>
      </div>

      {/* SECTION 4: DIRECTORY EXPERIENCE - Sleek horizontal card rows */}
      <div className="space-y-3.5">
        {sortedAndFilteredUsers.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-16 text-center text-[#6B7280] space-y-4">
            <div className="w-12 h-12 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex items-center justify-center mx-auto text-lg text-[#F59E0B]">
              📂
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#111827]">
                No matching personnel accounts in directory
              </p>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed">
                Adjust search keywords or dynamic sub-filters to update current records query output.
              </p>
            </div>
          </div>
        ) : (
          sortedAndFilteredUsers.map((item: any) => {
            const isChecked = selectedIds.includes(item.id);
            const isSelected = selectedUser?.id === item.id;
            
            return (
              <div
                key={item.id}
                onClick={() => onSelectUser(item)}
                className={`bg-white border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-150 cursor-pointer ${
                  isSelected 
                    ? 'border-[#F59E0B] shadow-sm ring-1 ring-[#F59E0B]' 
                    : 'border-[#E5E7EB] hover:border-[#F59E0B] hover:shadow-xs hover:bg-[#FFFBEB]/40'
                }`}
              >
                {/* Checkbox and Avatar block container */}
                <div className="flex items-center gap-3 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleSelectOne(e as any, item.id)}
                    className="rounded border-[#E5E7EB] text-[#F59E0B] focus:ring-[#F59E0B]/25 cursor-pointer w-4 h-4 bg-white shrink-0"
                  />
                  
                  {/* Avatar Frame with Referrer Policy and dicebear fallback */}
                  <div className="w-11 h-11 rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F8FAFC] flex items-center justify-center font-bold text-[#F59E0B] text-sm shrink-0">
                    {item.photoPath ? (
                      <img src={item.photoPath} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.email || item.name}`} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>

                  {/* Name, Title, and ID */}
                  <div className="text-left truncate min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111827] text-sm leading-tight tracking-tight hover:text-[#F59E0B] transition-colors truncate">
                        {item.name || 'Unnamed Cabinet Personnel'}
                      </span>
                      {getRoleBadge(item.role)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 min-w-0">
                      <span className="text-xs text-[#6B7280] font-semibold truncate">
                        {item.jobTitle || 'Corporate Officer'}
                      </span>
                      <span className="text-[10px] text-[#6B7280] bg-[#F8FAFC] border border-[#E5E7EB] px-1.5 py-0.2 rounded font-mono shrink-0">
                        {item.employeeId || `EMP-${item.id.slice(0, 8)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Contacts and Locations */}
                <div className="flex items-start lg:items-center gap-6 lg:gap-12 text-left justify-start">
                  
                  {/* Email contact */}
                  <div className="space-y-1 w-40 text-left shrink-0">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block">Email Address</span>
                    <span className="text-xs text-[#111827] font-semibold truncate block">
                      {item.email}
                    </span>
                  </div>

                  {/* Department Deployments */}
                  <div className="space-y-1 w-40 text-left shrink-0">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block">Department Deployments</span>
                    <div className="flex items-center gap-1.5 text-xs text-[#111827] font-semibold mt-0.5">
                      <Building className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <span className="truncate">{item.department || 'Advisory & Compliance'}</span>
                    </div>
                  </div>

                  {/* Account state status indicators */}
                  <div className="space-y-1 shrink-0">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block">Clearance State</span>
                    <div className="mt-0.5">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                </div>

                {/* Actions Launcher */}
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectUser(item)}
                    className="px-4 py-2 bg-white hover:bg-[#FFFBEB] hover:text-[#C2410C] hover:border-[#FDBA74] text-[#111827] border border-[#E5E7EB] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    View File
                    <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
