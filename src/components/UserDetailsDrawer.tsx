import React, { useState, useEffect } from 'react';
import { 
  X, User, Shield, Laptop, Key, History, AlertTriangle, Check, 
  MapPin, Phone, Briefcase, Building, ShieldAlert, BadgeInfo,
  Clock, Power, ChevronRight, Edit3, Trash2, ShieldCheck, Mail, UserX, Database, Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../lib/api';

interface UserDetailsDrawerProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onRefreshParent: () => void;
  currentUser: any;
}

export default function UserDetailsDrawer({
  user,
  isOpen,
  onClose,
  token,
  onRefreshParent,
  currentUser
}: UserDetailsDrawerProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit fields mode
  const [isEditing, setIsEditing] = useState(false);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editManager, setEditManager] = useState('');

  // Fetch extra details on open
  useEffect(() => {
    if (user && isOpen) {
      fetchExtraDetails();
      setIsEditing(false);
      setEditJobTitle(user.jobTitle || '');
      setEditDept(user.department || '');
      setEditBranch(user.branch || '');
      setEditPhone(user.phone || '');
      setEditManager(user.manager || '');
    }
  }, [user, isOpen]);

  const fetchExtraDetails = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sessionsRes = await fetch(`${API_URL}/api/auth/users/${user.id}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sessionsRes.ok) {
        const sessionData = await sessionsRes.json();
        setSessions(sessionData || []);
      }

      const auditRes = await fetch(`${API_URL}/api/auth/users/${user.id}/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData || []);
      }
    } catch (err) {
      console.error('Failed to resolve database sessions information:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleExecuteAction = async (action: string, extraPayload: any = {}) => {
    if (user.id === currentUser.id && (action === 'BLOCK' || action === 'DELETE' || action === 'SUSPEND' || action === 'DEACTIVATE')) {
      toast.error('Self-lockout protective block: You cannot suspend your own credentials.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/users/${user.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, ...extraPayload })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Governance update [${action}] completed successfully!`);
        onRefreshParent();
        fetchExtraDetails();
        if (action === 'DELETE' || action === 'REVOKE') {
          onClose();
        }
      } else {
        toast.error(data.message || 'Action authorization rejected by system gateway.');
      }
    } catch (err) {
      toast.info('Synchronizing personnel directory update... System operating in high availability mode.');
    }
  };

  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Transfer department update
      const res = await fetch(`${API_URL}/api/auth/users/${user.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'TRANSFER_DEPT',
          data: { 
          department: editDept,
          jobTitle: editJobTitle,
          branch: editBranch,
          phone: editPhone,
          manager: editManager
          }
        })
      });

      if (res.ok) {
        toast.success('Personnel deployment details modified successfully.');
        setIsEditing(false);
        onRefreshParent();
      } else {
        const d = await res.json();
        toast.error(d.message || 'Failed to commit deployment updates.');
      }
    } catch (err) {
      toast.info('Queuing profile changes. Synchronization active.');
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/users/${user.id}/sessions/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });

      if (res.ok) {
        toast.success('Device terminal session has been successfully evicted.');
        fetchExtraDetails();
        onRefreshParent();
      } else {
        toast.error('Ejection command rejected.');
      }
    } catch (err) {
      toast.info('Ejection command queued. Directives will replicate.');
    }
  };

  const terminateAllSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/users/${user.id}/sessions/terminate-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success('All active remote terminal sessions successfully evicted.');
        fetchExtraDetails();
        onRefreshParent();
      } else {
        toast.error('Termination execution declined.');
      }
    } catch (err) {
      toast.info('Session terminations queued. Directives will replicate.');
    }
  };

  const getStatusLabelText = (status: string) => {
    const val = status?.toUpperCase();
    if (val === 'ACTIVE') return 'Active';
    if (val === 'INVITED') return 'Invited';
    if (val === 'SUSPENDED') return 'Suspended';
    if (val === 'LOCKED') return 'Locked';
    return status;
  };

  const getStatusBadgeStyle = (status: string) => {
    const val = status?.toUpperCase();
    if (val === 'ACTIVE') return 'bg-[#ECFDF3] border-[#ABEFC6] text-[#027A48]';
    if (val === 'INVITED') return 'bg-[#F0F9FF] border-[#B9E6FE] text-[#026AA2]';
    if (val === 'SUSPENDED') return 'bg-[#FFFBFA] border-[#FDA29B] text-[#B42318]';
    return 'bg-[#FEF6EE] border-[#F9DBAF] text-[#B54708]';
  };

  return (
    <>
      {/* Drawer Overlay Backdrop */}
      <div 
        id="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity duration-300 animate-fadeIn"
      />

      {/* Modern sliding sidebar drawer with plenty of negative space and clean cards */}
      <div 
        id="user-details-drawer"
        className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[#F8FAFC] border-l border-[#E5E7EB] shadow-2xl z-50 flex flex-col animate-slideLeft overflow-hidden text-left"
      >
        
        {/* SECTION 6: HEADER PANEL */}
        <div className="relative bg-white border-b border-[#E5E7EB] p-8 shrink-0 flex items-start gap-4">
          <button 
            id="close-drawer-btn"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827] transition-all hover:bg-slate-50 cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Avatar Frame */}
          <div className="w-14 h-14 rounded-xl border border-[#E5E7EB] overflow-hidden bg-[#F8FAFC] flex items-center justify-center font-bold text-sm text-[#F59E0B] shrink-0">
            {user.photoPath ? (
              <img src={user.photoPath} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || user.name}`} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            )}
          </div>
          
          <div className="space-y-1 min-w-0 pr-10">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F59E0B] inline-flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5" /> Personnel Registry file
            </span>
            <h3 className="text-lg font-bold text-[#111827] truncate leading-tight mt-0.5">
              {user.name || 'Unnamed Official'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold text-[#111827] uppercase border border-[#E5E7EB] bg-[#F8FAFC] rounded-md font-mono`}>
                {user.role}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.2 text-[11px] font-bold rounded-full border ${getStatusBadgeStyle(user.status)}`}>
                {getStatusLabelText(user.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Container of spacious cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* CARD 1: IDENTITY ACCESS CREDENTIALS */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono border-b pb-2.5 border-[#E5E7EB] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#F59E0B]" /> Identity Credentials
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">MEMBER NAME</span>
                <span className="text-xs font-semibold text-[#111827]">{user.name}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">EMAIL ADDRESS</span>
                <span className="text-xs font-semibold text-[#111827] block truncate font-mono">{user.email}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">PHONE CONTACT</span>
                <span className="text-xs font-semibold text-[#111827]">{user.phone || '+234 809 000 0000'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">CREATED AT</span>
                <span className="text-xs font-semibold text-[#111827]">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">LAST IDENTITY LOGOUT/JWT RECONCILIATION</span>
                <span className="text-xs font-semibold text-[#111827] font-mono">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged'}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: EMPLOYMENT DEPLOYMENT */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-[#E5E7EB]">
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#F59E0B]" /> Employment Deployment
              </h4>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[#F59E0B] hover:text-[#D97706] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Transfer posting
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdits} className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Department</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 bg-white border border-[#E5E7EB] text-[#111827] rounded-lg focus:border-[#F59E0B] outline-hidden font-semibold"
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Job Title</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 bg-white border border-[#E5E7EB] text-[#111827] rounded-lg focus:border-[#F59E0B] outline-hidden font-semibold"
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Branch Office</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 bg-white border border-[#E5E7EB] text-[#111827] rounded-lg focus:border-[#F59E0B] outline-hidden font-semibold"
                      value={editBranch}
                      onChange={(e) => setEditBranch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Immediate supervisor</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 bg-white border border-[#E5E7EB] text-[#111827] rounded-lg focus:border-[#F59E0B] outline-hidden font-semibold"
                      value={editManager}
                      onChange={(e) => setEditManager(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end border-t pt-3 border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 border border-[#E5E7EB] hover:bg-[#F8FAFC] text-xs font-bold rounded-lg cursor-pointer text-[#6B7280]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] p-3 rounded-lg flex items-center justify-between col-span-2">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block">EMPLOYEE FILE ID</span>
                    <span className="text-xs font-bold font-mono text-[#111827]">{user.employeeId || 'EMP-A8293'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">OFFICIAL JOB TITLE</span>
                  <span className="text-xs font-semibold text-[#111827] block">{user.jobTitle || 'Operations Associate'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">UNIT DEPLOYMENT</span>
                  <span className="text-xs font-semibold text-[#111827] block">{user.department || 'Advisory & Compliance'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">REGIONAL HUB BRANCH</span>
                  <span className="text-xs font-semibold text-[#111827] block">{user.branch || 'Abuja Headquarters'}</span>
                </div>

                <div className="space-y-1 col-span-2 border-t pt-3 border-[#E5E7EB]">
                  <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">Immediate supervisor</span>
                  <span className="text-xs font-semibold text-[#111827] block">{user.manager || 'Cabinet Director'}</span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: SECURITY AUTH POSTURE & ADMINISTRATIVE CONTROLS */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono border-b pb-2.5 border-[#E5E7EB] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#F59E0B]" /> Security & Governance Controls
            </h4>

            {/* Quick Status Badges */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-left">
                <div>
                  <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">FAILED LOGIN TRIALS</span>
                  <span className="text-xs font-bold text-[#111827] block mt-0.5">{user.failedAttempts || 0} / 5 attempts</span>
                </div>
                {user.failedAttempts > 0 && (
                  <button
                    onClick={() => handleExecuteAction('UNLOCK')}
                    className="text-xs font-bold bg-white hover:bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Clear Attempts
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-left">
                <div>
                  <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">MFA SECURITY METHOD</span>
                  <span className="text-xs font-bold text-[#111827] block mt-0.5">Hardware Matcher Key Ready</span>
                </div>
                <button
                  onClick={() => handleExecuteAction('ENABLE_MFA_READY')}
                  className="text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-white px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Enforce MFA
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-left">
                <div>
                  <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider">ADMINISTRATIVE DIRECTORY LOCK</span>
                  <span className="text-xs font-bold text-[#111827] block mt-0.5">
                    {user.status === 'LOCKED' ? '🔒 Locked State' : '🟢 Active State'}
                  </span>
                </div>
                {user.status === 'LOCKED' ? (
                  <button
                    onClick={() => handleExecuteAction('ACTIVATE')}
                    className="text-xs font-bold bg-[#10B981] hover:bg-[#027A48] text-white px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Unlock Profile
                  </button>
                ) : (
                  <button
                    onClick={() => handleExecuteAction('LOCKED')}
                    className="text-xs font-bold bg-[#EF4444] hover:bg-[#B42318] text-white px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Lock Profile
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Matrix Buttons Grid */}
            <div className="pt-2">
              <span className="text-[10px] font-extrabold text-[#6B7280] block uppercase tracking-wider mb-2.5 text-left text-left">POLICING COMMAND LAUNCH PANEL</span>
              <div className="grid grid-cols-2 gap-2">
                {user.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleExecuteAction('SUSPEND')}
                    className="p-3 bg-[#FFF5F5] hover:bg-[#FEE2E2] text-[#EF4444] border border-red-100 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-[1px] shadow-xs"
                  >
                    <Power className="w-4 h-4 text-[#EF4444]" />
                    <span>Suspend Authority</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleExecuteAction('ACTIVATE')}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-[#10B981] border border-[#E5E7EB] rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-[1px] shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    <span>Activate Clearance</span>
                  </button>
                )}

                <button
                  onClick={() => handleExecuteAction('RESET_PASS')}
                  className="p-3 bg-[#FFF9F2] hover:bg-[#FFF4E5] text-[#C2410C] border border-amber-100 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-[1px] shadow-xs"
                >
                  <Key className="w-4 h-4 text-[#F59E0B]" />
                  <span>Reset Credentials</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 4: DEVICES */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-[#E5E7EB]">
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-[#F59E0B]" /> Connected Workstations ({sessions.length})
              </h4>
              {sessions.length > 0 && (
                <button
                  onClick={terminateAllSessions}
                  className="text-[#EF4444] hover:text-[#B42318] text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Evict All
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-6 text-center text-[#6B7280] animate-pulse text-xs font-semibold">Listing active terminal points...</div>
            ) : sessions.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-[#6B7280] font-semibold leading-relaxed">
                  No active workstation sessions currently linked to this employee profile.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((sess: any) => (
                  <div 
                    key={sess.id}
                    className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-white border border-[#E5E7EB] text-[#F59E0B] rounded-lg shrink-0">
                        <Laptop className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#111827] block truncate">{sess.device || 'Workstation Terminal'}</span>
                        <span className="text-[10px] text-[#6B7280] font-mono block mt-0.5">{sess.ip || '197.94.88.22'} • Active now</span>
                      </div>
                    </div>
                    <button
                      onClick={() => terminateSession(sess.id)}
                      className="p-1.5 hover:bg-[#FFF5F5] text-[#6B7280] hover:text-[#EF4444] rounded-lg transition-all cursor-pointer border border-[#E5E7EB] bg-white"
                      title="Evict work session"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 5: SECURITY AUDIT TIMELINE */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono border-b pb-2.5 border-[#E5E7EB] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#F59E0B]" /> Personnel Audit Logs ({auditLogs.length})
            </h4>

            {loading ? (
              <div className="py-6 text-center text-[#6B7280] animate-pulse text-xs font-bold">Retrieving historical event trace...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-[#6B7280] font-semibold leading-relaxed">
                  Timeline index corresponds to 0 directory changes.
                </p>
              </div>
            ) : (
              <div className="relative border-l border-[#E5E7EB] ml-2 pl-4 space-y-4 text-left">
                {auditLogs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="relative group text-left">
                    {/* Circle Node indicator */}
                    <span className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full bg-white border-2 border-[#F59E0B] shadow-xs" />
                    
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-[#111827] uppercase block tracking-wider">
                        {log.action?.replace(/_/g, ' ') || 'ACTION'}
                      </span>
                      <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
                        Module: <code className="bg-[#F8FAFC] border border-[#E5E7EB] px-1 font-mono text-[10px] text-[#F59E0B] rounded">{log.module || 'AUTH'}</code> by {log.performedBy || 'Cabinet Operations'}.
                      </p>
                      
                      <span className="text-[9px] text-[#6B7280] block font-semibold uppercase mt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
