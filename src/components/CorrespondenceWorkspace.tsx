import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Inbox, 
  FileText, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  Sliders, 
  Search, 
  Plus, 
  Trash2, 
  Archive, 
  ChevronRight, 
  X, 
  CornerUpLeft, 
  ArrowRight, 
  RefreshCw,
  Eye,
  Check,
  AlertTriangle,
  User,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface CorrespondenceWorkspaceProps {
  globalDept: string;
  globalLoc: string;
}

export interface CorrespondenceItem {
  id: string;
  refNo: string;
  subject: string;
  sender: string;
  recipient: string;
  dispatchDate: string;
  direction: 'Incoming' | 'Outgoing' | 'Internal';
  classification: 'Urgent' | 'Confidential' | 'Routine';
  routingStatus: 'Received' | 'Logged' | 'Routing Assigned' | 'Processing' | 'Completed' | 'Archived';
  linkedDocketName?: string;
  timelineLogs: Array<{ status: string; date: string; details: string }>;
  emailHistory: Array<{ subject: string; body: string; date: string; recipient: string; sender: string }>;
}

const INITIAL_CORRESPONDENCE: CorrespondenceItem[] = [
  {
    id: "COR-2026-001",
    refNo: "FGN/MOT/COR-90382",
    subject: "Proposed Aviation Hanger Standard Operating Procedures",
    sender: "Director-General of Civil Aviation Authority",
    recipient: "Registry Operations Division Director",
    dispatchDate: "2026-06-10",
    direction: "Incoming",
    classification: "Urgent",
    routingStatus: "Processing",
    linkedDocketName: "Aviation_Hanger_SOP_v1.1.pdf",
    timelineLogs: [
      { status: "Received", date: "2026-06-10 09:15", details: "Physical hand-delivery log docket verified by Annex Registry clerk." },
      { status: "Logged", date: "2026-06-10 10:30", details: "Metadata catalog indexing completed. Clearance level tagged: Restricted." },
      { status: "Routing Assigned", date: "2026-06-10 11:45", details: "Assigned to Aviation Operations Unit for tech audit review." }
    ],
    emailHistory: []
  },
  {
    id: "COR-2026-002",
    refNo: "OOMS/PROC/CTR-88401",
    subject: "Certified Procurement Order Handoff - Customs Clearing",
    sender: "OOMS Logistics Desk Authority",
    recipient: "Comptroller General of Nigeria Customs Service",
    dispatchDate: "2026-06-08",
    direction: "Outgoing",
    classification: "Confidential",
    routingStatus: "Completed",
    linkedDocketName: "Customs_Clearance_Auth_2026.docx",
    timelineLogs: [
      { status: "Received", date: "2026-06-08 14:00", details: "File compilation approved for external transit dispatch." },
      { status: "Logged", date: "2026-06-08 14:45", details: "Outbound carrier tracking barcoded. Airway bill registered." },
      { status: "Completed", date: "2026-06-09 16:30", details: "Acknowledged receipt voucher uploaded back from customs registry." }
    ],
    emailHistory: [
      {
        subject: "Outbound Dispatch Notification: OOMS/PROC/CTR-88401",
        body: "Ref Customs Clearance: This email confirms transit delivery of certified procurement cargo manifests to Customs Office.",
        date: "2026-06-08 15:00",
        recipient: "customs-comptroller@customs.gov.ng",
        sender: "procurement-desk@ooms.gov.ng"
      }
    ]
  },
  {
    id: "COR-2026-003",
    refNo: "OOMS/FIN/CIR-1102",
    subject: "Mandatory Treasury Treasury Singe Account (TSA) Recalibration Circular",
    sender: "Director of Accounts (Finance)",
    recipient: "All Department Heads and Regional Supervisors",
    dispatchDate: "2026-06-11",
    direction: "Internal",
    classification: "Routine",
    routingStatus: "Logged",
    timelineLogs: [
      { status: "Received", date: "2026-06-11 08:30", details: "Circular drafted in sovereign central ledger." },
      { status: "Logged", date: "2026-06-11 09:00", details: "Broadcast routing list populated. Awaiting executive signature." }
    ],
    emailHistory: []
  }
];

