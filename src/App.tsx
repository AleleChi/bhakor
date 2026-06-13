import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  MapPin, 
  Search, 
  Plus, 
  Bell, 
  Settings, 
  LayoutDashboard, 
  Mail, 
  Calendar, 
  Package, 
  Fuel, 
  Printer, 
  FileText, 
  Menu, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  LogOut,
  User,
  Shield,
  Zap,
  RefreshCw,
  Sun,
  Moon,
  Truck,
  BarChart,
  Users,
  Sliders,
  CheckCircle2,
  Lock,
  Database,
  History,
  Activity,
  Laptop,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import GlobalFilters from './components/GlobalFilters';
import KPICardsSection from './components/KPICardsSection';
import PendingApprovalsPanel from './components/PendingApprovalsPanel';
import InventoryAlertsPanel from './components/InventoryAlertsPanel';
import RecentActivityFeed from './components/RecentActivityFeed';
import AnalyticsSection from './components/AnalyticsSection';
import QuickActionsPanel from './components/QuickActionsPanel';
import ModuleHealthSection from './components/ModuleHealthSection';
import ExecutiveInsightsSection from './components/ExecutiveInsightsSection';
import UpcomingTasksSection from './components/UpcomingTasksSection';
import RecordBrowserModal from './components/RecordBrowserModal';
import QuickAddModal from './components/QuickAddModal';
import AuthFlow from './components/AuthFlow';
import EmbeddedRegistryView from './components/EmbeddedRegistryView';
import UserDirectoryTable from './components/UserDirectoryTable';
import UserDetailsDrawer from './components/UserDetailsDrawer';
import LoginHistoryCenter from './components/LoginHistoryCenter';
import PrintersDashboardView from './components/PrintersDashboardView';
import DocumentWorkspace from './components/DocumentWorkspace';
import CorrespondenceWorkspace from './components/CorrespondenceWorkspace';
import { DashboardSummary, OOMSModule, ExecutiveInsight } from './types';
import { API_URL } from './lib/api';

const THEME_VARIABLES: Record<string, Record<string, string>> = {
  slate: {
    '--sidebar-bg': '#FFFBF5',
    '--sidebar-border': '#E5E7EB',
    '--sidebar-text': '#0F172A',
    '--sidebar-text-muted': '#64748B',
    '--sidebar-active-bg': '#FFF7ED',
    '--sidebar-active-text': '#0F172A',
    '--sidebar-hover-bg': '#FFF7ED',
    '--header-bg': '#FFFBF5',
    '--header-border': '#E5E7EB',
    '--header-text': '#0F172A',
    '--header-text-muted': '#64748B',
    '--header-search-bg': '#FFFFFF',
    '--header-search-border': '#E5E7EB',
    '--header-search-text': '#0F172A',
    '--header-button-bg': '#FFFFFF',
    '--header-button-border': '#E5E7EB',
    '--header-button-text': '#0F172A',
    '--primary-amber': '#F59E0B',
    '--accent-hover': '#D97706'
  },
  amber: {
    '--sidebar-bg': '#FFFBF5',
    '--sidebar-border': '#E5E7EB',
    '--sidebar-text': '#0F172A',
    '--sidebar-text-muted': '#64748B',
    '--sidebar-active-bg': '#FFF7ED',
    '--sidebar-active-text': '#0F172A',
    '--sidebar-hover-bg': '#FFF7ED',
    '--header-bg': '#FFFBF5',
    '--header-border': '#E5E7EB',
    '--header-text': '#0F172A',
    '--header-text-muted': '#64748B',
    '--header-search-bg': '#FFFFFF',
    '--header-search-border': '#E5E7EB',
    '--header-search-text': '#0F172A',
    '--header-button-bg': '#FFFFFF',
    '--header-button-border': '#E5E7EB',
    '--header-button-text': '#0F172A',
    '--primary-amber': '#F59E0B',
    '--accent-hover': '#D97706'
  },
  hybrid: {
    '--sidebar-bg': '#FFFBF5',
    '--sidebar-border': '#E5E7EB',
    '--sidebar-text': '#0F172A',
    '--sidebar-text-muted': '#64748B',
    '--sidebar-active-bg': '#FFF7ED',
    '--sidebar-active-text': '#0F172A',
    '--sidebar-hover-bg': '#FFF7ED',
    '--header-bg': '#FFFBF5',
    '--header-border': '#E5E7EB',
    '--header-text': '#0F172A',
    '--header-text-muted': '#64748B',
    '--header-search-bg': '#FFFFFF',
    '--header-search-border': '#E5E7EB',
    '--header-search-text': '#0F172A',
    '--header-button-bg': '#FFFFFF',
    '--header-button-border': '#E5E7EB',
    '--header-button-text': '#0F172A',
    '--primary-amber': '#F59E0B',
    '--accent-hover': '#D97706'
  }
};

