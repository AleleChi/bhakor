import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  RefreshCw, 
  Plus, 
  X, 
  Trash2, 
  FolderPlus, 
  Folder, 
  FileText, 
  Download, 
  Filter, 
  Eye, 
  Share2, 
  History, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  MoreHorizontal, 
  Sliders, 
  User, 
  AlertTriangle,
  Archive,
  Tag,
  BookOpen,
  Send,
  Workflow,
  Unlock,
  ShieldAlert,
  Edit2,
  UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { documentStorage, StorageMetadata } from '../lib/storageService';
import { API_URL } from '../lib/api';

interface FolderItem {
  id: string;
  name: string;
  isArchived: boolean;
}

interface DMSDocument {
  id: string;
  fileName: string;
  sizeKb: number;
  category: string; // Document Type
  classification: 'Public' | 'Internal' | 'Restricted' | 'Confidential';
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Archived';
  uploadedBy: string;
  uploadedAt: string;
  modifiedAt: string;
  description: string;
  tags: string[];
  owner: string;
  retentionPeriod: string;
  documentNumber: string;
  referenceNumber: string;
  version: string;
  folderId?: string;
  versionsList: Array<{
    version: string;
    uploadedBy: string;
    timestamp: string;
    changeNote: string;
  }>;
  workflowSteps: Array<{
    step: string;
    actor: string;
    role: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Skipped';
    timestamp?: string;
    comments?: string;
  }>;
  permissions: {
    view: string[];
    edit: string[];
    download: string[];
    approve: string[];
    delete: string[];
  };
}

export interface QueuedUpload {
  id: string;
  file: File;
  name: string;
  sizeKb: number;
  progress: number;
  status: 'Queued' | 'Uploading' | 'Completed' | 'Failed' | 'DuplicateDetected';
  errorMessage?: string;
  category: string;
  classification: 'Public' | 'Internal' | 'Restricted' | 'Confidential';
  retentionPeriod: string;
  owner: string;
  duplicateAction?: 'replace' | 'keep' | 'version';
  duplicateChoiceMade?: boolean;
}

interface DocumentWorkspaceProps {
  globalDept?: string;
  globalLoc?: string;
  onTriggerQuickAdd?: (mod: string) => void;
}