export default function CorrespondenceWorkspace({ 
  globalDept, 
  globalLoc 
}: CorrespondenceWorkspaceProps) {
  
  // Channels navigation: all, incoming, outgoing, internal, pending_clearance, archived
  const [activeChannel, setActiveChannel] = useState<'all' | 'Incoming' | 'Outgoing' | 'Internal' | 'pending' | 'Archived'>('all');

  const [items, setItems] = useState<CorrespondenceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  
  // Selection details state
  const [selectedItem, setSelectedItem] = useState<CorrespondenceItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'timeline' | 'email'>('overview');

  // Intake QuickAdd module state
  const [intakeModalOpen, setIntakeModalOpen] = useState<boolean>(false);
  const [newDocket, setNewDocket] = useState({
    subject: '',
    sender: '',
    recipient: '',
    direction: 'Incoming' as 'Incoming' | 'Outgoing' | 'Internal',
    classification: 'Routine' as 'Urgent' | 'Confidential' | 'Routine',
    linkedDocketName: ''
  });

  // Resend Email composer state
  const [emailForm, setEmailForm] = useState({
    templateId: 'custom',
    recipient: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('ooms_correspondence_register');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      localStorage.setItem('ooms_correspondence_register', JSON.stringify(INITIAL_CORRESPONDENCE));
      setItems(INITIAL_CORRESPONDENCE);
    }
    setIsLoading(false);
  }, []);

  const persistItems = (newItems: CorrespondenceItem[]) => {
    localStorage.setItem('ooms_correspondence_register', JSON.stringify(newItems));
    setItems(newItems);
  };

  // Milestone triggers
  const triggerNextMilestone = (itemId: string) => {
    const nextMap: Record<CorrespondenceItem['routingStatus'], CorrespondenceItem['routingStatus']> = {
      'Received': 'Logged',
      'Logged': 'Routing Assigned',
      'Routing Assigned': 'Processing',
      'Processing': 'Completed',
      'Completed': 'Archived',
      'Archived': 'Archived'
    };

    const updated = items.map(p => {
      if (p.id === itemId) {
        const nextStatus = nextMap[p.routingStatus];
        return {
          ...p,
          routingStatus: nextStatus,
          timelineLogs: [
            ...p.timelineLogs,
            {
              status: nextStatus,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              details: `Sovereign timeline progression triggered milestone shift -> ${nextStatus}.`
            }
          ]
        };
      }
      return p;
    });

    persistItems(updated);
    toast.success(`Timeline escalated successfully to milestone status.`);
  };

  // Submit quick Intake form
  const handleAddIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocket.subject || !newDocket.sender || !newDocket.recipient) {
      toast.error('Specify all required fields for intake ledger entry.');
      return;
    }

    const uniqueId = `COR-2026-${String(items.length + 1).padStart(3, '0')}`;
    const randRef = `FGN/OOMS/Ref-${Math.floor(10000 + Math.random() * 90000)}`;

    const newItem: CorrespondenceItem = {
      id: uniqueId,
      refNo: randRef,
      subject: newDocket.subject,
      sender: newDocket.sender,
      recipient: newDocket.recipient,
      dispatchDate: new Date().toISOString().split('T')[0],
      direction: newDocket.direction,
      classification: newDocket.classification,
      routingStatus: 'Received',
      linkedDocketName: newDocket.linkedDocketName || undefined,
      timelineLogs: [
        {
          status: 'Received',
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          details: 'Initial intake logging completed successfully. Assigned base ledger ID.'
        }
      ],
      emailHistory: []
    };

    persistItems([newItem, ...items]);
    setIntakeModalOpen(false);
    setNewDocket({
      subject: '',
      sender: '',
      recipient: '',
      direction: 'Incoming',
      classification: 'Routine',
      linkedDocketName: ''
    });

    toast.success(`Ledger registered: Ref: ${randRef}`);
  };

  // Handle template selection change
  const handleTemplateSelection = (templateId: string) => {
    let sub = '';
    let body = '';
    const name = selectedItem ? selectedItem.sender : 'Stakeholder';

    if (templateId === 'clearance') {
      sub = `Compliance Clearance Docket Acknowledgment [Ref: ${selectedItem?.refNo || 'COR'}]`;
      body = `Dear Authority / DG,\n\nThis email confirms that your document package ("${selectedItem?.subject || 'Intake Docket'}") has successfully cleared administrative audit checks in our registry division.\n\nBest Regards,\nOperations Director.`;
    } else if (templateId === 'query') {
      sub = `Administrative Compliance Query: Ref ${selectedItem?.refNo || 'COR'}`;
      body = `Acknowledged Stakeholder,\n\nUpon reviewing your correspondence submission under Ref No ${selectedItem?.refNo}, our compliance desk notes missing signature seals on file "${selectedItem?.linkedDocketName || 'Primary Attachments'}". Please re-dispatch within 7-days.\n\nBest Regards,\nCompliance Officer.`;
    } else if (templateId === 'briefing') {
      sub = `Briefing Note Dispatch Circular: ${selectedItem?.refNo}`;
      body = `Supervisors and Managers,\n\nAttached find official circular details on treasury Single Account rules (Ref: ${selectedItem?.refNo}). Implementation compliance is mandatory before next quarterly financial brief.\n\nSincerely,\nDirector of Finance.`;
    }

    setEmailForm({
      templateId,
      recipient: selectedItem ? (selectedItem.direction === 'Incoming' ? 'sender@gov.ng' : 'recipient@gov.ng') : '',
      subject: sub,
      body: body
    });
  };

  // Send email simulation
  const handleTransmitMockEmail = () => {
    if (!selectedItem) return;
    if (!emailForm.recipient || !emailForm.subject || !emailForm.body) {
      toast.error('Form fields must not be blank.');
      return;
    }

    const updated = items.map(p => {
      if (p.id === selectedItem.id) {
        return {
          ...p,
          emailHistory: [
            ...p.emailHistory,
            {
              subject: emailForm.subject,
              body: emailForm.body,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              recipient: emailForm.recipient,
              sender: 'noreply@ooms-consults.gov.ng'
            }
          ]
        };
      }
      return p;
    });

    persistItems(updated);
    toast.success(`Resend Mailer: Dispatch handshake successful! Notification delivered to ${emailForm.recipient}`);
    setEmailForm({ templateId: 'custom', recipient: '', subject: '', body: '' });
  };

  const filteredItems = items.filter(p => {
    const matchesSearch = 
      p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.recipient.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClassification = !selectedClassification || p.classification === selectedClassification;

    let matchesChannel = true;
    if (activeChannel === 'Incoming' || activeChannel === 'Outgoing' || activeChannel === 'Internal') {
      matchesChannel = p.direction === activeChannel;
    } else if (activeChannel === 'pending') {
      matchesChannel = p.routingStatus !== 'Completed' && p.routingStatus !== 'Archived';
    } else if (activeChannel === 'Archived') {
      matchesChannel = p.routingStatus === 'Archived';
    }

    return matchesSearch && matchesClassification && matchesChannel;
  });

  // Math totals
  const totalCount = items.length;
  const urgentCount = items.filter(p => p.classification === 'Urgent').length;
  const pendingClearance = items.filter(p => p.routingStatus !== 'Completed' && p.routingStatus !== 'Archived').length;

  return (
    <div className="flex gap-6 min-h-[580px] bg-[#F8FAFC] select-none font-sans">
      
      {/* LEFT SUB-SIDEBAR (WIDTH 260PX) */}
      <div className="w-[260px] shrink-0 border border-[#E5E7EB] bg-[#0F172A] rounded-2xl p-4.5 text-left flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-3 select-none leading-none border-b border-slate-800 pb-4">
            <Mail className="w-5 h-5 text-[#F59E0B]" />
            <div className="text-left">
              <h3 className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest">Administrative</h3>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-0.5">Correspondence</h4>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: 'all', label: 'All Correspondence', icon: Inbox },
              { id: 'Incoming', label: 'Inbox Channel (In)', icon: Mail },
              { id: 'Outgoing', label: 'Dispatch Channel (Out)', icon: Send },
              { id: 'Internal', label: 'Internal Circulars', icon: RefreshCw },
              { id: 'pending', label: 'Clearance Queue', icon: Clock, badge: pendingClearance },
              { id: 'Archived', label: 'Archive Vault', icon: Archive }
            ].map((tab) => {
              const active = activeChannel === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveChannel(tab.id as any)}
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
                    <span className="px-1.5 py-0.5 rounded bg-[#F59E0B] text-slate-900 font-mono text-[8px] tracking-none font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ledger Signature */}
        <div className="px-3 py-2 border-t border-slate-800 pt-4 text-left leading-normal">
          <p className="text-[8.5px] font-mono font-bold text-slate-500 uppercase">Sovereign Portal</p>
          <p className="text-[8.5px] font-bold text-slate-350">Bhakor Consult Limited</p>
        </div>
      </div>

      {/* CORE CABINET WORKSPACE */}
      <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs p-6 overflow-hidden flex flex-col justify-between">
        
        {/* UPPER ROW ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div className="text-left">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
              {activeChannel === 'all' && 'Central Master Correspondence Ledger'}
              {activeChannel === 'Incoming' && 'Inbound Communications Intake Ledger'}
              {activeChannel === 'Outgoing' && 'Outbound Dispatched Mail Register'}
              {activeChannel === 'Internal' && 'Internal Departmental Circulars'}
              {activeChannel === 'pending' && 'Active Clearance Queue Operations'}
              {activeChannel === 'Archived' && 'Archived Permanent Cabinet Logs'}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Clearance Compliance Standard Framework
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIntakeModalOpen(true)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-transparent shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5 font-bold" />
              Ingress Docket Intake
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE FILTER STRIP */}
        <div className="flex flex-col sm:flex-row items-center gap-3 select-none text-left mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Query ledgers by Subject, Document Ref No, Sender, Recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl py-3 pl-11 pr-4 bg-slate-50 focus:bg-white border border-[#E5E7EB] focus:border-[#F59E0B] outline-hidden font-semibold transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto font-bold text-xs uppercase tracking-wider">
            <select 
              aria-label="Filter documents classification"
              value={selectedClassification} 
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="p-2.5 px-3 border border-slate-200 bg-white rounded-xl text-[10px] font-black cursor-pointer text-slate-700 outline-hidden"
            >
              <option value="">All Clearances</option>
              <option value="Urgent">Urgent priority</option>
              <option value="Confidential">Confidential restricted</option>
              <option value="Routine">Routine General</option>
            </select>
          </div>
        </div>

        {/* LEDGERS DATA TABLE */}
        <div className="flex-1 overflow-x-auto border border-[#E5E7EB] rounded-2xl bg-white max-h-[385px] overflow-y-auto">
          <table className="w-full text-[11px] text-left border-collapse select-none leading-normal">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E5E7EB] text-[9.5px] font-bold font-mono text-slate-450 uppercase select-none">
                <th className="p-3.5 pl-5 select-none">Docket Ref No</th>
                <th className="p-3.5 select-none">Subject Description</th>
                <th className="p-3.5 select-none">Sender / Recipient</th>
                <th className="p-3.5 select-none">Date Registered</th>
                <th className="p-3.5 select-none">Files Attached</th>
                <th className="p-3.5 select-none">Direction</th>
                <th className="p-3.5 select-none">Classification</th>
                <th className="p-3.5 pr-5 select-none text-right">Workflow Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center select-none text-slate-400">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-5 h-5 text-slate-400 animate-pulse" />
                    </div>
                    <p className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">No correspondence matches filters</p>
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold">Alter channel registers or seek other query descriptors.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr 
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setDrawerOpen(true);
                      setDrawerTab('overview');
                    }}
                    className="hover:bg-[#FFF7ED] transition-all border-b border-slate-100 last:border-b-0 cursor-pointer group hover:border-l-4 hover:border-l-[#F59E0B]"
                  >
                    <td className="p-4 pl-5 group-hover:pl-4 font-mono font-bold text-slate-600 transition-all">
                      {item.refNo}
                    </td>

                    <td className="p-4 text-left max-w-[210px] truncate">
                      <span className="font-extrabold text-slate-800 block truncate group-hover:text-slate-900" title={item.subject}>
                        {item.subject}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-semibold font-mono block mt-0.5">{item.id}</span>
                    </td>

                    <td className="p-4 text-left">
                      <div className="font-semibold text-slate-700 block truncate max-w-[150px]">
                        <span className="text-[9.5px] text-slate-400 font-mono block uppercase">From:</span> {item.sender}
                      </div>
                      <div className="font-semibold text-slate-500 block truncate max-w-[150px] mt-0.5">
                        <span className="text-[9.5px] text-slate-400 font-mono block uppercase">To:</span> {item.recipient}
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-500 font-bold">
                      {item.dispatchDate}
                    </td>

                    <td className="p-4 text-left font-mono font-semibold text-slate-655 truncate max-w-[120px]">
                      {item.linkedDocketName ? (
                        <span className="flex items-center gap-1 text-[#F59E0B]" title={item.linkedDocketName}>
                          <FileText className="w-3 h-3 text-[#F59E0B] shrink-0" />
                          <span className="underline">{item.linkedDocketName.slice(0, 18)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-350 italic">None</span>
                      )}
                    </td>

                    <td className="p-4 font-black uppercase text-[10px]">
                      <span className={`px-2 py-0.5 rounded ${
                        item.direction === 'Incoming' ? 'bg-[#FFF7ED] text-[#D97706]' : item.direction === 'Outgoing' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {item.direction}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                        item.classification === 'Urgent' 
                          ? 'bg-rose-50 text-rose-700 border-rose-100 font-black' 
                          : item.classification === 'Confidential' 
                          ? 'bg-slate-900 text-white border-slate-900 font-black' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {item.classification}
                      </span>
                    </td>

                    <td className="p-4 pr-5 text-right">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-705">
                        {item.routingStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[9.5px] text-slate-450 font-black uppercase font-mono text-left leading-none mt-2.5">
          CENTRAL CORRESPONDENCE PLATFORM REGISTER • CLICK RECORD ROW TO SUMMON INTEGRATED EMAIL RESEND CONTROL ROOM
        </p>
      </div>

      {/* 420PX SLIDE OUT RIGHT DRAWER */}
      {drawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="w-[420px] bg-white h-full border-l p-6 shadow-2xl flex flex-col justify-between text-left animate-in slide-in-from-right duration-200">
            
            {/* Drawer upper brand */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 leading-none select-none">
              <div className="text-left">
                <h3 className="text-[10px] font-black uppercase text-[#F59E0B] font-mono tracking-widest">{selectedItem.refNo}</h3>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mt-1 truncate max-w-[280px]">
                  {selectedItem.subject}
                </h4>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)} 
                className="p-1 px-1.5 rounded bg-slate-50 hover:bg-slate-100 border text-slate-500 cursor-pointer text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtabs selectors */}
            <div className="flex items-center gap-1 border-b pb-2 mb-4 text-[10px] font-mono font-black uppercase overflow-x-auto select-none">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'timeline', label: 'Milestone Timeline' },
                { id: 'email', label: 'SMTP mail integration' }
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

            {/* TAB PANELS */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Drawer tab A: Overview */}
              {drawerTab === 'overview' && (
                <div className="space-y-4 select-none leading-normal">
                  <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Docket ledger ID</span>
                      <span className="font-bold text-slate-750 font-mono">{selectedItem.id}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Date Dispatched</span>
                      <span className="font-mono font-bold text-slate-650">{selectedItem.dispatchDate}</span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Sender Source</span>
                      <span className="font-extrabold text-slate-805 text-right font-sans">{selectedItem.sender}</span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Recipient Entity</span>
                      <span className="font-extrabold text-slate-605 text-right font-sans">{selectedItem.recipient}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Classification</span>
                      <span className="font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded font-mono uppercase text-[9.5px] border border-amber-205">{selectedItem.classification}</span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2.5 mt-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Linked file attachments</span>
                      {selectedItem.linkedDocketName ? (
                        <span className="flex items-center gap-1 text-[#F59E0B] font-mono font-bold">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="underline">{selectedItem.linkedDocketName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No attachments bound</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Drawer tab B: Timeline logs tracking */}
              {drawerTab === 'timeline' && (
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">State machine milestones</span>
                  
                  <div className="relative border-l-2 pl-4 ml-2.5 space-y-4 text-left font-sans select-none pb-4">
                    {selectedItem.timelineLogs.map((log, i) => (
                      <div key={i} className="relative">
                        {/* Circle dot */}
                        <span className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-[#F59E0B] border-2 border-white"></span>
                        
                        <div className="text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-black uppercase text-[#0F172A] tracking-wider font-mono text-[9.5px]">{log.status}</span>
                            <span className="text-[9px] text-slate-450 font-mono font-bold">{log.date}</span>
                          </div>
                          <p className="text-slate-550 leading-relaxed font-semibold mt-1">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedItem.routingStatus !== 'Completed' && selectedItem.routingStatus !== 'Archived' && (
                    <div className="pt-3 border-t">
                      <p className="text-[10px] text-slate-450 font-semibold mb-2 leading-tight">Elevate docket to next sovereign step block channel:</p>
                      <button 
                        onClick={() => triggerNextMilestone(selectedItem.id)}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] uppercase font-mono font-black tracking-wider text-center cursor-pointer"
                      >
                        Authorize Milestone Escalation Stage
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Drawer tab C: SMTP Mail Composer */}
              {drawerTab === 'email' && (
                <div className="space-y-4">
                  <div className="border border-indigo-200 p-2.5 bg-indigo-50/40 rounded-xl leading-relaxed text-indigo-805 select-none font-medium text-[10px]">
                    Integrated Resend Mailer Provider. Sending drafts triggers physical outbound delivery & logs thread history record below.
                  </div>

                  {/* Template choices */}
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Template Preset</label>
                    <select 
                      onChange={(e) => handleTemplateSelection(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-xl cursor-not-allowed outline-hidden cursor-pointer"
                    >
                      <option value="custom">Standard Blank Compose</option>
                      <option value="clearance">Docket Ingress Clearance Receipt</option>
                      <option value="query">Compliance Query Form</option>
                      <option value="briefing">Departmental Briefing Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Recipient email</label>
                    <input 
                      type="text" 
                      placeholder="e.g. state-clerk@customs.gov.ng"
                      value={emailForm.recipient}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, recipient: e.target.value }))}
                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-xl outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Email Subject Title</label>
                    <input 
                      type="text" 
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-xl outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Email Body Text</label>
                    <textarea 
                      rows={4}
                      value={emailForm.body}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                      className="w-full p-2 bg-slate-50 border border-slate-150 rounded-xl outline-hidden resize-none font-mono text-[10px]"
                    />
                  </div>

                  <button 
                    onClick={handleTransmitMockEmail}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-center cursor-pointer"
                  >
                    Transmit Email via Resend
                  </button>

                  {/* Mailbox Thread History records */}
                  {selectedItem.emailHistory.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">mailer threads ledger ({selectedItem.emailHistory.length} dispatched)</span>
                      {selectedItem.emailHistory.map((mail, idx) => (
                        <div key={idx} className="p-2.5 border rounded-lg bg-emerald-50/30 text-[10.5px]">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800">To: {mail.recipient}</span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold">{mail.date}</span>
                          </div>
                          <span className="text-[9.5px] font-bold block mt-1 underline">Sub: {mail.subject}</span>
                          <p className="text-slate-550 leading-relaxed font-semibold mt-1 whitespace-pre-wrap">{mail.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Quick close buttons */}
            <div className="border-t border-slate-100 pt-4 mt-4 text-[10px] font-mono font-black uppercase">
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl cursor-pointer text-center"
              >
                Close Cabinet Desk
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUICK INTAKE Modal dialogue */}
      {intakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs">
          <form onSubmit={handleAddIntake} className="bg-white border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left font-sans text-xs">
            
            <div className="flex items-center justify-between border-b pb-2 mb-2 leading-none">
              <div className="text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">DMS Compliance Intake Channel</h3>
                <h4 className="text-sm font-extrabold text-[#0F172A] mt-0.5">INGRESS CORRESPONDENCE INTAKE LEDGER</h4>
              </div>
              <button type="button" onClick={() => setIntakeModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-left text-xs">
              <div>
                <label className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block mb-1">Subject Description</label>
                <input
                  type="text"
                  placeholder="e.g. Aviation Hanger SOP & Tech Audit Briefs"
                  value={newDocket.subject}
                  onChange={(e) => setNewDocket(p => ({ ...p, subject: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block mb-1">Sender Entity</label>
                <input
                  type="text"
                  placeholder="e.g. Ministry of Aviation Director General"
                  value={newDocket.sender}
                  onChange={(e) => setNewDocket(p => ({ ...p, sender: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block mb-1">Recipient Entity</label>
                <input
                  type="text"
                  placeholder="e.g. Operations Registry annex clerk"
                  value={newDocket.recipient}
                  onChange={(e) => setNewDocket(p => ({ ...p, recipient: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block mb-1">Direction</label>
                  <select
                    value={newDocket.direction}
                    onChange={(e: any) => setNewDocket(p => ({ ...p, direction: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 cursor-pointer outline-hidden"
                  >
                    <option value="Incoming">Incoming Inbound</option>
                    <option value="Outgoing">Outgoing Dispatch</option>
                    <option value="Internal">Internal Circular</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block mb-1">Classification clearance</label>
                  <select
                    value={newDocket.classification}
                    onChange={(e: any) => setNewDocket(p => ({ ...p, classification: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 cursor-pointer outline-hidden"
                  >
                    <option value="Routine">Routine Regular</option>
                    <option value="Confidential">Confidential Restricted</option>
                    <option value="Urgent">Urgent priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9.5px] uppercase font-bold text-slate-400 font-mono block mb-1">Optional Linked File docket Name</label>
                <input
                  type="text"
                  placeholder="e.g. Contract_Proposal_v2.pdf"
                  value={newDocket.linkedDocketName}
                  onChange={(e) => setNewDocket(p => ({ ...p, linkedDocketName: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-[10px] font-mono font-black pt-2 border-t uppercase">
              <button type="button" onClick={() => setIntakeModalOpen(false)} className="p-2.5 px-4 bg-white hover:bg-slate-50 border rounded-xl text-slate-500 cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="p-2.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl shadow-xs cursor-pointer">
                Commit intake record
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