export default function App() {
  // Session Theme state managers
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem('ooms_active_theme') || 'hybrid';
  });
  const [settingsTab, setSettingsTab] = useState<'general' | 'appearance' | 'profile'>('general');

  // Session Authentication state managers
  const [user, setUser] = useState<any | null>(() => {
    const cached = localStorage.getItem('ooms_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ooms_token');
  });

  // Custom White-First Theme (Always enforce light theme per specification rules)
  const darkMode = false;

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('ooms_theme', 'light');
  }, []);

  useEffect(() => {
    localStorage.setItem('ooms_active_theme', activeTheme);
    const vars = THEME_VARIABLES[activeTheme] || THEME_VARIABLES['hybrid'];
    Object.entries(vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }, [activeTheme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoginSuccess = (loggedInUser: any, jwtToken: string) => {
    setUser(loggedInUser);
    setToken(jwtToken);
    localStorage.setItem('ooms_user', JSON.stringify(loggedInUser));
    localStorage.setItem('ooms_token', jwtToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ooms_user');
    localStorage.removeItem('ooms_token');
  };

  // Global filter parameters
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedLoc, setSelectedLoc] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<string>('all');

  // Command Center core data state
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Gemini state triggers
  const [aiInsights, setAiInsights] = useState<ExecutiveInsight[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [usingMockInsights, setUsingMockInsights] = useState<boolean>(true);

  // Search input in header
  const [headerSearch, setHeaderSearch] = useState<string>('');

  // Sidebar parameters
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [tempActiveSegment, setTempActiveSegment] = useState<string>('Dashboard');
  const [adminSubTab, setAdminSubTab] = useState<'Users' | 'Security' | 'Roles' | 'Permissions'>('Users');

  // Popup Modal parameters
  const [browserModalOpen, setBrowserModalOpen] = useState<boolean>(false);
  const [browserInitialMod, setBrowserInitialMod] = useState<string>('Correspondence');
  
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickAddModule, setQuickAddModule] = useState<OOMSModule>('Correspondence');

  // Mini notification system state - Integrated dynamically with NestJS scanning engine
  const { data: rawNotifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['notificationsList', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 12000 // Poll every 12 seconds for low stocks or print jams!
  });

  const notificationsList = rawNotifications || [];
  const unreadNotifications = notificationsList.filter((n: any) => !n.read);
  const showActiveDot = unreadNotifications.length > 0;

  const handleMarkNotificationRead = async (id: string) => {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      refetchNotifications();
    }
  };

  const handleClearAllNotifications = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      refetchNotifications();
    }
  };

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  // Dynamic system queries for Roles and Permissions
  const { data: adminRoles, refetch: refetchAdminRoles, isLoading: isRolesLoading } = useQuery({
    queryKey: ['adminRolesList', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${API_URL}/api/auth/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && tempActiveSegment === 'Administration',
  });

  const { data: adminPermissions, isLoading: isPermissionsLoading } = useQuery({
    queryKey: ['adminPermissionsList', token],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${API_URL}/api/auth/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && tempActiveSegment === 'Administration',
  });

  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedPermKeys, setSelectedPermKeys] = useState<string[]>([]);
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);

  const handleUpdateRolePermissions = async () => {
    if (!token || !editingRole) return;
    setIsUpdatingRole(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editingRole.description,
          permissionActions: selectedPermKeys
        })
      });
      if (res.ok) {
        toast.success('System dynamic role clearances successfully synchronized with main cluster!');
        setEditingRole(null);
        refetchAdminRoles();
      } else {
        const err = await res.json();
        toast.error(err?.message || 'Failure updating system authorization matrix.');
      }
    } catch (e) {
      toast.error('Network handshake failure modifying role security directives.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // --- ENTERPRISE IAM & REALTIME RECONCILIATION STATES ---
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminIsLoading, setAdminIsLoading] = useState<boolean>(false);
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminRoleFilter, setAdminRoleFilter] = useState<string>('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('');
  const [adminSelectedUserObj, setAdminSelectedUserObj] = useState<any | null>(null);

  // Invite states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('OFFICER');
  const [inviteDepartment, setInviteDepartment] = useState<string>('');
  const [inviteJobTitle, setInviteJobTitle] = useState<string>('');
  const [invitePhone, setInvitePhone] = useState<string>('');
  const [inviteBranch, setInviteBranch] = useState<string>('');
  const [inviteManager, setInviteManager] = useState<string>('');

  // Confirmation modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmActionType, setConfirmActionType] = useState<'BLOCK' | 'SUSPEND' | 'ACTIVATE' | 'DELETE' | 'CHANGE_ROLE' | 'RESET_PASS' | 'REVOKE'>('BLOCK');
  const [changeRoleValue, setChangeRoleValue] = useState<string>('OFFICER');

  // My Profile Center States
  const [profileDataObj, setProfileDataObj] = useState<any | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'security' | 'devices' | 'activity' | 'notifications'>('overview');
  const [profileIsLoading, setProfileIsLoading] = useState<boolean>(false);
  const [profileSessions, setProfileSessions] = useState<any[]>([]);
  const [profileLogs, setProfileLogs] = useState<any[]>([]);
  const [profileLogsPage, setProfileLogsPage] = useState<number>(1);
  const [profileNotifySettings, setProfileNotifySettings] = useState<any>({
    securityEmails: true,
    loginAlerts: true,
    billingAlerts: false,
  });

  // Profile forms
  const [profileEditName, setProfileEditName] = useState<string>('');
  const [profileEditPhoto, setProfileEditPhoto] = useState<string>('');
  const [profilePhotoUploading, setProfilePhotoUploading] = useState<boolean>(false);
  const [profileCurrentPassword, setProfileCurrentPassword] = useState<string>('');
  const [profileNewPassword, setProfileNewPassword] = useState<string>('');
  const [adminMessage, setAdminMessage] = useState<string>('');

  // Fetch Admin Users list
  const fetchAdminUsers = async () => {
    if (!token) return;
    setAdminIsLoading(true);
    try {
      const query = new URLSearchParams({
        search: adminSearch,
        role: adminRoleFilter,
        status: adminStatusFilter,
        page: '1',
        limit: '100'
      });
      const res = await fetch(`${API_URL}/api/auth/users?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        setAdminUsers(users);
        if (users.length > 0) {
          // Keep selection synchronized with object
          const currentSelect = users.find((u: any) => u.id === adminSelectedUserObj?.id) || users[0];
          setAdminSelectedUserObj(currentSelect);
        } else {
          setAdminSelectedUserObj(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminIsLoading(false);
    }
  };

  const handleAdminExecuteBulkAction = async (action: string, selectedIds: string[], extraData?: any) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/users/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userIds: selectedIds, action, data: extraData })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Bulk operations completed successfully!`);
        if (data.failures && data.failures.length > 0) {
          toast.warning(`Some nodes logs: ${data.failures.join(', ')}`);
        }
        fetchAdminUsers();
      } else {
        toast.error(data.message || 'Bulk execution request was denied.');
      }
    } catch (err) {
      toast.error('Central security system link timed out.');
    }
  };

  // Fetch log activities & profile data
  const fetchProfileData = async () => {
    if (!token) return;
    setProfileIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileDataObj(data);
        setProfileEditName(data.name || '');
        setProfileEditPhoto(data.photoPath || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileIsLoading(false);
    }
  };

  const fetchProfileSessions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/profile/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileSessions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfileLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/profile/logs?page=${profileLogsPage}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid image type. Supported formats: PNG, JPEG, and WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File exceeds 2MB maximum size limit.');
      return;
    }

    setProfilePhotoUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/upload-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: reader.result as string,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Upload failed');

        setProfileEditPhoto(data.url);
        toast.success('Identity profile photo processed successfully!');
      } catch (err: any) {
        toast.error(`Photo processing failed: ${err.message}`);
      } finally {
        setProfilePhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileEditName,
          photoPath: profileEditPhoto
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Profile modification failed.');
      } else {
        toast.success('Your Profile details updated successfully.');
        setUser({ ...user, name: profileEditName, photoPath: profileEditPhoto });
        fetchProfileData();
        const cached = localStorage.getItem('ooms_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.name = profileEditName;
          parsed.photoPath = profileEditPhoto;
          localStorage.setItem('ooms_user', JSON.stringify(parsed));
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSecurityPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    const hasLength = profileNewPassword.length >= 12;
    const hasUpper = /[A-Z]/.test(profileNewPassword);
    const hasLower = /[a-z]/.test(profileNewPassword);
    const hasDigit = /[0-9]/.test(profileNewPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(profileNewPassword);

    if (!hasLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      toast.error('Password must satisfy the strict 12-character security rules.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/profile/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: profileCurrentPassword,
          newPassword: profileNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Verification of current passcode failed.');
      } else {
        toast.success('Passcode updated successfully.');
        setProfileCurrentPassword('');
        setProfileNewPassword('');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/profile/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Device session revoked successfully.');
        fetchProfileSessions();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Error occurred while revoking session.');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Synchronous triggers
  useEffect(() => {
    if (tempActiveSegment === 'Administration') {
      fetchAdminUsers();
    }
  }, [tempActiveSegment, adminSearch, adminRoleFilter, adminStatusFilter, token]);

  useEffect(() => {
    if (tempActiveSegment === 'Settings' && settingsTab === 'profile') {
      fetchProfileData();
      fetchProfileSessions();
      fetchProfileLogs();
    }
  }, [tempActiveSegment, settingsTab, profileLogsPage, token]);

  const handleInviteUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          department: inviteDepartment,
          jobTitle: inviteJobTitle,
          phone: invitePhone,
          branch: inviteBranch,
          manager: inviteManager
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to dispatch staff invitation.');
      } else {
        toast.success(`Invitation generated successfully and dispatched.`);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('OFFICER');
        setInviteDepartment('');
        setInviteJobTitle('');
        setInvitePhone('');
        setInviteBranch('');
        setInviteManager('');
        setIsInviteModalOpen(false);
        fetchAdminUsers();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAdminExecuteAction = async () => {
    if (!token || !adminSelectedUserObj) return;
    try {
      let actionStr = '';
      let payload: any = {};
      
      if (confirmActionType === 'BLOCK') {
        actionStr = 'BLOCK';
      } else if (confirmActionType === 'SUSPEND') {
        actionStr = 'SUSPEND';
      } else if (confirmActionType === 'ACTIVATE') {
        actionStr = 'ACTIVATE';
      } else if (confirmActionType === 'DELETE') {
        actionStr = 'DELETE';
      } else if (confirmActionType === 'CHANGE_ROLE') {
        actionStr = 'CHANGE_ROLE';
        payload.role = changeRoleValue;
      } else if (confirmActionType === 'RESET_PASS') {
        actionStr = 'RESET_PASSWORD';
      } else if (confirmActionType === 'REVOKE') {
        actionStr = 'REVOKE';
      }

      const res = await fetch(`${API_URL}/api/auth/users/${adminSelectedUserObj.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: actionStr,
          ...payload
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Governance dispatch failed.');
      } else {
        toast.success(data.message || 'Action executed successfully.');
        setConfirmModalOpen(false);
        fetchAdminUsers();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Corporate parameters settings states
  const [organizationName, setOrganizationName] = useState<string>('Federal Republic of Nigeria');
  const [branchLocation, setBranchLocation] = useState<string>('Abuja Headquarters');
  const [twoFactorAuth, setTwoFactorAuth] = useState<boolean>(true);
  const [strictCompliance, setStrictCompliance] = useState<boolean>(true);
  const [settingsMessage, setSettingsMessage] = useState<string>('');

  // Parallel fetches using TanStack Query
  const { data: summaryData, isLoading: isQueryLoading, error: queryError, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboardSummary', selectedDept, selectedLoc, selectedRange],
    queryFn: async () => {
      if (!token) return null;
      const filters = new URLSearchParams();
      if (selectedDept) filters.append('department', selectedDept);
      if (selectedLoc) filters.append('location', selectedLoc);
      if (selectedRange) filters.append('dateRange', selectedRange);

      const headers: any = {
        'Authorization': `Bearer ${token}`
      };

      const res = await fetch(`${API_URL}/api/summary?${filters.toString()}`, { headers });
      if (!res.ok) {
        throw new Error("Enterprise summary retrieval failed. Secure portal offline.");
      }
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 60000,
  });

  const { data: analyticsData, isLoading: isAnalyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      if (!token) return null;
      const headers: any = {
        'Authorization': `Bearer ${token}`
      };

      const res = await fetch(`${API_URL}/api/dashboard/analytics`, { headers });
      if (!res.ok) {
        throw new Error("Analytics retrieval failed.");
      }
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (summaryData) {
      setSummary(summaryData);
      if (aiInsights.length === 0) {
        setAiInsights(summaryData.executiveInsights || []);
      }
    }
  }, [summaryData, aiInsights.length]);

  useEffect(() => {
    setIsLoading(isQueryLoading);
  }, [isQueryLoading]);

  useEffect(() => {
    if (queryError) {
      setErrorState((queryError as Error).message);
    } else {
      setErrorState('');
    }
  }, [queryError]);

  const fetchDashboardSummary = async (showRefresher = false) => {
    if (showRefresher) setIsRefreshing(true);
    await Promise.all([refetchSummary(), refetchAnalytics()]);
    setIsRefreshing(false);
  };

  // Handle resolution of actionsRequired items
  const handleResolveAlert = async (alertId: string) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/resolve-alert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ alertId })
      });

      if (!res.ok) throw new Error("Resolution failed.");
      
      const result = await res.json();
      if (result.success) {
        // Refresh live notification logs and reloading summaries
        refetchNotifications();
        await fetchDashboardSummary(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete pending upcoming operational tasks
  const handleCompleteTask = async (taskId: string) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/complete-task`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ taskId })
      });

      if (!res.ok) throw new Error("Task checkoff failed.");

      const result = await res.json();
      if (result.success) {
        await fetchDashboardSummary(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate real server-side Gemini AI Insights based on DB states
  const handleGenerateGeminiInsights = async () => {
    setIsGeneratingAI(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/insights/generate`, {
        method: 'POST',
        headers
      });

      if (!res.ok) throw new Error("Gemini API stream failed.");
      const result = await res.json();
      
      setAiInsights(result.insights || []);
      setUsingMockInsights(result.usingMock === true);
    } catch (err) {
      console.error("Gemini failed, reverting to Rule-Based:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Trigger quick adds success
  const handleAddSuccess = async (newItem: any) => {
    // Re-fetch entire summary to update KPIs and recent timeline instantly
    await fetchDashboardSummary(true);
  };

  // Sidebar active indicators mapping
  const renderSidebarIcon = (label: string) => {
    const props = { className: "w-[18px] h-[18px] shrink-0" };
    switch (label) {
      case "Dashboard": return <LayoutDashboard {...props} />;
      case "Correspondence": return <Mail {...props} />;
      case "Subscriptions": return <Calendar {...props} />;
      case "Inventory": return <Package {...props} />;
      case "Fleet": return <Truck {...props} />;
      case "Documents": return <FileText {...props} />;
      case "Printers": return <Printer {...props} />;
      case "Printer": return <Printer {...props} />;
      case "Analytics": return <BarChart {...props} />;
      case "Administration": return <Shield {...props} />;
      case "Audit history": return <History {...props} />;
      default: return <Settings {...props} />;
    }
  };

  // Global search input submission helper
  const handleGlobalSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      const term = headerSearch.toLowerCase();
      let presetMod = "Correspondence";
      
      if (term.includes("sub") || term.includes("license")) presetMod = "Subscriptions";
      else if (term.includes("stock") || term.includes("chair") || term.includes("item") || term.includes("inv")) presetMod = "Inventory";
      else if (term.includes("fuel") || term.includes("driver") || term.includes("vehicle") || term.includes("plate") || term.includes("fleet")) presetMod = "Fleet";
      else if (term.includes("doc") || term.includes("pdf") || term.includes("file") || term.includes("con")) presetMod = "Documents";

      setTempActiveSegment(presetMod);
      setHeaderSearch('');
    }
  };

  if (!user || !token) {
    return (
      <AuthFlow 
        onLoginSuccess={handleLoginSuccess}
        darkMode={false}
        setDarkMode={() => {}}
      />
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans leading-normal transition-colors duration-200 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#FAFAF9] text-slate-900'
    }`}>
      
      {/* MOBILE DRAWER NAVIGATION */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex" id="mobile-nav-drawer-wrapper">
          {/* Backdrop */}
          <div 
            id="mobile-nav-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300"
          />
          {/* Sidebar Drawer */}
          <div 
            id="mobile-nav-drawer-body"
            className="relative flex flex-col w-[260px] max-w-xs h-full shadow-2xl transition-transform duration-300 transform translate-x-0 z-50 select-none"
            style={{ backgroundColor: 'var(--sidebar-bg)' }}
          >
            <div className="h-[72px] px-5 flex items-center justify-between border-b" style={{ borderBottomColor: 'var(--sidebar-border)' }}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-[34px] h-[34px] flex items-center justify-center font-bold text-white text-[13px] rounded-lg shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary-amber)' }}>
                  OO
                </div>
                <div className="flex flex-col text-left truncate">
                  <span className="text-xs font-extrabold leading-none tracking-tight" style={{ color: 'var(--sidebar-text)' }}>OOMS Nigeria</span>
                  <span className="text-[9px] font-mono tracking-wider uppercase mt-1" style={{ color: 'var(--sidebar-text-muted)' }}>Operations Platform</span>
                </div>
              </div>
              <button
                id="mobile-nav-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md transition-colors cursor-pointer border"
                style={{ borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-muted)' }}
              >
                <LogOut className="w-4 h-4 rotate-180" />
              </button>
            </div>

            <nav className="mt-5 px-3 space-y-1 flex-1 overflow-y-auto">
              {[
                { label: 'Dashboard', key: 'Dashboard' },
                { label: 'Correspondence', key: 'Correspondence' },
                { label: 'Inventory', key: 'Inventory' },
                { label: 'Fleet', key: 'Fleet' },
                { label: 'Subscriptions', key: 'Subscriptions' },
                { label: 'Documents', key: 'Documents' },
                { label: 'Printers', key: 'Printers' },
                { label: 'Analytics', key: 'Analytics' },
                { label: 'Administration', key: 'Administration' },
                { label: 'Audit history', key: 'AuditLogs' },
                { label: 'Settings', key: 'Settings' }
              ].filter(navItem => {
                if (navItem.key === 'Administration') {
                  const r = user?.role;
                  return r === 'SUPER_ADMIN' || r === 'ADMIN';
                }
                return true;
              }).map((navItem) => {
                const matchesActive = tempActiveSegment === navItem.key;
                return (
                  <button
                    id={`mobile-nav-btn-${navItem.key.toLowerCase()}`}
                    key={navItem.key}
                    onClick={() => {
                      setTempActiveSegment(navItem.key);
                      setMobileMenuOpen(false);
                    }}
                    className="sidebar-btn-hover w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-l-4"
                    style={{
                      borderLeftColor: matchesActive ? 'var(--primary-amber)' : 'transparent',
                      backgroundColor: matchesActive ? 'var(--sidebar-active-bg)' : 'transparent',
                      color: matchesActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                    }}
                  >
                    <span style={{ color: matchesActive ? 'var(--primary-amber)' : 'var(--sidebar-text-muted)' }}>
                      {renderSidebarIcon(navItem.label)}
                    </span>
                    <span className="truncate tracking-widest">{navItem.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t" style={{ borderTopColor: 'var(--sidebar-border)' }}>
              <button
                id="mobile-nav-logout-btn"
                onClick={handleLogout}
                className="w-full p-2.5 border rounded-lg transition-colors cursor-pointer flex items-center gap-2 justify-center"
                style={{ borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-muted)' }}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-bold" style={{ color: 'var(--sidebar-text)' }}>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* SIDEBAR NAVIGATION PANEL (REBUILT INTEGRALLY BASED ON SPEC) */}
      <aside 
        id="side-nav-rail"
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-[260px]'
        } hidden md:flex flex-col justify-between transition-all duration-300 z-20 shrink-0 select-none border-r`}
        style={{ backgroundColor: 'var(--sidebar-bg)', borderRightColor: 'var(--sidebar-border)' }}
      >
        <div>
          {/* Logo Brand / Command Tower Indicator */}
          <div className="h-[72px] px-5 flex items-center justify-between border-b" style={{ borderBottomColor: 'var(--sidebar-border)' }}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-[34px] h-[34px] flex items-center justify-center font-bold text-white text-[13px] rounded-[10px] shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary-amber)' }}>
                OO
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col text-left truncate">
                  <span className="text-xs font-extrabold leading-none tracking-tight" style={{ color: 'var(--sidebar-text)' }}>OOMS Nigeria</span>
                  <span className="text-[9px] font-mono tracking-wider uppercase mt-1" style={{ color: 'var(--sidebar-text-muted)' }}>Operations Platform</span>
                </div>
              )}
            </div>
            
            <button
              id="sidebar-toggle-btn"
              aria-label="Toggle sidebar width"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-[10px] transition-colors cursor-pointer border hover-sidebar-opaque"
              style={{ borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-muted)' }}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation modules elements (REBUILT WITH PRECISE LIGHT ORANGE ACTIVE RULES) */}
          <nav className="mt-5 px-3 space-y-1">
            {[
              { label: 'Dashboard', key: 'Dashboard' },
              { label: 'Correspondence', key: 'Correspondence' },
              { label: 'Inventory', key: 'Inventory' },
              { label: 'Fleet', key: 'Fleet' },
              { label: 'Subscriptions', key: 'Subscriptions' },
              { label: 'Documents', key: 'Documents' },
              { label: 'Printers', key: 'Printers' },
              { label: 'Analytics', key: 'Analytics' },
              { label: 'Administration', key: 'Administration' },
              { label: 'Audit history', key: 'AuditLogs' },
              { label: 'Settings', key: 'Settings' }
            ].filter(navItem => {
              if (navItem.key === 'Administration') {
                const r = user?.role;
                return r === 'SUPER_ADMIN' || r === 'ADMIN';
              }
              return true;
            }).map((navItem) => {
              const matchesActive = tempActiveSegment === navItem.key;
              return (
                <button
                  id={`side-nav-${navItem.key.toLowerCase()}`}
                  key={navItem.key}
                  onClick={() => setTempActiveSegment(navItem.key)}
                  className="sidebar-btn-hover w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-l-4"
                  style={{
                    borderLeftColor: matchesActive ? 'var(--primary-amber)' : 'transparent',
                    backgroundColor: matchesActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    color: matchesActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                  }}
                >
                  <span style={{ color: matchesActive ? 'var(--primary-amber)' : 'var(--sidebar-text-muted)' }}>
                    {renderSidebarIcon(navItem.label)}
                  </span>
                  {!sidebarCollapsed && <span className="truncate tracking-widest">{navItem.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col">
          <div className="p-4 border-t" style={{ borderTopColor: 'var(--sidebar-border)' }}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} font-sans`}>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-text-muted)' }}>
                  Admin System
                </span>
              )}
              <button
                id="sidebar-logout-btn"
                aria-label="Logout"
                onClick={handleLogout}
                className="p-2 border rounded-[10px] transition-colors cursor-pointer flex items-center gap-2 hover:text-rose-400"
                style={{ borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-muted)' }}
              >
                <LogOut className="w-4 h-4" />
                {!sidebarCollapsed && <span className="text-xs font-bold leading-none" style={{ color: 'var(--sidebar-text)' }}>Sign Out</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* CORE FRAME LAYOUT STAGE */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER STATUS LINE (HEIGHT EXACTLY 72PX) */}
        <header 
          className="h-[72px] border-b flex items-center justify-between px-4 md:px-6 z-10 shrink-0 select-none transition-colors duration-200"
          style={{ backgroundColor: 'var(--header-bg)', borderBottomColor: 'var(--header-border)' }}
        >
          
          {/* Hamburger Menu Toggle for Mobile */}
          <button
            id="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-[10px] transition-colors cursor-pointer border mr-2 hover-sidebar-opaque"
            style={{ borderColor: 'var(--header-border)', color: 'var(--header-text-muted)' }}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global query field */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--header-text-muted)' }} />
              <input
                id="header-universal-search"
                type="text"
                placeholder="Search correspondence, inventory, fleet databases..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={handleGlobalSearchKeyPress}
                className="w-full border text-xs font-semibold rounded-[12px] py-2.5 pl-10 pr-4 transition-all outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-none"
                style={{
                  backgroundColor: 'var(--header-search-bg)',
                  borderColor: 'var(--header-search-border)',
                  color: 'var(--header-search-text)'
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Quick Add Dispatch Trigger */}
            <button
               id="header-quick-add-btn"
               onClick={() => {
                 setQuickAddModule('Correspondence');
                 setQuickAddOpen(true);
               }}
               className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest py-2.5 px-4 rounded-[10px] shadow-2xs transition-all duration-150 cursor-pointer border"
               style={{
                 backgroundColor: 'var(--primary-amber)',
                 borderColor: 'var(--primary-amber)',
                 color: '#0F172A'
               }}
             >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Record</span>
            </button>

            {/* Notification triggers drawer */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                aria-label="Notifications center"
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 rounded-lg transition-colors cursor-pointer border"
                style={{ backgroundColor: 'var(--header-button-bg)', borderColor: 'var(--header-button-border)', color: 'var(--header-button-text)' }}
              >
                <Bell className="w-4 h-4" />
                {showActiveDot && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-white animate-pulse" style={{ backgroundColor: 'var(--primary-amber)' }} />
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 z-30 bg-white border border-slate-250 rounded-xl w-80 shadow-2xl p-4 animate-scaleIn text-slate-800">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-105 mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider font-display flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#EA580C]" /> 
                      Notifications ({unreadNotifications.length})
                    </span>
                    {unreadNotifications.length > 0 && (
                      <button
                        id="notifications-clear-btn"
                        onClick={handleClearAllNotifications}
                        className="text-[10px] text-[#EA580C] hover:text-[#B45309] font-bold"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                  {notificationsList.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-4 text-center animate-fadeIn">Zero active alerts</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-left">
                      {notificationsList.map((not: any) => (
                        <div
                           key={not.id}
                           onClick={() => {
                             if (!not.read) {
                               handleMarkNotificationRead(not.id);
                             }
                           }}
                           className={`p-2.5 rounded-lg border text-[11px] leading-relaxed cursor-pointer ${
                             not.read 
                               ? 'ooms-notification-read border-slate-100' 
                               : 'ooms-notification-unread border-amber-200'
                           }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span>{not.message}</span>
                            {!not.read && <span className="w-1.5 h-1.5 bg-[#EA580C] rounded-full shrink-0 mt-1" />}
                          </div>
                          <span className="block text-[9px] text-slate-400 font-mono mt-1 font-bold">
                            {new Date(not.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile info */}
            <div className="flex items-center gap-3 border-l pl-4" style={{ borderLeftColor: 'var(--header-border)' }}>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-extrabold leading-tight text-white" style={{ color: 'var(--header-text)' }}>{user.name}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--header-text-muted)' }}>
                  {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Administrator' : user.role}
                </p>
              </div>
              
              <div className="w-[36px] h-[36px] rounded-full border shadow-2xs overflow-hidden" style={{ borderColor: 'var(--header-border)' }}>
                <img 
                  src={user.photoPath || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

        </header>

        {/* ERROR / EXCEPTION HANDLING SCREEN */}
        {errorState ? (
          <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-red-50 border border-red-100 rounded-full text-red-600 mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 font-display">Operational Link Blockage</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed font-medium">
              We encountered a secure protocol failure when loading the Command room summary: "{errorState}"
            </p>
            <button
              id="error-retry-btn"
              onClick={() => fetchDashboardSummary(false)}
              className="mt-6 py-2 px-5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
            >
              Re-Establish Command Gateway
            </button>
          </div>
        ) : (
          
          /* DYNAMIC MULTI-VIEW SECTION ROUTER */
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 text-left w-full max-w-[1440px] mx-auto">
            
            {/* VIEW 1: OPERATIONS COMMAND CENTER DASHBOARD */}
            {tempActiveSegment === 'Dashboard' && (
              <>
                {/* Title introduction and global filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none">
                  <div>
                    <h1 className="page-title">
                      Good morning, {user.name ? user.name.split(' ')[0] : 'Operator'}
                    </h1>
                    <p className="page-desc">
                      Here's today's operational overview.
                    </p>
                  </div>

                  <GlobalFilters
                    selectedDept={selectedDept}
                    setSelectedDept={setSelectedDept}
                    selectedLoc={selectedLoc}
                    setSelectedLoc={setSelectedLoc}
                    selectedRange={selectedRange}
                    setSelectedRange={setSelectedRange}
                    onRefresh={() => fetchDashboardSummary(true)}
                    isRefreshing={isRefreshing}
                  />
                </div>

                {/* ROW 1: KPI CARDS (Exactly 4 Cards with custom counts metadata) */}
                <KPICardsSection
                  kpis={summary?.kpis || []}
                  onCardClick={(mod) => {
                    setTempActiveSegment(mod);
                  }}
                  isLoading={isLoading}
                />

                {/* ROW 2: MONTHLY ACTIVITY & DEPARTMENT DISTRIBUTION */}
                <AnalyticsSection
                  view="row2"
                  department={selectedDept}
                  analyticsData={analyticsData}
                  isLoading={isAnalyticsLoading}
                  isError={!!analyticsError}
                />

                {/* ROW 3: RECENT ACTIVITY, PENDING APPROVALS & INVENTORY ALERTS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-4 flex flex-col">
                    <RecentActivityFeed
                      activities={summary?.recentActivities || []}
                      isLoading={isLoading}
                    />
                  </div>
                  <div className="lg:col-span-4 flex flex-col">
                    <PendingApprovalsPanel
                      alerts={summary?.actionsRequired || []}
                      isLoading={isLoading}
                      onResolve={handleResolveAlert}
                    />
                  </div>
                  <div className="lg:col-span-4 flex flex-col">
                    <InventoryAlertsPanel
                      alerts={summary?.actionsRequired || []}
                      isLoading={isLoading}
                      onResolve={handleResolveAlert}
                    />
                  </div>
                </div>

                {/* ROW 4: FLEET UTILIZATION & FUEL CONSUMPTION */}
                <AnalyticsSection
                  view="row4"
                  department={selectedDept}
                  analyticsData={analyticsData}
                  isLoading={isAnalyticsLoading}
                  isError={!!analyticsError}
                />

                {/* ROW 5: SPECIAL QUICK OPERATIONS DISPATCH PANEL */}
                <QuickActionsPanel
                  onQuickAction={(id) => {
                    setQuickAddModule(id as OOMSModule);
                    setQuickAddOpen(true);
                  }}
                />

                {/* TASK CHECKLISTS & EXECUTIVE INSIGHTS MODULE HEALTH */}
                <div className="grid grid-cols-12 gap-6 font-display">
                  
                  <div className="col-span-12 lg:col-span-7">
                    <UpcomingTasksSection
                      tasks={summary?.upcomingTasks || []}
                      onComplete={handleCompleteTask}
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Executive Insights AI-ready engine briefing */}
                  <div className="col-span-12 lg:col-span-5">
                    <ExecutiveInsightsSection
                      insights={aiInsights}
                      onRegenerate={handleGenerateGeminiInsights}
                      isLoading={isLoading}
                      isGeneratingAI={isGeneratingAI}
                      usingMock={usingMockInsights}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 font-sans">
                  {/* Segment Health tracking scores progress bars */}
                  <div className="col-span-12">
                    <ModuleHealthSection
                      healthData={summary?.moduleHealth || []}
                      isLoading={isLoading}
                    />
                  </div>
                </div>

                {/* Command Center Footer feedback */}
                <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none gap-4">
                  <div>
                    System State: Nominal
                  </div>
                  <div>
                    &copy; {new Date().getFullYear()} OOMS Nigeria Administrative System • Abuja Headquarters
                  </div>
                </footer>
              </>
            )}

            {/* VIEW 2: DEDICATED STANDALONE ANALYTICS VIEW */}
            {tempActiveSegment === 'Analytics' && (
              <div className="space-y-6">
                <div>
                  <h1 className="page-title">
                    Operational Intelligence & Analytics
                  </h1>
                  <p className="page-desc">
                    Comprehensive chronological analytics tracking ministerial correspondence volumes, asset stock indexes, and fleet transportation parameters.
                  </p>
                </div>

                {/* Render full, detailed standalone analytics view with tabs */}
                <AnalyticsSection 
                  standalone={true} 
                  analyticsData={analyticsData}
                  isLoading={isAnalyticsLoading}
                  isError={!!analyticsError}
                />
              </div>
            )}            {/* VIEW 3: DEDICATED ADMINISTRATION PAGE */}
            {tempActiveSegment === 'Administration' && (() => {
              const numActiveUsers = adminUsers.filter(u => u.status?.toUpperCase() === 'ACTIVE').length;
              const numPendingInvitations = adminUsers.filter(u => u.status?.toUpperCase() === 'INVITED').length;
              const numLockedAccounts = adminUsers.filter(u => u.status?.toUpperCase() === 'LOCKED' || u.status?.toUpperCase() === 'SUSPENDED').length;
              const numActiveSessions = adminUsers.filter(u => u.status?.toUpperCase() === 'ACTIVE').length + 1;

              return (
                <div className="space-y-8 max-w-7xl mx-auto animate-fadeIn text-left min-h-screen bg-[#F8FAFC] p-6 sm:p-8 rounded-2xl border border-[#E4E7EC]">
                  
                  {/* SECTION 1: PAGE HEADER - Clean, non-neon, sophisticated executive toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                    <div>
                      <h1 className="text-2xl font-bold text-[#101828] tracking-tight font-sans">
                        Identity & Access Management (IAM)
                      </h1>
                      <p className="text-xs text-[#475467] font-medium mt-1 leading-relaxed">
                        Manage central personnel directory records, role clearance metrics, and security workstation logs.
                      </p>
                    </div>
                    
                    {/* Action Toolbar on the Right */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto select-none">
                      {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                        <button
                          id="iam-invite-user-trigger"
                          onClick={() => setIsInviteModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5A623] hover:bg-[#D97706] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Invite Staff
                        </button>
                      )}
                      
                      <button
                        onClick={fetchAdminUsers}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-[#101828] border border-[#E4E7EC] text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                        title="Re-fetch Personnel Directory"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#475467]" />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* SECTION 2: METRICS ROW - Enterprise summaries matching left sidebar style */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Active Users */}
                    <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-2">
                      <span className="text-[10px] font-extrabold text-[#475467] tracking-wider uppercase">Active Users</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#101828]">{numActiveUsers}</span>
                        <span className="text-[11px] font-bold text-[#12B76A] bg-[#ECFDF3] border border-[#ABEFC6] px-1.5 py-0.2 rounded-md">Live</span>
                      </div>
                    </div>

                    {/* Card 2: Pending Invitations */}
                    <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-2">
                      <span className="text-[10px] font-extrabold text-[#475467] tracking-wider uppercase">Pending Invitations</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#101828]">{numPendingInvitations}</span>
                        <span className="text-[11px] font-bold text-[#F5A623] bg-[#FFFBF5] border border-amber-200 px-1.5 py-0.2 rounded-md">Expected</span>
                      </div>
                    </div>

                    {/* Card 3: Locked Accounts */}
                    <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-2">
                      <span className="text-[10px] font-extrabold text-[#475467] tracking-wider uppercase">Locked Accounts</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#101828]">{numLockedAccounts}</span>
                        <span className="text-[11px] font-bold text-[#F04438] bg-[#FFFBFA] border border-rose-100 px-1.5 py-0.2 rounded-md">Restricted</span>
                      </div>
                    </div>

                    {/* Card 4: Active Workstation Sessions */}
                    <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-2">
                      <span className="text-[10px] font-extrabold text-[#475467] tracking-wider uppercase">Active Workstations</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#101828]">{numActiveSessions}</span>
                        <span className="text-[11px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-1.5 py-0.2 rounded-md">Sessions</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: NAVIGATION SUB-TABS */}
                  <div className="border-b border-[#E4E7EC] flex gap-8 overflow-x-auto scrollbar-none select-none">
                    {([
                      { id: 'Users', label: 'Users Directory' },
                      { id: 'Security', label: 'Security & Access Logs' },
                      { id: 'Roles', label: 'Clearance Roles' },
                      { id: 'Permissions', label: 'System Permissions Matrix' }
                    ] as const).map((tab) => {
                      const isActive = adminSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          id={`iam-tab-btn-${tab.id.toLowerCase()}`}
                          onClick={() => setAdminSubTab(tab.id)}
                          className={`py-3.5 px-0.5 text-xs font-extrabold tracking-widest uppercase transition-all duration-150 cursor-pointer whitespace-nowrap border-b-2 relative -mb-[2px] ${
                            isActive
                              ? 'border-[#F5A623] text-[#101828]'
                              : 'border-transparent text-[#475467] hover:text-[#101828]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* SUB-TABS CONTENT AREA */}
                  {adminSubTab === 'Users' && (
                    <>
                      <UserDirectoryTable 
                        users={adminUsers || []}
                        currentUser={user}
                        onSelectUser={setAdminSelectedUserObj}
                        selectedUser={adminSelectedUserObj}
                        onRefresh={fetchAdminUsers}
                        token={token}
                        onBulkAction={handleAdminExecuteBulkAction}
                      />

                      <UserDetailsDrawer 
                        user={adminSelectedUserObj}
                        isOpen={adminSelectedUserObj !== null}
                        onClose={() => setAdminSelectedUserObj(null)}
                        token={token}
                        onRefreshParent={fetchAdminUsers}
                        currentUser={user}
                      />
                    </>
                  )}

                  {adminSubTab === 'Security' && (
                    <LoginHistoryCenter token={token} />
                  )}                  {adminSubTab === 'Roles' && (
                  <div className="space-y-6 text-left">
                    {/* SECTION 4.1: Clearance Roles Header with Left Orange Accent Border */}
                    <div className="bg-white border-l-4 border-l-[#F59E0B] border-y border-r border-[#E4E7EC] p-6 rounded-r-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                      <div>
                        <h3 className="text-base font-bold text-[#111827] font-sans">
                          Clearance Roles
                        </h3>
                        <p className="text-xs text-[#6B7280] font-medium mt-1 leading-relaxed">
                          Configure dynamic permission levels and clearance credentials across specific officer tiers.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {isRolesLoading ? (
                        <div className="col-span-full py-16 text-center text-[#6B7280] font-semibold animate-pulse">
                          Retrieving system role definitions and authorization matrices...
                        </div>
                      ) : (
                        adminRoles?.map((r: any) => (
                          <div 
                            key={r.id} 
                            className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between border-b pb-3.5 border-[#E5E7EB] mb-4">
                                <span className="text-xs font-extrabold px-3 py-1 bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74] rounded-lg font-mono">
                                  {r.name}
                                </span>
                                <span className="text-xs font-bold text-[#6B7280]">
                                  {r.userCount} Officers Active
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-[#6B7280] leading-relaxed mb-4">
                                {r.description}
                              </p>
                              
                              <div className="space-y-2.5 mt-4 text-left">
                                <h4 className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">
                                  Active authorization clearance actions:
                                </h4>
                                <div className="flex flex-wrap gap-1.5Packed">
                                  {Object.keys(r.permissions).length === 0 ? (
                                    <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md font-semibold">
                                      No action permissions assigned
                                    </span>
                                  ) : (
                                    Object.keys(r.permissions).map((act) => (
                                      <span 
                                        key={act} 
                                        className="text-[10px] bg-[#FFF7ED] border border-[#FDBA74] text-[#C2410C] hover:bg-[#F59E0B] hover:text-white px-2.5 py-1 rounded-md font-mono font-bold uppercase transition-all duration-150"
                                      >
                                        {act.split('_').slice(1).join(' ') || act}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>

                            {user.role === 'SUPER_ADMIN' && (
                              <button
                                id={`role-edit-btn-${r.name.toLowerCase()}`}
                                onClick={() => {
                                  setEditingRole(r);
                                  setSelectedPermKeys(Object.keys(r.permissions));
                                }}
                                className="mt-6 w-full py-2.5 bg-white hover:bg-[#FFF7ED] hover:text-[#C2415C] hover:border-[#FDBA74] text-[#6B7280] border border-[#E4E7EC] text-xs font-bold rounded-lg shadow-xs transition-all duration-200 cursor-pointer text-center"
                              >
                                Reconfigure Clearances
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Clearances Editor Sidebar/Drawer Panel */}
                    {editingRole && (
                      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-[999] animate-fadeIn">
                        <div className="w-full max-w-sm bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft text-slate-900 border-l border-[#E5E7EB]">
                          <div className="space-y-6 text-left">
                            <div className="border-b pb-4 border-[#E5E7EB]">
                              <h3 className="text-base font-extrabold tracking-tight text-[#111827] uppercase font-display">
                                Reconfigure {editingRole.name} Clearances
                              </h3>
                              <p className="text-xs text-[#6B7280] font-medium mt-1">
                                Establish high-security dynamic clearances for this specific system role node.
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase text-[#6B7280] font-mono">Role Description:</label>
                              <textarea
                                value={editingRole.description || ''}
                                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                                className="w-full text-xs p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg outline-hidden text-[#111827] font-semibold min-h-[80px] focus:border-[#F59E0B]"
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-extrabold uppercase text-[#6B7280] font-mono tracking-wider block">
                                Assign System Module Permissions:
                              </label>
                              
                              <div className="space-y-1.5 border border-[#E5E7EB] rounded-xl p-3 bg-[#F8FAFC] overflow-y-auto max-h-[320px]">
                                {adminPermissions?.map((p: any) => {
                                  const hasPerm = selectedPermKeys.includes(p.action);
                                  return (
                                    <label key={p.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#FFF7ED] cursor-pointer transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={hasPerm}
                                        onChange={() => {
                                          if (hasPerm) {
                                            setSelectedPermKeys(selectedPermKeys.filter(k => k !== p.action));
                                          } else {
                                            setSelectedPermKeys([...selectedPermKeys, p.action]);
                                          }
                                        }}
                                        className="mt-0.5 accent-[#F59E0B]"
                                      />
                                      <div>
                                        <div className="text-xs font-bold text-[#111827] uppercase font-mono">
                                          {p.action}
                                        </div>
                                        <div className="text-[10px] text-[#6B7280] font-semibold leading-relaxed">
                                          {p.description} (Module: {p.module})
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4 border-[#E5E7EB] flex gap-2">
                            <button
                              onClick={() => setEditingRole(null)}
                              className="flex-1 py-1.5 border border-[#E5E7EB] text-[#6B7280] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdateRolePermissions}
                              disabled={isUpdatingRole}
                              className="flex-1 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {isUpdatingRole && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                              Synchronize
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminSubTab === 'Permissions' && (
                  <div className="space-y-6 text-left">
                    {/* SECTION 4.2: System Permissions Header with Left Orange Accent Border */}
                    <div className="bg-white border-l-4 border-l-[#F59E0B] border-y border-r border-[#E4E7EC] p-6 rounded-r-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                      <div>
                        <h3 className="text-base font-bold text-[#111827] font-sans">
                          System Permissions Matrix
                        </h3>
                        <p className="text-xs text-[#6B7280] font-medium mt-1 leading-relaxed">
                          Master log of authorization coordinates, tracking dynamic permissions configurations across operational nodes.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">
                          Master Dynamic Clearance Matrix ({adminPermissions?.length || 0} permissions logged)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#6B7280] font-mono text-[10px] font-bold uppercase select-none">
                              <th className="py-3 px-4">Permission ID Coordinate</th>
                              <th className="py-3 px-4">System Module Node</th>
                              <th className="py-3 px-4">Action Clearance Level</th>
                              <th className="py-3 px-4">Verification Description Documentation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isPermissionsLoading ? (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-[#6B7280] font-mono animate-pulse">
                                  Syncing clearances registry metadata...
                                </td>
                              </tr>
                            ) : (
                              adminPermissions?.map((p: any) => (
                                <tr key={p.id} className="border-b border-[#E5E7EB] hover:bg-[#FFFBEB] transition-colors">
                                  <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                                    {p.id}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280] rounded-md font-mono text-[10px] font-bold uppercase">
                                      {p.module}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74]">
                                      {p.action}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-[#6B7280] font-semibold">
                                    {p.description}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL 1: Invite User Dialog */}
                {isInviteModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
                    <form
                      onSubmit={handleInviteUserSubmit}
                      className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 w-full max-w-2xl shadow-2xl space-y-4 animate-scaleIn text-slate-900"
                    >
                      <div className="border-b border-[#E5E7EB] pb-3 flex items-center justify-between">
                        <h3 className="text-sm font-extrabold flex items-center gap-1.5 text-[#111827]">
                          <UserPlus className="w-4.5 h-4.5 text-[#F59E0B]" /> Ingest & Invite Staff Member
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsInviteModalOpen(false)}
                          className="text-[#6B7280] hover:text-[#111827] text-xs font-mono font-bold cursor-pointer"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Full Name</label>
                            <input
                              type="text"
                              required
                              value={inviteName}
                              onChange={(e) => setInviteName(e.target.value)}
                              placeholder="E.g. Alex Rivera"
                              className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Registry Mail Address</label>
                            <input
                              type="email"
                              required
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="officer@ooms.com"
                              className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Security clearance role</label>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B] font-bold cursor-pointer"
                            >
                              <option value="SUPER_ADMIN">SUPER_ADMIN (Cabinet Admin)</option>
                              <option value="ADMIN">ADMIN (Registry Admin)</option>
                              <option value="MANAGER">MANAGER (Branch Manager)</option>
                              <option value="OFFICER">OFFICER (Operations Officer)</option>
                              <option value="VIEWER">VIEWER (Compliance Viewer)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Department Name</label>
                            <input
                              type="text"
                              value={inviteDepartment}
                              onChange={(e) => setInviteDepartment(e.target.value)}
                              placeholder="E.g. Aviation, Procurement"
                              className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Job Title / Rank</label>
                            <input
                              type="text"
                              value={inviteJobTitle}
                              onChange={(e) => setInviteJobTitle(e.target.value)}
                              placeholder="E.g. Senior Aviation Auditor II"
                              className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Telephone Contact</label>
                            <input
                              type="text"
                              value={invitePhone}
                              onChange={(e) => setInvitePhone(e.target.value)}
                              placeholder="E.g. +234 803 1234 567"
                              className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Optional meta drawer */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left border-t border-[#E5E7EB] pt-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">State Branch / Station</label>
                          <input
                            type="text"
                            value={inviteBranch}
                            onChange={(e) => setInviteBranch(e.target.value)}
                            placeholder="E.g. Abuja HQ, Lagos Regional"
                            className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Designated Direct Manager</label>
                          <input
                            type="text"
                            value={inviteManager}
                            onChange={(e) => setInviteManager(e.target.value)}
                            placeholder="E.g. Director Mallam Ibrahim"
                            className="w-full text-xs rounded-lg py-2.5 px-3 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] outline-hidden focus:border-[#F59E0B]"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-3 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => setIsInviteModalOpen(false)}
                          className="px-4 py-2 border border-[#E5E7EB] hover:bg-slate-50 rounded-lg text-[#6B7280] text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                        >
                          Send Invitation Link
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* MODAL 2: Action Confirmation Dynamic Dialog */}
                {confirmModalOpen && adminSelectedUserObj && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn text-slate-800">
                    <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 w-full max-w-sm shadow-2xl space-y-4 animate-scaleIn text-left">
                      <div className="border-b pb-2 border-[#E5E7EB]">
                        <h3 className="text-sm font-extrabold text-[#D97706] uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#D97706]" /> Secure Dispatch Confirm
                        </h3>
                      </div>
                      
                      <p className="text-xs leading-relaxed text-[#6B7280]">
                        Confined protocol audit: Are you sure you wish to dispatch action <strong className="text-[#111827]">{confirmActionType}</strong> for profile: <strong className="text-[#111827]">{adminSelectedUserObj.name}</strong>?
                      </p>

                      {confirmActionType === 'CHANGE_ROLE' && (
                        <div className="space-y-1.5 bg-[#F8FAFC] p-3 rounded-lg border border-[#E5E7EB] text-left">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] font-mono">Set Clearance levels:</label>
                          <select
                            value={changeRoleValue}
                            onChange={(e) => setChangeRoleValue(e.target.value)}
                            className="bg-white border border-[#E5E7EB] text-xs font-bold p-2 w-full rounded-md cursor-pointer"
                          >
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="OFFICER">OFFICER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-3 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => setConfirmModalOpen(false)}
                          className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg font-bold hover:bg-slate-50 text-[11px] text-[#6B7280] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminExecuteAction}
                          className="px-4 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-xs transition-colors"
                        >
                          Execute action
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

            {/* VIEW 4: DEDICATED SETTINGS PAGE */}
            {tempActiveSegment === 'Settings' && (
              <div className="space-y-8">
                <div>
                  <h1 className="page-title">
                    Enterprise Portal Settings
                  </h1>
                  <p className="page-desc font-semibold">
                    Observe national system profiles, adjust branch nodes configurations, toggle global compliance lanes, and clean transaction trails.
                  </p>
                </div>

                {settingsMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg font-bold">
                    ✓ {settingsMessage}
                  </div>
                )}

                {/* Settings Sub-navigation Tabs */}
                <div className="flex border-b border-slate-200 mt-4 gap-6 select-none dark:border-slate-800">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                      settingsTab === 'general'
                        ? 'border-[#F59E0B] text-slate-900 dark:text-white font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    General & Compliance
                  </button>
                  <button
                    id="settings-appearance-tab"
                    onClick={() => setSettingsTab('appearance')}
                    className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                      settingsTab === 'appearance'
                        ? 'border-[#F59E0B] text-slate-900 dark:text-white font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Appearance Theme
                  </button>
                  <button
                    id="settings-profile-tab"
                    onClick={() => setSettingsTab('profile')}
                    className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
                      settingsTab === 'profile'
                        ? 'border-[#F59E0B] text-slate-900 dark:text-white font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Personal Profile Center
                  </button>
                </div>

                {/* TAB 1: GENERAL & COMPLIANCE PANEL */}
                {settingsTab === 'general' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl animate-fadeIn">
                    
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 shadow-xs text-left space-y-6">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
                        Registry Node Identity Profile
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">State Organization Name</label>
                          <input
                            type="text"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            className="w-full text-xs rounded-lg py-2.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:border-[#F59E0B] outline-hidden font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Registry Branch Node location</label>
                          <input
                            type="text"
                            value={branchLocation}
                            onChange={(e) => setBranchLocation(e.target.value)}
                            className="w-full text-xs rounded-lg py-2.5 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:border-[#F59E0B] outline-hidden font-bold"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setSettingsMessage('State identity profile updated successfully on Abuja ledger.')}
                        className="py-2.5 px-5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs uppercase tracking-widest rounded-lg cursor-pointer"
                      >
                        Save Profile Adjustments
                      </button>
                    </div>

                    {/* Right Column: Compliance Parameters */}
                    <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 shadow-xs text-left space-y-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
                          National Compliance Parameters
                        </h3>

                        <div className="space-y-5 mt-4">
                          <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Security handshakes</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Require security code tokens on login.</p>
                            </div>
                            <button
                              onClick={() => {
                                setTwoFactorAuth(!twoFactorAuth);
                                setSettingsMessage(`Two factor handshake configuration adjusted.`);
                              }}
                              className={`w-12 h-6 px-1 py-1 rounded-full flex items-center transition-all ${
                                twoFactorAuth ? 'bg-[#F29F05] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                              }`}
                            >
                              <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Strict Classification Markings</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Enforce RESTRICTED markings on uploads.</p>
                            </div>
                            <button
                              onClick={() => {
                                setStrictCompliance(!strictCompliance);
                                setSettingsMessage(`Strict document categorization settings adjusted.`);
                              }}
                              className={`w-12 h-6 px-1 py-1 rounded-full flex items-center transition-all ${
                                strictCompliance ? 'bg-[#F29F05] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                              }`}
                            >
                              <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[#E5E7EB] dark:border-slate-805 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[10px]">Registry Node Backup: Synced on Abuja AWS S3</span>
                        <button
                          onClick={() => {
                            setSettingsMessage('System cache pruned. Database VM slices rebuilt successfully.');
                          }}
                          className="p-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 dark:border-slate-800 hover:text-[#D97706] font-bold text-xs cursor-pointer"
                        >
                          Prune Database Cache
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: APPEARANCE THEMES */}
                {settingsTab === 'appearance' && (
                  <div className="space-y-6 max-w-6xl animate-fadeIn">
                    <div className="p-6 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl text-left">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-3 mb-6 flex items-center gap-2">
                        System Layout Workspace Themes
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Theme 1 */}
                        <div 
                          onClick={() => setActiveTheme('slate')}
                          className={`relative overflow-hidden rounded-xl border p-5 text-left cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col justify-between h-[210px] bg-white dark:bg-slate-900 ${
                            activeTheme === 'slate' ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-[#E5E7EB] dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Slate & Amber</h4>
                              {activeTheme === 'slate' && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              Traditional dark-slate commands rail paired with high-contrast amber accents. Sleek, professional, and dark-themed navigation.
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#0F172A' }} title="Sidebar: Slate" />
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#0F172A' }} title="Header: Slate" />
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#F59E0B' }} title="Accent: Amber" />
                            <span className="text-[10px] text-slate-400 font-mono font-bold ml-auto">Slate Default</span>
                          </div>
                        </div>

                        {/* Theme 2 */}
                        <div 
                          onClick={() => setActiveTheme('amber')}
                          className={`relative overflow-hidden rounded-xl border p-5 text-left cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col justify-between h-[210px] bg-white dark:bg-slate-900 ${
                            activeTheme === 'amber' ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-[#E5E7EB] dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Executive Amber</h4>
                              {activeTheme === 'amber' && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              Warm executive amber brand rail with pristine slate contrast. Highly energetic and compliant with sovereign administrative branding.
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#F59E0B' }} title="Sidebar: Amber" />
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#F59E0B' }} title="Header: Amber" />
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#0F172A' }} title="Accent: Slate" />
                            <span className="text-[10px] text-slate-400 font-mono font-bold ml-auto font-bold text-amber-600">Executive</span>
                          </div>
                        </div>

                        {/* Theme 3 */}
                        <div 
                          onClick={() => setActiveTheme('hybrid')}
                          className={`relative overflow-hidden rounded-xl border p-5 text-left cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col justify-between h-[210px] bg-white dark:bg-slate-900 ${
                            activeTheme === 'hybrid' ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20' : 'border-[#E5E7EB] dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Hybrid Executive</h4>
                              {activeTheme === 'hybrid' && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active (Hybrid)</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">
                              Modern hybrid interface offering dark-slate side navigation for focus, and executive amber header command block. Optimal ergonomics.
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#0F172A' }} title="Sidebar: Slate" />
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#F59E0B' }} title="Header: Amber" />
                            <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: '#F59E0B' }} title="Accent: Amber" />
                            <span className="text-[10px] text-slate-400 font-mono font-bold ml-auto font-bold text-amber-600">Hybrid</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 3: PERSONAL PROFILE CENTER & 5-TAB IAM CONTROL */}
                {settingsTab === 'profile' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl animate-fadeIn text-left">
                    
                    {/* Left Rail: Tab Selector */}
                    <div className="lg:col-span-3 space-y-2 border-r border-slate-150 pr-4 dark:border-slate-800">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono select-none px-2 mb-3">Profile Tabs</h4>
                      {[
                        { id: 'overview', label: 'Identity Overview', icon: User },
                        { id: 'security', label: 'Access Security', icon: Shield },
                        { id: 'devices', label: 'Connected Devices', icon: Laptop },
                        { id: 'activity', label: 'My Login History', icon: History },
                        { id: 'notifications', label: 'Alert Notifications', icon: Bell }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isTabSelected = profileActiveTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setProfileActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                              isTabSelected 
                                ? 'bg-[#F59E0B]/10 text-[#EA580C] font-extrabold border-l-4 border-l-[#F59E0B]' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-450 dark:hover:text-white dark:hover:bg-slate-850'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Rail: Dynamic content cards depending on profileActiveTab */}
                    <div className="lg:col-span-9 bg-white dark:bg-slate-950 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 shadow-xs">
                      
                      {/* SUBVIEW 1: IDENTITY OVERVIEW */}
                      {profileActiveTab === 'overview' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                              Personnel Identity & Photo Manager
                            </h3>
                          </div>

                          <form onSubmit={handleProfileUpdateSubmit} className="space-y-6">
                            
                            {/* Photo upload avatar seed */}
                            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#FAFAF9] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <div className="relative w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                                {profileEditPhoto ? (
                                  <img src={profileEditPhoto} alt="profile" className="w-full h-full object-cover" />
                                ) : profilePhotoUploading ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 dark:border-white border-t-transparent" />
                                ) : (
                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="profile" />
                                )}
                              </div>
                              <div className="flex-1 text-center sm:text-left space-y-2 relative">
                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Active Profile Photo Management</h4>
                                <p className="text-[10px] text-slate-400">Drag and drop or click to upload (PNG, JPEG, WebP - max 2MB limit).</p>
                                
                                <div className="flex gap-2 items-center">
                                  <div className="relative overflow-hidden bg-slate-900 hover:bg-slate-800 text-white font-mono text-[10px] uppercase font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors max-w-max">
                                    <span>Browse Photo</span>
                                    <input
                                      type="file"
                                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                                      onChange={handleProfilePhotoUpload}
                                      disabled={profilePhotoUploading}
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={profileEditPhoto}
                                    onChange={(e) => setProfileEditPhoto(e.target.value)}
                                    placeholder="Direct Photo URL / Asset Coordinate"
                                    className="flex-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 py-1.5 px-2.5 outline-hidden text-slate-700 dark:text-slate-350"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Core text attributes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Full Registry Name</label>
                                <input
                                  type="text"
                                  required
                                  value={profileEditName}
                                  onChange={(e) => setProfileEditName(e.target.value)}
                                  className="w-full text-xs rounded-lg py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white font-bold"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Registered Mail Identity</label>
                                <input
                                  type="email"
                                  disabled
                                  value={user.email}
                                  className="w-full text-xs rounded-lg py-2.5 px-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 font-mono font-bold select-none cursor-not-allowed"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Clearance Permission levels</label>
                                <div className="text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 font-bold font-mono">
                                  {user.role} (Secure Level Authorized)
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Database Account Node ID</label>
                                <div className="text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 font-mono select-all">
                                  {user.id}
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="py-2.5 px-5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs uppercase tracking-widest rounded-lg cursor-pointer"
                            >
                              Commit Profile Updates
                            </button>
                          </form>
                        </div>
                      )}

                      {/* SUBVIEW 2: ACCESS SECURITY */}
                      {profileActiveTab === 'security' && (
                        <div className="space-y-6 animate-fadeIn text-left">
                          <div className="border-b border-slate-100 dark:border-slate-802 pb-3 mb-4">
                            <h3 className="text-sm font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                              <Shield className="w-4 h-4 text-[#F59E0B]" /> Access Credentials Security
                            </h3>
                            <p className="text-[11px] text-[#64748B] mt-0.5">Enforces the national cabinet strong passcode safety policies.</p>
                          </div>

                          {/* Strong Password criteria list card */}
                          <div className="p-4 bg-[#FAFAF9] dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-xl space-y-2 text-xs leading-relaxed">
                            <span className="font-extrabold text-amber-800">Strict Cabinet Password Policy Requirements:</span>
                            <ul className="space-y-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              <li className="flex items-center gap-1.5">
                                <span className={profileNewPassword.length >= 12 ? "text-emerald-500" : "text-slate-350 font-black"}>●</span>
                                At least 12 total digits minimum (Current: {profileNewPassword.length})
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[A-Z]/.test(profileNewPassword) ? "text-emerald-500" : "text-slate-350 font-black"}>●</span>
                                Must include uppercase letters (A-Z)
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[a-z]/.test(profileNewPassword) ? "text-emerald-500" : "text-slate-350 font-black"}>●</span>
                                Must include lowercase letters (a-z)
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[0-9]/.test(profileNewPassword) ? "text-emerald-500" : "text-slate-350 font-black"}>●</span>
                                Must include numbers (0-9)
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className={/[^A-Za-z0-9]/.test(profileNewPassword) ? "text-emerald-500" : "text-slate-350 font-black"}>●</span>
                                Must include special characters (e.g. @, #, $, %, !)
                              </li>
                            </ul>
                          </div>

                          <form onSubmit={handleSecurityPasswordSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Current Secure Passcode</label>
                              <input
                                type="password"
                                required
                                value={profileCurrentPassword}
                                onChange={(e) => setProfileCurrentPassword(e.target.value)}
                                className="w-full text-xs rounded-lg py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                placeholder="••••••••••••••"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">New Strong Passcode</label>
                              <input
                                type="password"
                                required
                                value={profileNewPassword}
                                onChange={(e) => setProfileNewPassword(e.target.value)}
                                className="w-full text-xs rounded-lg py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                placeholder="••••••••••••••"
                              />
                            </div>

                            <button
                              type="submit"
                              className="py-2.5 px-5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs uppercase tracking-widest rounded-lg cursor-pointer"
                            >
                              Dispatch security keys update
                            </button>
                          </form>
                        </div>
                      )}

                      {/* SUBVIEW 3: CONNECTED DEVICES */}
                      {profileActiveTab === 'devices' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="border-b border-slate-100 dark:border-slate-802 pb-3 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                              Connected Devices & Auth Sessions
                            </h3>
                          </div>

                          <p className="text-xs text-[#64748B]">
                            Observe active browser/device tokens connected to your OOMS Nigeria profile. You may revoke access handshakes individually.
                          </p>

                          <div className="space-y-3">
                            {profileSessions.length === 0 ? (
                              <p className="text-slate-400 font-mono text-[11px] text-center py-6">Re-pooling session descriptors list...</p>
                            ) : (
                              profileSessions.map((sess) => (
                                <div key={sess.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-650 dark:text-slate-350">
                                      <Laptop className="w-5 h-5" />
                                    </div>
                                    <div className="text-left space-y-0.5">
                                      <span className="font-mono text-xs font-extrabold block text-slate-900 dark:text-white">
                                        IP: {sess.ipAddress || '197.210.64.12'} (Location: Abuja)
                                      </span>
                                      <span className="text-[10px] text-slate-400 block">
                                        Agent: {sess.userAgent.substring(0, 48)}...
                                      </span>
                                      <span className="text-[10px] text-[#A1A1AA] font-mono block">
                                        Last accessed: {new Date(sess.lastUsed).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8.5px] font-bold rounded-full">
                                      Active State
                                    </span>
                                    <button
                                      onClick={() => handleRevokeSession(sess.id)}
                                      className="py-1 px-2.5 bg-rose-50 hover:bg-rose-105 text-rose-700 border border-rose-200 text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      Revoke
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* SUBVIEW 4: MY LOGIN HISTORY */}
                      {profileActiveTab === 'activity' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="border-b border-slate-100 dark:border-slate-802 pb-3 mb-4">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                              Identity Activity logs Histroy
                            </h3>
                            <p className="text-[11px] text-[#64748B] mt-0.5 font-semibold">Track chronological user login events, coordinate security alerts, and protect database states.</p>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#FAFAF9] dark:bg-slate-900 border-b border-slate-100 dark:border-slate-820 text-slate-400 font-mono text-[9px] font-bold uppercase select-none">
                                  <th className="py-2.5 px-3">Date Timestamp</th>
                                  <th className="py-2.5 px-3">Protocol Event Action</th>
                                  <th className="py-2.5 px-3">Device metadata</th>
                                  <th className="py-2.5 px-3">Location IP address</th>
                                </tr>
                              </thead>
                              <tbody>
                                {profileLogs.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 font-mono">No records logging history.</td>
                                  </tr>
                                ) : (
                                  profileLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-350">{new Date(log.timestamp).toLocaleString()}</td>
                                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white uppercase tracking-wider font-sans text-[10px]">
                                        <span className={`px-2 py-0.5 rounded text-[9px] ${
                                          log.action === 'LOGIN_SUCCESS' ? 'bg-emerald-50 text-emerald-800' :
                                          log.action === 'LOGIN_FAILED' ? 'bg-rose-50 text-rose-800 animate-pulse' :
                                          'bg-amber-50 text-amber-800'
                                        }`}>
                                          {log.action}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-450">{log.userAgent ? log.userAgent.substring(0, 40) : 'Google AI Studio'}...</td>
                                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-300">{log.ipAddress || '197.210.64.12'}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* SUBVIEW 5: ALERT NOTIFICATIONS */}
                      {profileActiveTab === 'notifications' && (
                        <div className="space-y-6 animate-fadeIn text-left">
                          <div className="border-b border-slate-105 dark:border-slate-802 pb-3 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-slate-905 dark:text-white uppercase tracking-wider">
                              Incident alert channel configures
                            </h3>
                          </div>

                          <p className="text-xs text-[#64748B]">
                            Verify and configure immediate notification alerts dispatched dynamically to Resend-integrated cabinet nodes.
                          </p>

                          <div className="space-y-4">
                            {[
                              { key: 'securityEmails', label: 'Security clearances modification warnings', desc: 'Trigger Resend dispatch whenever role adjustments occur on OOMS.' },
                              { key: 'loginAlerts', label: 'Suspicious country login handshakes', desc: 'Sends immediate verification links upon account access outside Abuja.' },
                              { key: 'billingAlerts', label: 'Administrative token cycle dispatches', desc: 'Alerts SUPER_AMDIN when pending documents or invitations approach lifetime cycles.' }
                            ].map((pref) => (
                              <div key={pref.key} className="p-3.5 border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between gap-4">
                                <div className="space-y-0.5 text-left">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{pref.label}</h4>
                                  <p className="text-[10px] text-[#64748B] dark:text-slate-400">{pref.desc}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfileNotifySettings({
                                      ...profileNotifySettings,
                                      [pref.key]: !profileNotifySettings[pref.key]
                                    });
                                    toast.success('Channel preference saved securely.');
                                  }}
                                  className={`w-11 h-5 px-0.5 py-0.5 rounded-full flex items-center transition-all ${
                                    profileNotifySettings[pref.key] ? 'bg-[#F29F05] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                                  }`}
                                >
                                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                )}
              </div>
            )}

            {/* VIEW 5: EMBEDDED REGISTRY DATABASES (CORRESPONDENCE, INVENTORY, FLEET, SUBSCRIPTIONS, DOCUMENTS) */}
            {tempActiveSegment !== 'Dashboard' && tempActiveSegment !== 'Analytics' && tempActiveSegment !== 'Administration' && tempActiveSegment !== 'Settings' && tempActiveSegment !== 'Printers' && (
              <div className="space-y-6">
                <div>
                  <h1 className="page-title">
                     {tempActiveSegment === 'Documents' 
                       ? 'Enterprise Document Management' 
                       : tempActiveSegment === 'AuditLogs'
                       ? 'Audit History Registry Ledger'
                       : `${tempActiveSegment} Registry Ledger`}
                  </h1>
                  <p className="page-desc">
                    {tempActiveSegment === 'Documents'
                      ? 'Secure corporate compliance storage with live previews, major/minor state approvals, and modular S3/GCS providers.'
                      : tempActiveSegment === 'AuditLogs'
                      ? 'Chronological corporate operational activity trail tracking national systems parameters and user actions.'
                      : 'Authorized operations dashboard registry mapped dynamically over secure state databases.'}
                  </p>
                </div>

                {/* Conditional rendering for Documents vs default module list */}
                {tempActiveSegment === 'Documents' ? (
                  <DocumentWorkspace
                    globalDept={selectedDept}
                    globalLoc={selectedLoc}
                  />
                ) : tempActiveSegment === 'Correspondence' ? (
                  <CorrespondenceWorkspace
                    globalDept={selectedDept}
                    globalLoc={selectedLoc}
                  />
                ) : (
                  <EmbeddedRegistryView
                    moduleName={tempActiveSegment}
                    globalDept={selectedDept}
                    globalLoc={selectedLoc}
                    onTriggerQuickAdd={(mod) => {
                      setQuickAddModule(mod);
                      setQuickAddOpen(true);
                    }}
                  />
                )}
              </div>
            )}

            {/* VIEW 6: DEDICATED REAL-TIME PRINTER OPERATIONAL MONITORING COMMAND BRIDGE */}
            {tempActiveSegment === 'Printers' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h1 className="page-title">
                     Printer Operations Command Bridge
                  </h1>
                  <p className="page-desc">
                    Real-time network operational monitoring system with diagnostic telemetry and protocol-level connectors.
                  </p>
                </div>

                <PrintersDashboardView
                  globalDept={selectedDept}
                  globalLoc={selectedLoc}
                  onTriggerQuickAdd={(mod) => {
                    setQuickAddModule(mod);
                    setQuickAddOpen(true);
                  }}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* POPUP: OLD POPUP MODAL EXPLORER AS BACKUP TRANSITION / GLOBAL SECTIONS SEARCH OUTLET */}
      {browserModalOpen && (
        <RecordBrowserModal
          initialModule={browserInitialMod}
          onClose={() => setBrowserModalOpen(false)}
          globalDept={selectedDept}
          globalLoc={selectedLoc}
        />
      )}

      {/* POPUP: SECURED DISPATCH INCIDENT ADD RECORD MODAL */}
      {quickAddOpen && (
        <QuickAddModal
          moduleName={quickAddModule}
          onClose={() => setQuickAddOpen(false)}
          onSuccess={handleAddSuccess}
        />
      )}

    </div>
  );
}