export default function DocumentWorkspace({ globalDept = '', globalLoc = '' }: DocumentWorkspaceProps) {
  // DB & State lists
  const [documents, setDocuments] = useState<DMSDocument[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  
  // Folders lists
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeNavSection, setActiveNavSection] = useState<string>('all'); // all, recent, favorites, shared, pending_approval, approved, archived, trash, folder

  // Filtering + Searching States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>(globalDept);
  const [selectedType, setSelectedType] = useState<string>(''); // Contract, Invoice, Policy, Manual, Confidential
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');

  // Table Sorting State
  const [sortBy, setSortBy] = useState<string>('fileName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-Selection State (Bulk Operations)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'move' | 'archive' | 'delete' | 'download' | 'assign' | 'approve' | null>(null);
  const [bulkTargetFolderId, setBulkTargetFolderId] = useState<string>('');
  const [bulkTargetDept, setBulkTargetDept] = useState<string>('');

  // Selected document context
  const [selectedDoc, setSelectedDoc] = useState<DMSDocument | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'activity' | 'versions' | 'permissions'>('overview');

  // Preview options
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewRotation, setPreviewRotation] = useState<number>(0);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [maxPreviewPages, setMaxPreviewPages] = useState<number>(3);

  // Folder management modals
  const [folderModal, setFolderModal] = useState<{ type: 'create' | 'rename' | 'move' | 'archive' | null; folderId?: string }>({ type: null });
  const [folderInputName, setFolderInputName] = useState<string>('');

  // Upload modal / Add Document
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Contract',
    classification: 'Internal' as any,
    department: 'Operations',
    tags: '',
    retentionPeriod: '7 Years',
    owner: 'Yusuf Musa'
  });
  const [uploadQueue, setUploadQueue] = useState<QueuedUpload[]>([]);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Seed check and database sync
  useEffect(() => {
    syncWithDatabase();
    loadFolders();
  }, []);

  const loadFolders = () => {
    const rawFolders = localStorage.getItem('ooms_dms_folders');
    if (rawFolders) {
      setFolders(JSON.parse(rawFolders));
    } else {
      const defaultFolders: FolderItem[] = [
        { id: 'f-hr', name: 'Human Resources', isArchived: false },
        { id: 'f-finance', name: 'Finance', isArchived: false },
        { id: 'f-ops', name: 'Operations', isArchived: false },
        { id: 'f-proc', name: 'Procurement', isArchived: false },
        { id: 'f-legal', name: 'Legal', isArchived: false },
        { id: 'f-projects', name: 'Projects', isArchived: false },
      ];
      localStorage.setItem('ooms_dms_folders', JSON.stringify(defaultFolders));
      setFolders(defaultFolders);
    }
  };

  const syncWithDatabase = async () => {
    setDbLoading(true);
    try {
      const query = new URLSearchParams({
        module: 'Documents',
        page: '1',
        limit: '100', // Fetch substantial records to overlay DMS features
      });
      const token = localStorage.getItem('ooms_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_URL}/api/list?${query.toString()}`, { headers });
      const apiResult = await res.json();
      const dbRows = apiResult.data || [];

      // Enumerate client-enriched records from localStore
      const localMetadataStore = localStorage.getItem('ooms_dms_meta');
      const docMetadataMap = localMetadataStore ? JSON.parse(localMetadataStore) : {};

      const mergedDocs: DMSDocument[] = dbRows.map((r: any) => {
        const localMeta = docMetadataMap[r.id] || {};
        
        return {
          id: r.id,
          fileName: r.fileName,
          sizeKb: r.sizeKb,
          category: r.category || 'Contract',
          classification: r.classification || 'Internal',
          status: localMeta.status || (r.status === 'Approved' ? 'Approved' : r.status === 'Pending Review' ? 'Under Review' : 'Draft'),
          uploadedBy: r.uploadedBy || 'Yusuf Musa',
          uploadedAt: r.uploadedAt || new Date().toISOString(),
          modifiedAt: localMeta.modifiedAt || r.uploadedAt || new Date().toISOString(),
          description: localMeta.description || 'Enterprise compliance governance artifact for corporate oversight validation.',
          tags: localMeta.tags || [r.category || 'Compliance', 'Audit', 'OOMS'],
          owner: localMeta.owner || r.uploadedBy || 'Yusuf Musa',
          retentionPeriod: localMeta.retentionPeriod || '7 Years',
          documentNumber: localMeta.documentNumber || `OOMS-DMS-${r.id.substring(0, 6).toUpperCase()}`,
          referenceNumber: localMeta.referenceNumber || `REF-NG-${Math.floor(Math.random() * 90000 + 10000)}`,
          version: localMeta.version || 'v1.0',
          folderId: localMeta.folderId || resolveDefaultFolder(r.category),
          versionsList: localMeta.versionsList || [
            { version: 'v1.0', uploadedBy: r.uploadedBy || 'Yusuf Musa', timestamp: r.uploadedAt || new Date().toISOString(), changeNote: 'Initial automated ingestion.' }
          ],
          workflowSteps: localMeta.workflowSteps || [
            { step: 'Officer Scan', actor: r.uploadedBy || 'Yusuf Musa', role: 'Ingress Operator', status: 'Approved', timestamp: r.uploadedAt, comments: 'Checks completed.' },
            { step: 'Manager Signoff', actor: 'Aisha Lawal', role: 'Unit Manager', status: 'Approved', timestamp: r.uploadedAt, comments: 'Compliance nominal.' },
            { step: 'Director Verification', actor: 'Director-General', role: 'Sovereign Registrar', status: localMeta.status === 'Approved' ? 'Approved' : 'Pending', comments: 'Final authorization docket.' }
          ],
          permissions: localMeta.permissions || {
            view: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OFFICER', 'VIEWER'],
            edit: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
            download: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OFFICER'],
            approve: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
            delete: ['SUPER_ADMIN', 'ADMIN']
          }
        };
      });

      setDocuments(mergedDocs);
    } catch (err) {
      console.error('Failed syncing OOMS DMS records:', err);
      toast.info('Synchronizing Document Repository... Offline mode is available and fully active.');
    } finally {
      setDbLoading(false);
    }
  };

  const resolveDefaultFolder = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('policy')) return 'f-hr';
    if (c.includes('invoice')) return 'f-finance';
    if (c.includes('contract')) return 'f-legal';
    if (c.includes('manual')) return 'f-projects';
    return 'f-ops';
  };

  const persistMetadata = (updatedDocs: DMSDocument[]) => {
    // Write enriched fields back to local storage representation
    const metaMap: Record<string, any> = {};
    updatedDocs.forEach(d => {
      metaMap[d.id] = {
        status: d.status,
        modifiedAt: d.modifiedAt,
        description: d.description,
        tags: d.tags,
        owner: d.owner,
        retentionPeriod: d.retentionPeriod,
        documentNumber: d.documentNumber,
        referenceNumber: d.referenceNumber,
        version: d.version,
        folderId: d.folderId,
        versionsList: d.versionsList,
        workflowSteps: d.workflowSteps,
        permissions: d.permissions
      };
    });
    localStorage.setItem('ooms_dms_meta', JSON.stringify(metaMap));
    setDocuments(updatedDocs);
  };

  const syncDocumentActivityBackToAudits = async (action: string, doc: DMSDocument, remarks = '') => {
    try {
      const token = localStorage.getItem('ooms_token');
      // Push transition step/audit to database
      await fetch(`${API_URL}/api/registry/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleName: 'Documents',
          id: doc.id,
          status: doc.status === 'Approved' ? 'APPROVED' : doc.status === 'Under Review' ? 'REVIEW' : 'DRAFT',
          remarks: `${action} complete on "${doc.fileName}". ${remarks}`
        })
      });
    } catch (e) {
      console.warn('Silent fallback for audit logs:', e);
    }
  };

  // Drag and Drop Handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const checkFileValidation = (file: File): { valid: boolean; error?: string } => {
    const allowedExtensions = ['pdf', 'docx', 'xlsx', 'jpg', 'png', 'txt'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      return { valid: false, error: 'Format not supported. (Allowed: PDF, DOCX, XLSX, JPG, PNG, TXT)' };
    }
    const maxSize = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File exceeds 25 MB upload limit.' };
    }
    return { valid: true };
  };

  const addFilesToQueue = (files: FileList) => {
    const newItems: QueuedUpload[] = [];
    let bulkSizeSum = 0;
    
    // Calculate current queue sizes + incoming
    const currentQueueSum = uploadQueue.reduce((acc, item) => acc + (item.file.size), 0);
    for (let i = 0; i < files.length; i++) {
      bulkSizeSum += files[i].size;
    }

    if (currentQueueSum + bulkSizeSum > 250 * 1024 * 1024) {
      toast.error('Bulk Limit: Total queued size would exceed the 250 MB bulk limit.');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = checkFileValidation(file);
      
      const isDuplicate = documents.some(
        doc => doc.fileName.toLowerCase() === file.name.toLowerCase()
      );

      const newItem: QueuedUpload = {
        id: `q-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        name: file.name,
        sizeKb: Math.ceil(file.size / 1024),
        progress: 0,
        status: validation.valid ? (isDuplicate ? 'DuplicateDetected' : 'Queued') : 'Failed',
        errorMessage: validation.error,
        category: uploadForm.category,
        classification: uploadForm.classification,
        retentionPeriod: uploadForm.retentionPeriod,
        owner: uploadForm.owner
      };
      newItems.push(newItem);
    }
    setUploadQueue(prev => [...prev, ...newItems]);
    setUploadModalOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  // Launch single file upload from queue
  const processSingleQueueUpload = async (queueId: string, customAction?: 'replace' | 'keep' | 'version') => {
    const token = localStorage.getItem('ooms_token');
    
    // Find target queued item
    const qItem = uploadQueue.find(q => q.id === queueId);
    if (!qItem) return;

    // Set uploading status
    setUploadQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'Uploading', progress: 5 } : q));

    // Ref to mock progress ticks
    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 15;
      if (currentProgress >= 95) {
        currentProgress = 95;
        clearInterval(interval);
      }
      setUploadQueue(prev => prev.map(q => q.id === queueId && q.status === 'Uploading' ? { ...q, progress: currentProgress } : q));
    }, 150);

    try {
      // 1. Storage Provider upload pipeline
      const meta: StorageMetadata = {
        fileName: qItem.file.name,
        sizeKb: qItem.sizeKb,
        contentType: qItem.file.type || 'application/pdf',
        uploadedBy: qItem.owner,
        timestamp: new Date().toISOString()
      };
      await documentStorage.uploadDocument(qItem.file, meta);

      clearInterval(interval);

      // Handle custom action (Duplicate options)
      let finalDocId = `db-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      let finalFileName = qItem.name;

      // Check if duplicate is inside index
      const existingDoc = documents.find(d => d.fileName.toLowerCase() === qItem.name.toLowerCase());

      if (existingDoc && customAction === 'version') {
        // Option 1: Create New Version
        let nextVer = 'v1.1';
        if (existingDoc.version && existingDoc.version.startsWith('v')) {
          const verFloat = parseFloat(existingDoc.version.substring(1));
          if (!isNaN(verFloat)) {
            nextVer = `v${(verFloat + 0.1).toFixed(1)}`;
          }
        }

        const newVersionBlock = {
          version: nextVer,
          uploadedBy: qItem.owner,
          timestamp: new Date().toISOString(),
          changeNote: `Ingested new version via upload queue governance.`
        };

        const updatedDocs = documents.map(d => {
          if (d.id === existingDoc.id) {
            return {
              ...d,
              version: nextVer,
              sizeKb: qItem.sizeKb,
              modifiedAt: new Date().toISOString(),
              versionsList: [...d.versionsList, newVersionBlock]
            };
          }
          return d;
        });

        persistMetadata(updatedDocs);
        await syncDocumentActivityBackToAudits('VERSION_CREATION', existingDoc, `Bunched document version successfully to ${nextVer}.`);
        toast.success(`"${qItem.file.name}" uploaded. Registered new version ${nextVer} inside standard index.`);
      } else if (existingDoc && customAction === 'replace') {
        // Option 2: Replace Existing
        const updatedDocs = documents.map(d => {
          if (d.id === existingDoc.id) {
            return {
              ...d,
              sizeKb: qItem.sizeKb,
              modifiedAt: new Date().toISOString(),
              uploadedBy: qItem.owner,
              versionsList: [
                ...d.versionsList,
                { version: d.version, uploadedBy: qItem.owner, timestamp: new Date().toISOString(), changeNote: 'Replaced original file buffer.' }
              ]
            };
          }
          return d;
        });

        persistMetadata(updatedDocs);
        await syncDocumentActivityBackToAudits('EDIT', existingDoc, `Replaced file buffer contents: size updated.`);
        toast.info(`"${qItem.file.name}" uploaded. Replaced existing file buffer.`);
      } else {
        // Option 3: Keep Both (or new files with no duplicates)
        if (existingDoc && customAction === 'keep') {
          const baseName = qItem.name.substring(0, qItem.name.lastIndexOf('.')) || qItem.name;
          const ext = qItem.name.split('.').pop() || '';
          finalFileName = `${baseName} (Copy).${ext}`;
        }

        // Insert to NestJS database standard API
        const res = await fetch(`${API_URL}/api/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            moduleName: 'Documents',
            payload: {
              fileName: finalFileName,
              sizeKb: qItem.sizeKb,
              category: qItem.category,
              classification: qItem.classification
            }
          })
        });

        if (res.ok) {
          const result = await res.json();
          finalDocId = result.item.id;
        }

        const newDMS: DMSDocument = {
          id: finalDocId,
          fileName: finalFileName,
          sizeKb: qItem.sizeKb,
          category: qItem.category,
          classification: qItem.classification,
          status: 'Draft',
          uploadedBy: qItem.owner,
          uploadedAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          description: `Enterprise Compliance Artifact: ${qItem.name} uploaded successfully via ${documentStorage.activeProvider?.name || 'Local DMS'}.`,
          tags: [qItem.category, 'Manual', 'Ledger'],
          owner: qItem.owner,
          retentionPeriod: qItem.retentionPeriod,
          documentNumber: `OOMS-DMS-${finalDocId.substring(0, 6).toUpperCase()}`,
          referenceNumber: `REF-NG-${Math.floor(Math.random() * 90000 + 10000)}`,
          version: 'v1.0',
          folderId: selectedFolderId || resolveDefaultFolder(qItem.category),
          versionsList: [
            { version: 'v1.0', uploadedBy: qItem.owner, timestamp: new Date().toISOString(), changeNote: 'Initial automated ingestion.' }
          ],
          workflowSteps: [
            { step: 'Officer Ingest', actor: qItem.owner, role: 'Operator Ingress', status: 'Approved', timestamp: new Date().toISOString(), comments: 'Initial lock checked OK.' },
            { step: 'Unit Supervisor Sign', actor: 'Aisha Lawal', role: 'Unit Manager', status: 'Pending', comments: 'Pending manager verification.' },
            { step: 'Registry DG Seal', actor: 'Director-General', role: 'Clearance Supervisor', status: 'Pending', comments: 'Pending sovereign seal.' }
          ],
          permissions: {
            view: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OFFICER', 'VIEWER'],
            edit: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
            download: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OFFICER'],
            approve: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
            delete: ['SUPER_ADMIN', 'ADMIN']
          }
        };

        const updated = [newDMS, ...documents];
        setDocuments(updated);

        // Update metadata storage
        const localMetadataStore = localStorage.getItem('ooms_dms_meta');
        const docMetadataMap = localMetadataStore ? JSON.parse(localMetadataStore) : {};
        docMetadataMap[finalDocId] = {
          status: newDMS.status,
          modifiedAt: newDMS.modifiedAt,
          description: newDMS.description,
          tags: newDMS.tags,
          owner: newDMS.owner,
          retentionPeriod: newDMS.retentionPeriod,
          documentNumber: newDMS.documentNumber,
          referenceNumber: newDMS.referenceNumber,
          version: newDMS.version,
          folderId: newDMS.folderId,
          versionsList: newDMS.versionsList,
          workflowSteps: newDMS.workflowSteps,
          permissions: newDMS.permissions
        };
        localStorage.setItem('ooms_dms_meta', JSON.stringify(docMetadataMap));

        await syncDocumentActivityBackToAudits('UPLOAD', newDMS, 'Ingested corporate file.');
      }

      setUploadQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'Completed', progress: 100 } : q));
    } catch (e: any) {
      clearInterval(interval);
      setUploadQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'Failed', progress: 100, errorMessage: e.message || 'File upload failed.' } : q));
      toast.error(`"${qItem.file.name}" upload failed: ${e.message || 'Storage handshake rejected.'}`);
    }
  };

  const launchAllQueuedUploads = () => {
    const pendingItems = uploadQueue.filter(q => q.status === 'Queued');
    if (pendingItems.length === 0) {
      toast.info('No pending queue items to upload. Resolve duplicates or add files.');
      return;
    }
    pendingItems.forEach(item => {
      processSingleQueueUpload(item.id);
    });
  };

  // Folder Operations
  const executeFolderAction = () => {
    if (!folderInputName.trim() && folderModal.type !== 'archive' && folderModal.type !== 'move') return;

    let updated = [...folders];
    let alertMsg = '';

    if (folderModal.type === 'create') {
      const newFolder: FolderItem = {
        id: `f-${Date.now()}`,
        name: folderInputName.trim(),
        isArchived: false
      };
      updated.push(newFolder);
      alertMsg = `Folder "${newFolder.name}" successfully established.`;
    } else if (folderModal.type === 'rename' && folderModal.folderId) {
      updated = updated.map(f => f.id === folderModal.folderId ? { ...f, name: folderInputName.trim() } : f);
      alertMsg = `Folder renamed to "${folderInputName.trim()}" successfully.`;
    } else if (folderModal.type === 'archive' && folderModal.folderId) {
      updated = updated.map(f => f.id === folderModal.folderId ? { ...f, isArchived: true } : f);
      alertMsg = `Folder archived successfully.`;
    }

    localStorage.setItem('ooms_dms_folders', JSON.stringify(updated));
    setFolders(updated);
    setFolderInputName('');
    setFolderModal({ type: null });
    toast.success(alertMsg);
  };

  // Workflow transitions
  const transitionDocumentWorkflow = async (targetStatus: any, comments = '') => {
    if (!selectedDoc) return;

    let updatedSteps = [...selectedDoc.workflowSteps];
    const userRole = 'MANAGER'; // Simulated role based on general context
    const actorName = 'Alex Rivera';

    // Update workflow timeline and statuses block
    if (targetStatus === 'Approved') {
      updatedSteps = updatedSteps.map(step => {
        if (step.role.toLowerCase().includes('manager') || step.role.toLowerCase().includes('director')) {
          return { ...step, status: 'Approved', timestamp: new Date().toISOString(), comments: comments || 'Nominal clearance verified.' };
        }
        return step;
      });
    } else if (targetStatus === 'Rejected') {
      updatedSteps = updatedSteps.map(step => {
        if (step.role.toLowerCase().includes('manager') || step.role.toLowerCase().includes('director')) {
          return { ...step, status: 'Rejected', timestamp: new Date().toISOString(), comments: comments || 'Revision suggested on draft.' };
        }
        return step;
      });
    }

    const updatedDoc: DMSDocument = {
      ...selectedDoc,
      status: targetStatus,
      modifiedAt: new Date().toISOString(),
      workflowSteps: updatedSteps
    };

    const nextList = documents.map(d => d.id === selectedDoc.id ? updatedDoc : d);
    persistMetadata(nextList);
    setSelectedDoc(updatedDoc);
    await syncDocumentActivityBackToAudits('TRANSITION', updatedDoc, `New state: ${targetStatus}. Comments: ${comments}`);
    toast.success(`Document transitioned to [${targetStatus}] status.`);
  };

  // Add new version
  const uploadNewDocumentVersion = async (file: File, changeNote: string) => {
    if (!selectedDoc) return;
    try {
      const nextMajor = (parseFloat(selectedDoc.version.replace('v', '')) + 0.1).toFixed(1);
      const newVerStr = `v${nextMajor}`;

      const meta: StorageMetadata = {
        fileName: file.name,
        sizeKb: Math.ceil(file.size / 1024),
        contentType: file.type || 'application/pdf',
        uploadedBy: 'Alex Rivera',
        timestamp: new Date().toISOString()
      };
      await documentStorage.uploadDocument(file, meta);

      const newVersions = [
        ...selectedDoc.versionsList,
        { version: newVerStr, uploadedBy: 'Alex Rivera', timestamp: new Date().toISOString(), changeNote }
      ];

      const updatedDoc: DMSDocument = {
        ...selectedDoc,
        fileName: file.name,
        sizeKb: Math.ceil(file.size / 1024),
        version: newVerStr,
        modifiedAt: new Date().toISOString(),
        versionsList: newVersions
      };

      const nextList = documents.map(d => d.id === selectedDoc.id ? updatedDoc : d);
      persistMetadata(nextList);
      setSelectedDoc(updatedDoc);
      await syncDocumentActivityBackToAudits('VERSION CHANGE', updatedDoc, `Fitted version ${newVerStr}. Note: ${changeNote}`);
      toast.success(`DMS Ingestion version updated to ${newVerStr}.`);
    } catch (e: any) {
      toast.error('Version bump gateway timeout: ' + e.message);
    }
  };

  // Deletion logic (Direct Database delete wrapper sync)
  const deleteDocumentExecution = async (id: string) => {
    const token = localStorage.getItem('ooms_token');
    try {
      const res = await fetch(`${API_URL}/api/registry/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ moduleName: 'Documents', id })
      });
      if (res.ok) {
        const nextList = documents.filter(d => d.id !== id);
        persistMetadata(nextList);
        setSelectedDoc(null);
        setIsDrawerOpen(false);
        toast.success('Document soft-deleted and removed from operational ledger.');
      } else {
        throw new Error('Database denied deletion permissions.');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Export Documents Spreadsheet
  const exportDocLedger = () => {
    const header = 'Document ID,File Name,Type,Department,Owner,Status,Version,Classification,Size(KB),UploadedAt\n';
    const rows = filteredDocs.map(d => 
      `"${d.id}","${d.fileName}","${d.category}","${selectedDept || 'Operations'}","${d.owner}","${d.status}","${d.version}","${d.classification}",${d.sizeKb},"${d.uploadedAt}"`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OOMS_Nigeria_DMS_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Ledger manifest successfully generated.');
  };

  // Bulk operation executor
  const executeBulkOperations = async () => {
    if (selectedDocIds.length === 0 || !bulkActionType) return;

    let updatedList = [...documents];
    const targetFolder = folders.find(f => f.id === bulkTargetFolderId);

    if (bulkActionType === 'delete') {
      const token = localStorage.getItem('ooms_token');
      try {
        await Promise.all(selectedDocIds.map(async id => {
          await fetch(`${API_URL}/api/registry/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ moduleName: 'Documents', id })
          });
        }));
        updatedList = updatedList.filter(d => !selectedDocIds.includes(d.id));
        toast.success(`Bulk operations: Deleted ${selectedDocIds.length} registry items.`);
      } catch (err) {
        toast.error('Failed complete bulk deletion API pipeline.');
      }
    } else if (bulkActionType === 'archive') {
      updatedList = updatedList.map(d => selectedDocIds.includes(d.id) ? { ...d, status: 'Archived', modifiedAt: new Date().toISOString() } : d);
      toast.success(`Bulk operations: Archived ${selectedDocIds.length} document nodes.`);
    } else if (bulkActionType === 'move' && targetFolder) {
      updatedList = updatedList.map(d => selectedDocIds.includes(d.id) ? { ...d, folderId: bulkTargetFolderId, modifiedAt: new Date().toISOString() } : d);
      toast.success(`Bulk operations: Relocated ${selectedDocIds.length} items to "${targetFolder.name}".`);
    } else if (bulkActionType === 'approve') {
      updatedList = updatedList.map(d => selectedDocIds.includes(d.id) ? { ...d, status: 'Approved', modifiedAt: new Date().toISOString() } : d);
      toast.success(`Bulk operations: Authorized approval clearance signatures for ${selectedDocIds.length} documents.`);
    } else if (bulkActionType === 'assign') {
      updatedList = updatedList.map(d => selectedDocIds.includes(d.id) ? { ...d, owner: bulkTargetDept || 'Compliance Unit', modifiedAt: new Date().toISOString() } : d);
      toast.success(`Bulk operations: Assigned unit metadata tags.`);
    }

    persistMetadata(updatedList);
    setSelectedDocIds([]);
    setBulkActionType(null);
  };

  // Filtering System Logic
  const filteredDocs = documents.filter(doc => {
    // 1. Sidebar Nav Filters
    if (activeNavSection === 'recent') {
      const ageHours = (Date.now() - new Date(doc.uploadedAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 168) return false; // within 7 days
    } else if (activeNavSection === 'favorites') {
      const favList = localStorage.getItem('ooms_dms_favorites') || '[]';
      if (!JSON.parse(favList).includes(doc.id)) return false;
    } else if (activeNavSection === 'shared') {
      if (doc.classification !== 'Internal' && doc.category !== 'Policy') return false;
    } else if (activeNavSection === 'pending_approval') {
      if (doc.status !== 'Submitted' && doc.status !== 'Under Review') return false;
    } else if (activeNavSection === 'approved') {
      if (doc.status !== 'Approved') return false;
    } else if (activeNavSection === 'archived') {
      if (doc.status !== 'Archived') return false;
    } else if (activeNavSection === 'trash') {
      // Trash logic placeholder
      return false;
    } else if (activeNavSection === 'folder') {
      if (doc.folderId !== selectedFolderId) return false;
    }

    // 2. Toolbar Dynamic Filters
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const inName = doc.fileName.toLowerCase().includes(query);
      const inTags = doc.tags.some(t => t.toLowerCase().includes(query));
      const inOwner = doc.owner.toLowerCase().includes(query);
      const inNum = doc.documentNumber.toLowerCase().includes(query);
      const inRef = doc.referenceNumber.toLowerCase().includes(query);
      const inContent = doc.description.toLowerCase().includes(query);
      if (!inName && !inTags && !inOwner && !inNum && !inRef && !inContent) return false;
    }

    if (selectedDept && doc.category !== selectedDept) {
      // Mapping matching categories for layout matching
    }
    if (selectedType && doc.category !== selectedType) return false;
    if (selectedClassification && doc.classification !== selectedClassification) return false;
    if (selectedStatus && doc.status !== selectedStatus) return false;

    if (selectedDateRange) {
      const docDate = new Date(doc.uploadedAt);
      const daysAgo = (Date.now() - docDate.getTime()) / (1000 * 3600 * 24);
      if (selectedDateRange === 'today' && daysAgo > 1) return false;
      if (selectedDateRange === 'week' && daysAgo > 7) return false;
      if (selectedDateRange === 'month' && daysAgo > 30) return false;
    }

    return true;
  });

  const baseUsedGb = 18.42;
  const documentsSizeGb = documents.reduce((acc, d) => acc + (d.sizeKb / (1024 * 1024)), 0);
  const totalUsedGb = parseFloat((baseUsedGb + documentsSizeGb).toFixed(3));
  const percentageUsed = parseFloat(((totalUsedGb / 100) * 100).toFixed(1));

  // Sorting
  const sortedDocs = [...filteredDocs].sort((a: any, b: any) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    
    if (sortBy === 'modifiedDate' || sortBy === 'modifiedAt') {
      valA = new Date(a.modifiedAt).getTime();
      valB = new Date(b.modifiedAt).getTime();
    }
    if (sortBy === 'size') {
      valA = a.sizeKb;
      valB = b.sizeKb;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const isFavorite = (id: string) => {
    const list = localStorage.getItem('ooms_dms_favorites') || '[]';
    return JSON.parse(list).includes(id);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const list = JSON.parse(localStorage.getItem('ooms_dms_favorites') || '[]');
    let updated;
    if (list.includes(id)) {
      updated = list.filter((item: string) => item !== id);
      toast.success('Removed from corporate favorites list.');
    } else {
      updated = [...list, id];
      toast.success('Added to corporate audit favorites list.');
    }
    localStorage.setItem('ooms_dms_favorites', JSON.stringify(updated));
    // Trigger local state re-render
    setFolders([...folders]);
  };

  // Interactive Live Canvas Rendering (Realistic Compliance Documents Generator)
  const renderPreviewCanvasMock = () => {
    if (!selectedDoc) return null;
    const isImage = /\.(jpe?g|png)$/i.test(selectedDoc.fileName);
    const isTxt = /\.txt$/i.test(selectedDoc.fileName);

    return (
      <div 
        className="w-full h-full bg-white select-text transition-all duration-300 shadow-sm border border-slate-200 p-6 rounded-lg text-left"
        style={{ transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`, transformOrigin: 'top center' }}
      >
        <div className="border-b-2 border-[#15803D] pb-3 mb-4 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#15803D] block font-mono">
            FEDERAL REPUBLIC OF NIGERIA
          </span>
          <h2 className="text-sm font-black text-[#0F172A] mt-1 tracking-tight leading-none uppercase">
            {selectedDoc.category} Ingress Audit Panel
          </h2>
          <span className="text-[8px] text-slate-400 font-mono block mt-1">
            Doc Registration Code: {selectedDoc.documentNumber} • Secure Port Authority Logs
          </span>
        </div>

        {/* Content Section */}
        {isImage ? (
          <div className="flex flex-col items-center justify-center p-6 gap-3">
            <div className="w-[180px] h-[150px] bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
              <FileText className="w-12 h-12 text-[#FA9E05]" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono italic">{selectedDoc.fileName} - Visual Image Map Ingested</span>
          </div>
        ) : isTxt ? (
          <div className="space-y-3 font-mono text-[9px] text-[#0F172A] p-3 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap leading-relaxed">
            {`ROOT_AUTHENTIC_STREAM: 
OOMS_NIGERIA_LEDGER_REGISTER = TRUE
REF_IDENTITY_TAG: "${selectedDoc.referenceNumber}"
OWNER_STATION: "${selectedDoc.owner}"
CLASSIFIED_LEVEL: "${selectedDoc.classification}"
RETENTION_PERIOD: "${selectedDoc.retentionPeriod}"

The compliance manifest of category "${selectedDoc.category}" has been verified on Abuja Core-Grid Node. Database tables have locked state signatures.`}
          </div>
        ) : (
          <div className="space-y-4 font-sans text-xs text-slate-800 leading-relaxed">
            <p className="font-bold text-[11px] text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 uppercase tracking-wide">
              Subject Overview Details:
            </p>
            <p className="text-[10.5px] italic text-slate-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
              "{selectedDoc.description}"
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 text-[10px]">
              <div>
                <strong className="text-[8.5px] text-slate-400 uppercase font-bold block mb-0.5">National Security Clearance</strong>
                <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-red-50 text-red-700 border border-red-100 rounded">
                  {selectedDoc.classification}
                </span>
              </div>
              <div>
                <strong className="text-[8.5px] text-slate-400 uppercase font-bold block mb-0.5">Audit Stamp Check</strong>
                <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-green-50 text-green-700 border border-green-100 rounded">
                  Verified Ingress
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <div>
                <span>Authority Sign-off seal code:</span>
                <span className="block font-bold text-slate-650 mt-0.5">{selectedDoc.referenceNumber}</span>
              </div>
              <div className="w-12 h-12 border-2 border-dashed border-[#15803D] rounded-full flex items-center justify-center font-black text-[8px] text-[#15803D] rotate-12">
                OOMS SEED
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (s === 'under review' || s === 'submitted') return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (s === 'rejected') return 'bg-rose-50 text-rose-700 border border-rose-200';
    return 'bg-slate-50 text-slate-700 border border-slate-250';
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans text-left min-h-[640px]">
      
      {/* OUTER WORKSPACE FRAME */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        
        {/* 1. SIDEBAR NAVIGATION CONTROLS (WIDTH: 260px) */}
        <div className="w-full xl:w-[260px] shrink-0 bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col gap-1 shadow-2xs select-none">
          
          <div className="px-3.5 pb-2 border-b border-slate-100 mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">DMS Workspace</span>
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {[
            { label: 'All Documents', key: 'all', icon: FileText },
            { label: 'Recent', key: 'recent', icon: History },
            { label: 'Favorites', key: 'favorites', icon: CheckCircle },
            { label: 'Shared With Me', key: 'shared', icon: Share2 },
            { label: 'Pending Approval', key: 'pending_approval', icon: Workflow },
            { label: 'Approved', key: 'approved', icon: BookOpen },
            { label: 'Archived Documents', key: 'archived', icon: Archive }
          ].map((item) => {
            const isTabActive = activeNavSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveNavSection(item.key);
                  setSelectedFolderId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  isTabActive 
                    ? 'bg-[#FFF7ED] text-[#D97706] border-l-3 border-[#F59E0B] pl-3.5' 
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 border-l-3 border-transparent'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isTabActive ? 'text-[#D97706]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-3.5 border-t border-slate-100" />

          {/* FOLDERS DIRECTORY REGISTRY */}
          <div className="px-3 pb-2.5 flex items-center justify-between select-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Corporate Folders</span>
            <button 
              onClick={() => {
                setFolderModal({ type: 'create' });
                setFolderInputName('');
              }}
              className="p-1 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
              title="Establish Corporate Folder Node"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {folders.filter(f => !f.isArchived).map((folder) => {
              const isFolderActive = activeNavSection === 'folder' && selectedFolderId === folder.id;
              return (
                <div key={folder.id} className="group relative flex items-center justify-between w-full rounded-xl transition-all">
                  <button
                    onClick={() => {
                      setActiveNavSection('folder');
                      setSelectedFolderId(folder.id);
                    }}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all text-left cursor-pointer ${
                      isFolderActive 
                        ? 'bg-[#FFF7ED] text-[#D97706] border-l-3 border-[#F59E0B] pl-3.5' 
                        : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 border-l-3 border-transparent'
                    }`}
                  >
                    <Folder className={`w-4 h-4 shrink-0 ${isFolderActive ? 'text-[#D97706]' : 'text-slate-400'}`} />
                    <span className="truncate pr-4">{folder.name}</span>
                  </button>

                  {/* Context Actions Hover Trigger */}
                  <div className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderModal({ type: 'rename', folderId: folder.id });
                        setFolderInputName(folder.name);
                      }}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      title="Rename Folder"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderModal({ type: 'archive', folderId: folder.id });
                      }}
                      className="p-1 hover:bg-slate-200 rounded text-rose-500"
                      title="Archive Folder"
                    >
                      <Archive className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* STORAGE UTILITY ENGINE */}
          <div className="mt-6 p-4 border border-[#E5E7EB] bg-slate-50 rounded-2xl text-left font-sans select-none space-y-2">
            <div className="flex items-center justify-between text-[9px] font-black uppercase font-mono text-slate-450 leading-none">
              <span>Vault Allocation</span>
              <span className="text-[#F59E0B] font-mono font-extrabold">{percentageUsed}% Used</span>
            </div>
            
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-black text-slate-800 tracking-tight font-mono">{totalUsedGb} GB</span>
              <span className="text-[9px] text-slate-400 font-bold font-mono">/ 100 GB</span>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden block">
              <div 
                className="h-full bg-[#F59E0B] rounded-full transition-all duration-500" 
                style={{ width: `${percentageUsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[8px] uppercase tracking-wider font-extrabold text-slate-400 font-mono pt-1 leading-none">
              <span>Active Node Storage</span>
              <span>{parseFloat((100 - totalUsedGb).toFixed(2))} GB free</span>
            </div>
          </div>

        </div>

        {/* 2. MAIN PRIMARY WORKSPACE BOARD */}
        <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
          
          {/* SECURE INGRESS TOOLBAR */}
          <div className="p-4 bg-slate-50 border-b border-[#E5E7EB] flex flex-col gap-4 select-none">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Central Search block */}
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enterprise search (doc name, tag, ref, node comments...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs rounded-xl py-2.5 pl-10 pr-4 bg-white border border-[#E5E7EB] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-hidden text-[#0F172A] font-semibold tracking-wide"
                />
              </div>

              {/* Action Operations Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                  onClick={exportDocLedger}
                  className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-slate-100 text-[#0F172A] border border-slate-200 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer bg-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export DMS
                </button>

                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-transparent shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Upload Document
                </button>
              </div>

            </div>

            {/* DYNAMIC METADATA FILTER BAR */}
            <div className="flex flex-wrap gap-2.5 items-center justify-start py-2 border-t border-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Filters Matrix:</span>
              
              <select
                aria-label="Category Selection"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-lg focus:border-amber-500 font-bold uppercase tracking-wider cursor-pointer outline-hidden"
              >
                <option value="">All Document Types</option>
                <option value="Contract">Legal Contracts</option>
                <option value="Invoice">Supplier Invoices</option>
                <option value="Policy">Corporate Policies</option>
                <option value="Manual">Training Manuals</option>
                <option value="Confidential">Confidential Audits</option>
              </select>

              <select
                aria-label="Classification Selection"
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-lg focus:border-amber-500 font-bold uppercase tracking-wider cursor-pointer outline-hidden"
              >
                <option value="">All Clearances</option>
                <option value="Public">Public</option>
                <option value="Internal">Internal</option>
                <option value="Restricted">Restricted</option>
                <option value="Confidential">Confidential</option>
              </select>

              <select
                aria-label="Workflow Status Selection"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-lg focus:border-amber-500 font-bold uppercase tracking-wider cursor-pointer outline-hidden"
              >
                <option value="">All States</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Archived">Archived</option>
              </select>

              <select
                aria-label="Date Range Selection"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-2.5 py-1.5 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-lg focus:border-amber-500 font-bold uppercase tracking-wider cursor-pointer outline-hidden"
              >
                <option value="">Ingress Date</option>
                <option value="today">Uploaded Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>

              {/* Bulk Actions Button Overlay Trigger */}
              {selectedDocIds.length > 0 && (
                <div className="ml-auto flex items-center gap-2.5 bg-amber-50 outline-dotted outline-amber-300 p-1.5 px-3 rounded-lg leading-none animate-bounce">
                  <span className="text-[10px] text-amber-800 font-mono font-bold">{selectedDocIds.length} Nodes Selected</span>
                  
                  <select
                    aria-label="Bulk Action Type selection"
                    value={bulkActionType || ''}
                    onChange={(e: any) => setBulkActionType(e.target.value)}
                    className="text-[9.5px] uppercase font-bold text-amber-800 bg-white border border-amber-200 p-1 rounded cursor-pointer outline-hidden"
                  >
                    <option value="">Select Action</option>
                    <option value="move">Bulk Move Folder</option>
                    <option value="archive">Bulk Archive</option>
                    <option value="approve">Bulk Approve Signatures</option>
                    <option value="delete">Bulk Force Delete</option>
                  </select>
                </div>
              )}
            </div>

          </div>

          {/* MAIN SPLIT GRID (LEFT FILE TABLE + RIGHT PREVIEW CANVAS) */}
          <div className="flex-1 flex flex-col lg:flex-row relative">
            
            {/* FILE LEDGER TABLE */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 overflow-x-auto min-h-[380px] p-2 relative transition-all duration-200 ${
                isDragging ? 'bg-[#FFF7ED] border-2 border-dashed border-amber-400' : ''
              } ${selectedDoc ? 'lg:max-w-[55%]' : ''}`}
            >
              <table className="w-full text-left border-collapse table-auto select-none">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 h-11 px-4 text-center bg-[#0F172A] text-white" style={{ width: '4%' }}>
                      <input
                        type="checkbox"
                        aria-label="Select state check"
                        checked={selectedDocIds.length === sortedDocs.length && sortedDocs.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocIds(sortedDocs.map(d => d.id));
                          } else {
                            setSelectedDocIds([]);
                          }
                        }}
                      />
                    </th>
                    <th onClick={() => toggleSort('fileName')} className="sticky top-0 z-10 h-11 px-4 text-[9.5px] font-black uppercase bg-[#0F172A] text-white cursor-pointer hover:bg-slate-800">
                      File Name <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th onClick={() => toggleSort('category')} className="sticky top-0 z-10 h-11 px-4 text-[9.5px] font-black uppercase bg-[#0F172A] text-white cursor-pointer hover:bg-slate-800">
                      Type <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th onClick={() => toggleSort('classification')} className="sticky top-0 z-10 h-11 px-4 text-[9.5px] font-black uppercase bg-[#0F172A] text-white cursor-pointer hover:bg-slate-800">
                      Clearance <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th onClick={() => toggleSort('status')} className="sticky top-0 z-10 h-11 px-4 text-[9.5px] font-black uppercase bg-[#0F172A] text-white cursor-pointer hover:bg-slate-800">
                      Status <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                    <th onClick={() => toggleSort('modifiedAt')} className="sticky top-0 z-10 h-11 px-4 text-[9.5px] font-black uppercase bg-[#0F172A] text-white cursor-pointer hover:bg-slate-800">
                      Modified <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbLoading ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <RefreshCw className="w-8 h-8 text-[#FA9E05] animate-spin mx-auto mb-2" />
                        <span className="text-[10px] font-extrabold uppercase font-mono text-slate-400">Loading DMS Records...</span>
                      </td>
                    </tr>
                  ) : sortedDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-bounce" />
                        <span className="text-xs font-semibold text-slate-700 uppercase">No DMS files matching descriptors</span>
                        <p className="text-[10px] text-slate-400 mt-1">Drag and drop documents directly here to establish ingress record streams.</p>
                      </td>
                    </tr>
                  ) : (
                    sortedDocs.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      const isMultiSelected = selectedDocIds.includes(doc.id);

                      return (
                        <tr
                          key={doc.id}
                          onClick={() => {
                            setSelectedDoc(doc);
                            setIsDrawerOpen(true);
                          }}
                          className={`group cursor-pointer border-b border-slate-100 transition-all ${
                            isSelected ? 'bg-[#FFF7ED] border-l-4 border-[#F59E0B]' : 'hover:bg-[#FFF7ED] hover:border-l-4 hover:border-[#F59E0B]/50'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label="Select doc"
                              checked={isMultiSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocIds(prev => [...prev, doc.id]);
                                } else {
                                  setSelectedDocIds(prev => prev.filter(id => id !== doc.id));
                                }
                              }}
                            />
                          </td>
                          <td className="p-3 text-xs font-bold text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              {/* Favorite star */}
                              <button 
                                onClick={(e) => toggleFavorite(doc.id, e)} 
                                className={`text-[13px] ${isFavorite(doc.id) ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                              >
                                {isFavorite(doc.id) ? '★' : '☆'}
                              </button>
                              <FileText className="w-4 h-4 text-[#F59E0B] shrink-0" />
                              <div className="flex flex-col truncate max-w-[140px]">
                                <span className="truncate">{doc.fileName}</span>
                                <span className="text-[8.5px] text-slate-400 font-mono mt-0.5">{doc.documentNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-[11px] font-bold text-slate-650">{doc.category}</td>
                          <td className="p-3 text-[10px] font-mono">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold ${
                              doc.classification === 'Confidential' ? 'bg-red-50 text-red-600 border-red-200' :
                              doc.classification === 'Restricted' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-600'
                            }`}>
                              {doc.classification}
                            </span>
                          </td>
                          <td className="p-3 text-[10px]">
                            <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black ${getStatusBadgeClass(doc.status)}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-3 text-[10px] font-mono text-slate-500">
                            {new Date(doc.modifiedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* SEPARATE RIGHT-SIDE COMPLIANCE PREVIEW BOARD */}
            {selectedDoc && (
              <div className="hidden lg:flex flex-[0.45] bg-slate-50 border-l border-slate-250 flex-col p-4 select-none min-h-[440px]">
                
                <div className="flex items-center justify-between border-b pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5 leading-none">
                    <FileText className="w-4 h-4 text-[#15803D]" />
                    <span className="text-[9.5px] uppercase font-black text-[#15803D] tracking-wider font-mono">DMS Active Canvas Preview</span>
                  </div>

                  {/* Canvas Utilities */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setPreviewZoom(prev => Math.max(75, prev - 25))} 
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9.5px] font-mono font-bold text-slate-500">{previewZoom}%</span>
                    <button 
                      onClick={() => setPreviewZoom(prev => Math.min(150, prev + 25))} 
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setPreviewRotation(prev => (prev + 90) % 360)} 
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 ml-1.5"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Previews Frame */}
                <div className="flex-1 overflow-y-auto max-h-[460px] pb-4 flex justify-center">
                  {renderPreviewCanvasMock()}
                </div>

                {/* Lower control timeline */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 border-t pt-2.5 mt-2">
                  <span>Page {previewPage} of {maxPreviewPages}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      disabled={previewPage === 1} 
                      onClick={() => setPreviewPage(p => p - 1)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[9px] rounded-md disabled:opacity-40"
                    >
                      ◄
                    </button>
                    <button 
                      disabled={previewPage === maxPreviewPages} 
                      onClick={() => setPreviewPage(p => p + 1)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[9px] rounded-md disabled:opacity-40"
                    >
                      ►
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* WORKSPACE DATA FOOTER */}
          <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B] select-none">
            <span className="font-bold text-[#0F172A]">Showing {sortedDocs.length} of {documents.length} ingested document nodes</span>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-white border rounded text-[9.5px] font-extrabold uppercase font-mono">Ingress Node: Abuja HQ Main Server</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. SLIDING RIGHT DETAILS DRAWER (WIDTH: 420px) */}
      <AnimatePresence>
        {isDrawerOpen && selectedDoc && (
          <>
            {/* Backdrop Layer */}
            <div 
              className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-xs transition-opacity" 
              onClick={() => setIsDrawerOpen(false)}
            />
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 210 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 leading-none">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Document Specs Log</span>
                    <h3 className="text-xs font-extrabold text-[#0F172A] truncate max-w-[260px] mt-0.5">{selectedDoc.fileName}</h3>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 px-1.5 border border-slate-250 bg-white hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Header tabs */}
              <div className="px-4 border-b border-slate-100 bg-slate-50 flex items-center gap-1 select-none">
                {[
                  { label: 'Overview', key: 'overview' },
                  { label: 'Activity Logs', key: 'activity' },
                  { label: 'Versions', key: 'versions' },
                  { label: 'Permissions', key: 'permissions' }
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveDrawerTab(t.key as any)}
                    className={`px-3.5 py-3 text-[9.5px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeDrawerTab === t.key ? 'border-[#F59E0B] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Sliding Drawer content view */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left select-text">
                
                {/* A. OVERVIEW PANEL */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl">
                      <div>
                        <span className="text-[8px] uppercase font-bold text-slate-400 font-mono">Reference Registry ID</span>
                        <p className="text-xs font-mono font-bold text-[#D97706]">#{selectedDoc.id}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${getStatusBadgeClass(selectedDoc.status)}`}>
                        {selectedDoc.status}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-[9.5px] uppercase font-black text-slate-400 font-mono block">Metadata Matrix</h4>
                      
                      <div>
                        <span className="text-[8.5px] uppercase font-semibold text-slate-400 block">Ingested File Title</span>
                        <span className="text-xs font-extrabold text-slate-800">{selectedDoc.fileName}</span>
                      </div>

                      <div>
                        <span className="text-[8.5px] uppercase font-semibold text-slate-400 block">Logical Category</span>
                        <span className="text-xs font-bold text-slate-800">{selectedDoc.category}</span>
                      </div>

                      <div>
                        <span className="text-[8.5px] uppercase font-semibold text-slate-400 block">Classification Clearance</span>
                        <span className="inline-block px-2 py-0.5 text-[9.5px] font-extrabold uppercase bg-rose-50 border border-rose-200 text-rose-700 rounded font-mono mt-0.5">{selectedDoc.classification}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <span className="text-[8.5px] uppercase font-semibold text-slate-400 block">Node Owner</span>
                          <span className="text-xs font-bold text-slate-805">{selectedDoc.owner}</span>
                        </div>
                        <div>
                          <span className="text-[8.5px] uppercase font-semibold text-slate-400 block">Version Reference</span>
                          <span className="text-xs font-mono font-bold text-slate-805">{selectedDoc.version}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8.5px] uppercase font-semibold text-slate-400 block font-mono">DMS Document Number</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{selectedDoc.documentNumber}</span>
                      </div>

                      <div>
                        <span className="text-[8.5px] uppercase font-semibold text-slate-400 block font-mono">Sovereign Ref Code</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{selectedDoc.referenceNumber}</span>
                      </div>

                      <div>
                        <span className="text-[8.5px] uppercase font-semibold text-slate-400 block">Description Descriptor</span>
                        <p className="text-[10px] text-slate-650 italic mt-0.5 bg-slate-50 p-2 border rounded-lg leading-relaxed">
                          "{selectedDoc.description}"
                        </p>
                      </div>
                    </div>

                    {/* ACTIONS RULES FOR TRANSTITIONS */}
                    <div className="pt-4 border-t border-slate-100 space-y-3.5">
                      <h4 className="text-[9.5px] uppercase font-black text-slate-400 font-mono block">Workflows & State Transitions</h4>
                      
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => transitionDocumentWorkflow('Approved', 'Executive audit verification cleared.')}
                          className="flex-1 py-2 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                        >
                          Approve Ingress
                        </button>
                        <button
                          onClick={() => transitionDocumentWorkflow('Rejected', 'State mismatch. Request corrections.')}
                          className="flex-1 py-2 text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                        >
                          Reject / Flag
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* B. ACTIVITY TIMER REPORT */}
                {activeDrawerTab === 'activity' && (
                  <div className="space-y-4">
                    <h4 className="text-[9.5px] uppercase font-black text-slate-400 font-mono block">Ingress Auditing Tracking Timeline</h4>
                    <div className="relative border-l-2 border-slate-150 pl-4.5 py-1.5 space-y-4 font-sans text-xs select-none">
                      {selectedDoc.workflowSteps.map((step, index) => (
                        <div key={index} className="relative group leading-snug">
                          <span className={`absolute -left-[24.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ${
                            step.status === 'Approved' ? 'bg-green-600 ring-green-100' : 'bg-amber-500 ring-amber-100'
                          }`} />
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900 font-extrabold">{step.step} ({step.role})</span>
                            <span className="text-[8.5px] text-slate-400 font-mono">{step.timestamp ? new Date(step.timestamp).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <p className="text-[10px] text-slate-450 italic mt-0.5">"{step.comments || 'Ingress checklist active.'}"</p>
                          <span className="text-[9px] text-[#64748B] font-bold font-mono block mt-1 uppercase">Cleared: {step.actor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* C. VERSION BUMP CONTROL BOARD */}
                {activeDrawerTab === 'versions' && (
                  <div className="space-y-4">
                    <h4 className="text-[9.5px] uppercase font-black text-slate-400 font-mono block">Document Version Control Vault</h4>
                    
                    {/* Add new version input */}
                    <div className="p-3 bg-slate-50 border rounded-xl space-y-2.5">
                      <span className="text-[8px] uppercase font-extrabold text-slate-400 font-mono">Ingest New Major/Minor Version</span>
                      <input
                        type="file"
                        id="new-version-file-input"
                        aria-label="Upload bump"
                        className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[9px] file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            uploadNewDocumentVersion(e.target.files[0], 'Document updated via OOMS Ledger Bump.');
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      {selectedDoc.versionsList.map((v, i) => (
                        <div key={i} className="p-3 border rounded-xl leading-normal text-xs text-slate-800 flex items-start gap-3.5">
                          <span className="text-[9.5px] font-black text-[#D97706] bg-amber-50 rounded px-1 px-1.5 font-mono">
                            {v.version}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span>Bump Ingested</span>
                              <span className="text-[8.5px] text-slate-400 font-mono">{new Date(v.timestamp).toLocaleString()}</span>
                            </div>
                            <span className="text-[9.5px] text-slate-400 block font-semibold leading-tight mt-0.5">Uploader: {v.uploadedBy}</span>
                            <p className="text-[10px] text-slate-650 italic mt-1 bg-white border border-slate-100 p-1.5 rounded">{v.changeNote}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* D. ROLE ACCESS LISTS */}
                {activeDrawerTab === 'permissions' && (
                  <div className="space-y-4">
                    <h4 className="text-[9.5px] uppercase font-black text-slate-400 font-mono block">Role-Based Access Control Manifest</h4>
                    
                    <div className="space-y-2 text-xs">
                      {[
                        { label: 'View Ledger Access', roles: selectedDoc.permissions.view, icon: Eye },
                        { label: 'Edit Metadata Node', roles: selectedDoc.permissions.edit, icon: Edit2 },
                        { label: 'Binary Stream Download', roles: selectedDoc.permissions.download, icon: Download },
                        { label: 'Workflows Signoff Approve', roles: selectedDoc.permissions.approve, icon: Unlock },
                        { label: 'Registry Soft Delete', roles: selectedDoc.permissions.delete, icon: Trash2 }
                      ].map((perm, i) => (
                        <div key={i} className="p-3 border rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold">
                            <perm.icon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{perm.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                            {perm.roles.slice(0, 3).map((vrole, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 border text-[7.5px] rounded-md font-mono font-bold leading-none">
                                {vrole}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer footer utilities */}
              <div className="p-4 border-t bg-slate-50 flex justify-between select-none">
                <span className="text-[9px] text-slate-400 font-black uppercase font-mono mt-2">DMS Secure Portal</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      toast.info(`Download binary stream successfully completed for: "${selectedDoc.fileName}".`);
                    }}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-350 rounded-lg text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    DL Stream
                  </button>
                  <button
                    onClick={() => deleteDocumentExecution(selectedDoc.id)}
                    className="p-2 px-3 bg-[#EF4444] hover:bg-[#DC2626] font-extrabold text-[#FFF] uppercase text-[10px] rounded-lg tracking-wider"
                  >
                    Force Purge
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. REUSABLE AND BEAUTIFUL DMS INTERACTIVE MODALS */}
      {/* A. CORPORATE FOLDERS MANAGER DIALOG */}
      {folderModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs">
          <div className="bg-white border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-left space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 font-mono">OOMS Registry Folder Gate</h3>
              <h4 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wide">
                {folderModal.type === 'create' ? 'Create Folder Node' : folderModal.type === 'rename' ? 'Rename Folder Node' : 'Archive Folder Node'}
              </h4>
              <p className="text-xs text-slate-500 font-semibold italic leading-relaxed">
                {folderModal.type === 'archive' 
                  ? 'All references will fall back safely to active operations workspace.' 
                  : 'Specify an human-readable alphanumeric label to bind this folder node.'}
              </p>
            </div>

            {folderModal.type !== 'archive' && (
              <input
                type="text"
                value={folderInputName}
                placeholder="e.g. Legal Compliances Abuja"
                onChange={(e) => setFolderInputName(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] rounded-xl font-bold text-slate-800"
              />
            )}

            <div className="flex justify-end gap-2 text-xs font-bold pt-1 uppercase">
              <button onClick={() => setFolderModal({ type: null })} className="p-2.5 px-4 bg-white hover:bg-slate-50 border rounded-xl text-slate-500">
                Cancel
              </button>
              <button onClick={executeFolderAction} className="p-2.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">
                {folderModal.type === 'archive' ? 'Confirm Archive' : 'Commit Node'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. BULK OPERATIONS VERIFICATION MODAL */}
      {bulkActionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs">
          <div className="bg-white border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-left space-y-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Bulk Authorization Gate
              </h3>
              <h4 className="text-sm font-extrabold text-[#0F172A]">
                Authorize Bulk {bulkActionType.toUpperCase()}?
              </h4>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                You are about to authorize state action <strong className="uppercase">{bulkActionType}</strong> for <strong className="text-amber-600 font-black">{selectedDocIds.length} select document nodes</strong>. This alters tracking logs.
              </p>
            </div>

            {bulkActionType === 'move' && (
              <div className="space-y-1 select-none">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Destination Folder</span>
                <select
                  aria-label="Bulk destination choice"
                  value={bulkTargetFolderId}
                  onChange={(e) => setBulkTargetFolderId(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border rounded-xl font-bold text-slate-700 cursor-pointer outline-hidden"
                >
                  <option value="">Choose Destination Folder</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 text-xs font-bold pt-1.5 uppercase">
              <button onClick={() => { setBulkActionType(null); setSelectedDocIds([]); }} className="p-2.5 px-4 bg-white hover:bg-slate-50 border rounded-xl text-slate-500">
                Cancel
              </button>
              <button onClick={executeBulkOperations} className="p-2.5 px-4 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl">
                Authorize Bulk Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. ALL-NEW COMPREHENSIVE UPLOAD FORM DIALOG */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs">
          <div className="bg-white border rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-2 leading-none">
              <div className="text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">DMS Compliance Intake Channel</h3>
                <h4 className="text-sm font-extrabold text-[#0F172A] mt-0.5">SECURE FILE UPLOAD CONTROL ROOM</h4>
              </div>
              <button 
                onClick={() => {
                  setUploadModalOpen(false);
                  setUploadQueue([]); // Reset search
                }} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* VISIBLE UPLOAD GOVERNANCE CONSTRAINTS */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left font-sans select-none space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-800 font-mono tracking-wider block">File Upload Governance Protocol</span>
              <p className="text-[10.5px] text-amber-700 leading-normal font-medium">
                Before initiating ingestion, ensure files adhere to sovereign DMS standards. Non-compliant streams are automatically filtered.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-amber-100 mt-1.5 text-[9.5px] font-mono font-bold uppercase text-amber-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                  <span>Formats: PDF, DOCX, XLSX, JPG, PNG, TXT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                  <span>Limits: Max 25MB / file, Bulk 250MB</span>
                </div>
              </div>
            </div>

            {/* Meta preset fields (will apply to newly added queue files) */}
            <div className="grid grid-cols-3 gap-3 text-left">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Upload Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-150 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer outline-hidden"
                >
                  <option value="Contract">Legal Contract</option>
                  <option value="Invoice">Supplier Invoice</option>
                  <option value="Policy">Corporate Policy</option>
                  <option value="Manual">Training Manual</option>
                  <option value="Confidential">Confidential Audit</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Clearance Level</label>
                <select
                  value={uploadForm.classification}
                  onChange={(e: any) => setUploadForm(p => ({ ...p, classification: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-150 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer outline-hidden"
                >
                  <option value="Public">Public Access</option>
                  <option value="Internal">Internal Only</option>
                  <option value="Restricted">Restricted (Log Audited)</option>
                  <option value="Confidential">Confidential</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block mb-1">Retention Policy</label>
                <select
                  value={uploadForm.retentionPeriod}
                  onChange={(e) => setUploadForm(p => ({ ...p, retentionPeriod: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-150 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer outline-hidden"
                >
                  <option value="3 Years">3 Years</option>
                  <option value="7 Years">7 Years</option>
                  <option value="15 Years">15 Years</option>
                  <option value="Permanent">Permanent Ledger</option>
                </select>
              </div>
            </div>

            {/* DRAG-AND-DROP SECURE INTAKE GRID */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-amber-500 bg-amber-50/20' 
                  : 'border-slate-200 bg-slate-50 hover:border-amber-550 hover:bg-slate-100/50'
              }`}
            >
              <UploadCloud className="w-9 h-9 text-[#F59E0B] mx-auto mb-2" />
              <span className="font-extrabold text-slate-800 text-xs block">
                Drag & Drop files to initiate compliance queue insertion
              </span>
              <p className="text-[9.5px] text-slate-400 mt-1 font-semibold font-mono">
                OR CLICK TO SELECT FROM SYSTEM BUFFER
              </p>
              <input 
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* QUEUED FILE LIST (REAL-TIME PROGRESS MONITORS) */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 font-mono">
                <span>Dockets Queue ({uploadQueue.length} items)</span>
                <span>Max Payload Limit: 250 MB Limit</span>
              </div>

              {uploadQueue.length === 0 ? (
                <div className="text-center p-6 border rounded-xl text-slate-400 text-xs font-semibold italic bg-slate-50/50">
                  No files added to the secure ingress channel.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="p-3 border rounded-xl bg-white flex flex-col gap-2 transition-all hover:border-slate-300">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs font-extrabold text-slate-800 truncate max-w-[240px]" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">
                            ({item.sizeKb >= 1024 ? `${(item.sizeKb/1024).toFixed(2)} MB` : `${item.sizeKb} KB`})
                          </span>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status === 'Queued' && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border text-[8.5px] font-mono font-bold uppercase text-slate-500">
                              Queued
                            </span>
                          )}
                          {item.status === 'Uploading' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[8.5px] font-mono font-bold uppercase text-amber-700 animate-pulse">
                              Ingesting {item.progress}%
                            </span>
                          )}
                          {item.status === 'Completed' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-mono font-bold uppercase text-emerald-700">
                              Verified OK
                            </span>
                          )}
                          {item.status === 'Failed' && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-[8.5px] font-mono font-bold uppercase text-rose-700" title={item.errorMessage}>
                              Failed
                            </span>
                          )}
                          {item.status === 'DuplicateDetected' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-305 text-[8.5px] font-mono font-bold uppercase text-amber-800">
                              Duplicate Name Conflict
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Duplicate options prompt */}
                      {item.status === 'DuplicateDetected' && (
                        <div className="p-2.5 bg-amber-50/40 border border-amber-155 rounded-lg flex flex-col gap-1.5">
                          <p className="text-[10px] text-amber-850 leading-tight font-semibold">
                            An identical docket name exists in standard storage register. Choose compliance resolution strategy below:
                          </p>
                          <div className="flex flex-wrap gap-1.5 uppercase font-black text-[8px] font-mono pt-1">
                            <button 
                              onClick={() => processSingleQueueUpload(item.id, 'version')} 
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer transition-all"
                            >
                              Create New Version (vBump)
                            </button>
                            <button 
                              onClick={() => processSingleQueueUpload(item.id, 'replace')} 
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded cursor-pointer transition-all"
                            >
                              Overwrite/Replace Existing
                            </button>
                            <button 
                              onClick={() => processSingleQueueUpload(item.id, 'keep')} 
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border rounded cursor-pointer transition-all"
                            >
                              Keep Both (Create Copy node)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error Info */}
                      {item.errorMessage && (
                        <span className="text-[9.5px] text-rose-600 font-bold block leading-none">
                          {item.errorMessage}
                        </span>
                      )}

                      {/* Progress Line */}
                      {(item.status === 'Uploading' || item.status === 'Completed') && (
                        <div className="w-full bg-slate-100 h-1 rounded overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-150 ${item.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Item Actions context menu */}
                      <div className="flex justify-end gap-1.5 text-[8px] font-mono font-black uppercase">
                        {item.status === 'Queued' && (
                          <button 
                            onClick={() => processSingleQueueUpload(item.id)}
                            className="text-[#D97706] hover:underline"
                          >
                            Launch Upload Stream
                          </button>
                        )}
                        {item.status === 'Failed' && (
                          <button 
                            onClick={() => processSingleQueueUpload(item.id)}
                            className="text-amber-600 hover:underline"
                          >
                            Retry Handshake
                          </button>
                        )}
                        <button 
                          onClick={() => setUploadQueue(prev => prev.filter(q => q.id !== item.id))}
                          className="text-rose-600 hover:underline"
                        >
                          Cancel/Remove Node
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingress control actions */}
            <div className="flex justify-between items-center text-xs font-bold pt-3.5 border-t uppercase">
              <div className="flex gap-2">
                {uploadQueue.some(q => q.status === 'Completed') && (
                  <button 
                    onClick={() => setUploadQueue(prev => prev.filter(q => q.status !== 'Completed'))}
                    className="p-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] rounded-lg cursor-pointer"
                  >
                    Clear Completed
                  </button>
                )}
              </div>
              <div className="flex gap-2 font-mono text-[9.5px] font-extrabold pb-0.5">
                <button 
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadQueue([]);
                  }} 
                  className="p-2.5 px-4 bg-white hover:bg-slate-50 border rounded-xl text-slate-500 cursor-pointer"
                >
                  Exit Control Room
                </button>
                <button 
                  onClick={launchAllQueuedUploads} 
                  disabled={!uploadQueue.some(q => q.status === 'Queued')}
                  className={`p-2.5 px-4 rounded-xl text-white shadow-xs cursor-pointer ${
                    uploadQueue.some(q => q.status === 'Queued') 
                      ? 'bg-[#F59E0B] hover:bg-[#D97706]' 
                      : 'bg-slate-100 text-slate-450 border border-slate-150 cursor-not-allowed'
                  }`}
                >
                  Authorize All Queued Streams
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
