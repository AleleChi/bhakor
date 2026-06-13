import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Calendar, 
  Package, 
  Fuel, 
  FileText, 
  Check, 
  Save,
  Loader
} from 'lucide-react';
import { toast } from 'sonner';
import { OOMSModule } from '../types';
import { API_URL } from '../lib/api';

interface QuickAddModalProps {
  moduleName: OOMSModule;
  onClose: () => void;
  onSuccess: (newItem: any) => void;
}

export default function QuickAddModal({ moduleName, onClose, onSuccess }: QuickAddModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  const currentYear = new Date().getFullYear();

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorText('');

    try {
      const token = localStorage.getItem('ooms_token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add simple inline form checks
      if (moduleName === 'Correspondence' && !formData.subject) {
        throw new Error("Subject / File Title is required.");
      }
      if (moduleName === 'Subscriptions' && !formData.serviceName) {
        throw new Error("Service Name is required.");
      }
      if (moduleName === 'Inventory' && (!formData.itemName || !formData.sku)) {
        throw new Error("Equipment Name and SKU Number are required.");
      }

      const res = await fetch(`${API_URL}/api/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          moduleName,
          payload: formData
        })
      });

      if (!res.ok) {
        const payloadErr = await res.json().catch(() => ({}));
        throw new Error(payloadErr.message || "Failed to add record to system registry. Validate inputs.");
      }

      const result = await res.json();
      if (result.success) {
        let msg = `${moduleName} record created successfully`;
        if (moduleName === 'Correspondence') msg = "Correspondence record created successfully";
        else if (moduleName === 'Inventory') msg = "Inventory item added successfully";
        else if (moduleName === 'Printer') msg = "Printer registered successfully";
        else if (moduleName === 'Documents') msg = "Document uploaded successfully";

        toast.success(msg, {
          style: {
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            color: '#0F172A',
          }
        });

        onSuccess(result.item);
        onClose();
      } else {
        throw new Error(result.error || "Registry rejected request.");
      }
    } catch (err: any) {
      const finalMsg = err.message || "Unable to save record";
      setErrorText(finalMsg);
      toast.error(finalMsg, {
        style: {
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          color: '#EF4444',
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = () => {
    const inputStyle = "w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] rounded-xl text-xs font-semibold focus:bg-white text-slate-800 transition-all outline-hidden";
    const labelStyle = "text-[10px] font-bold uppercase tracking-wider text-slate-500 block select-none";

    switch (moduleName) {
      case "Correspondence":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cor-type-select" className={labelStyle}>Dispatch Direction</label>
                <select
                  id="cor-type-select"
                  required
                  value={formData.type || 'Incoming'}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className={inputStyle}
                >
                  <option value="Incoming">Incoming Mail</option>
                  <option value="Outgoing">Outgoing Mail</option>
                </select>
              </div>
              <div>
                <label htmlFor="cor-tracking-field" className={labelStyle}>Tracking code</label>
                <input
                  id="cor-tracking-field"
                  type="text"
                  placeholder="e.g. TRK-209844"
                  value={formData.trackingNumber || ''}
                  onChange={(e) => handleFieldChange('trackingNumber', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>

            <div>
              <label htmlFor="cor-subject-field" className={labelStyle}>Subject / File Title</label>
              <input
                id="cor-subject-field"
                type="text"
                required
                placeholder="e.g. Executive Disbursement Audit Receipt Copy"
                value={formData.subject || ''}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cor-sender-field" className={labelStyle}>Originating Sender</label>
                <input
                  id="cor-sender-field"
                  type="text"
                  required
                  placeholder="e.g. Ministry of Land & Housing"
                  value={formData.sender || ''}
                  onChange={(e) => handleFieldChange('sender', e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="cor-recipient-field" className={labelStyle}>Primary Recipient</label>
                <input
                  id="cor-recipient-field"
                  type="text"
                  required
                  placeholder="e.g. Director OOMS Finance"
                  value={formData.recipient || ''}
                  onChange={(e) => handleFieldChange('recipient', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cor-dept-select" className={labelStyle}>Department Assignee</label>
                <select
                  id="cor-dept-select"
                  value={formData.department || 'Operations'}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                  className={inputStyle}
                >
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Logistics">Logistics</option>
                  <option value="IT Support">IT Support</option>
                </select>
              </div>
              <div>
                <label htmlFor="cor-loc-select" className={labelStyle}>Office Location</label>
                <select
                  id="cor-loc-select"
                  value={formData.location || 'North Wing'}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  className={inputStyle}
                >
                  <option value="North Wing">North Wing</option>
                  <option value="South Wing">South Wing</option>
                  <option value="HQ Seventh Floor">HQ Seventh Floor</option>
                  <option value="Annex Building">Annex Building</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "Subscriptions":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="sub-name-field" className={labelStyle}>Service License Name</label>
              <input
                id="sub-name-field"
                type="text"
                required
                placeholder="e.g. Atlassian Jira Enterprise Standard"
                value={formData.serviceName || ''}
                onChange={(e) => handleFieldChange('serviceName', e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="sub-provider-field" className={labelStyle}>Subscription Provider</label>
              <input
                id="sub-provider-field"
                type="text"
                required
                placeholder="e.g. Atlassian Software Inc Pty"
                value={formData.provider || ''}
                onChange={(e) => handleFieldChange('provider', e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sub-cost-field" className={labelStyle}>Monthly/Annual Cost (USD)</label>
                <input
                  id="sub-cost-field"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 195.00"
                  value={formData.cost || ''}
                  onChange={(e) => handleFieldChange('cost', e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="sub-cycle-select" className={labelStyle}>Billing Cycle</label>
                <select
                  id="sub-cycle-select"
                  value={formData.billingCycle || 'Monthly'}
                  onChange={(e) => handleFieldChange('billingCycle', e.target.value)}
                  className={inputStyle}
                >
                  <option value="Monthly">Monthly Cycle</option>
                  <option value="Annual">Annual Cycle</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 select-none">
              <input
                id="sub-autorenew-checkbox"
                type="checkbox"
                checked={formData.autoRenew === true}
                onChange={(e) => handleFieldChange('autoRenew', e.target.checked)}
                className="w-4 h-4 text-[#EA580C] border-slate-250 focus:ring-0 rounded-md cursor-pointer"
              />
              <label htmlFor="sub-autorenew-checkbox" className="text-xs text-slate-600 font-semibold cursor-pointer">
                Configure auto-renewal with primary credit line active
              </label>
            </div>
          </div>
        );

      case "Inventory":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inv-category-select" className={labelStyle}>Supply Category</label>
                <select
                  id="inv-category-select"
                  value={formData.category || 'Office Supplies'}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className={inputStyle}
                >
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Hardware">IT Hardware</option>
                  <option value="Cleaning">Cleaning & Sanitary</option>
                  <option value="Breakroom">Breakroom</option>
                </select>
              </div>
              <div>
                <label htmlFor="inv-sku-field" className={labelStyle}>SKU Identification Code</label>
                <input
                  id="inv-sku-field"
                  type="text"
                  placeholder="e.g. SKU-809224"
                  value={formData.sku || ''}
                  onChange={(e) => handleFieldChange('sku', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>

            <div>
              <label htmlFor="inv-name-field" className={labelStyle}>Item description</label>
              <input
                id="inv-name-field"
                type="text"
                required
                placeholder="e.g. Keychron Q1 Knob Edition Keyboard"
                value={formData.itemName || ''}
                onChange={(e) => handleFieldChange('itemName', e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="inv-stock-field" className={labelStyle}>Initial stock</label>
                <input
                  id="inv-stock-field"
                  type="number"
                  required
                  placeholder="e.g. 100"
                  value={formData.stock || ''}
                  onChange={(e) => handleFieldChange('stock', e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="inv-min-field" className={labelStyle}>Min Threshold</label>
                <input
                  id="inv-min-field"
                  type="number"
                  required
                  placeholder="e.g. 15"
                  value={formData.minThreshold || ''}
                  onChange={(e) => handleFieldChange('minThreshold', e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="inv-unit-field" className={labelStyle}>Unit Metric</label>
                <input
                  id="inv-unit-field"
                  type="text"
                  required
                  placeholder="e.g. Units, Reams"
                  value={formData.unit || 'Units'}
                  onChange={(e) => handleFieldChange('unit', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>
        );

      case "Fuel":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fuel-plate-field" className={labelStyle}>Vehicle Plate</label>
                <input
                  id="fuel-plate-field"
                  type="text"
                  required
                  placeholder="e.g. KCA 401A"
                  value={formData.vehiclePlate || ''}
                  onChange={(e) => handleFieldChange('vehiclePlate', e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="fuel-type-field" className={labelStyle}>Vehicle Type</label>
                <input
                  id="fuel-type-field"
                  type="text"
                  placeholder="e.g. Ford Ranger Pick-up"
                  value={formData.vehicleType || ''}
                  onChange={(e) => handleFieldChange('vehicleType', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fuel-liters-field" className={labelStyle}>Refueling Liters</label>
                <input
                  id="fuel-liters-field"
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 45.0"
                  value={formData.liters || ''}
                  onChange={(e) => handleFieldChange('liters', e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="fuel-total-field" className={labelStyle}>Total dispatch Cost (USD)</label>
                <input
                  id="fuel-total-field"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 68.45"
                  value={formData.totalCost || ''}
                  onChange={(e) => handleFieldChange('totalCost', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fuel-driver-field" className={labelStyle}>Responsible Driver</label>
                <input
                  id="fuel-driver-field"
                  type="text"
                  required
                  placeholder="e.g. David K."
                  value={formData.driver || ''}
                  onChange={(e) => handleFieldChange('driver', e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="fuel-vendor-field" className={labelStyle}>Retail Station Vendor</label>
                <input
                  id="fuel-vendor-field"
                  type="text"
                  placeholder="e.g. Shell Station HQ"
                  value={formData.vendor || ''}
                  onChange={(e) => handleFieldChange('vendor', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>
        );

      case "Documents":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="doc-filename-field" className={labelStyle}>Target File Name</label>
              <input
                id="doc-filename-field"
                type="text"
                required
                placeholder="e.g. Consolidated_Financials_2026.pdf"
                value={formData.fileName || ''}
                onChange={(e) => handleFieldChange('fileName', e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="doc-category-select" className={labelStyle}>Document Category</label>
                <select
                  id="doc-category-select"
                  value={formData.category || 'Contract'}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className={inputStyle}
                >
                  <option value="Contract">Legal Contract</option>
                  <option value="Invoice">Supplier Invoice</option>
                  <option value="Policy">Corporate Policy</option>
                  <option value="Manual">Training Manual</option>
                  <option value="Confidential">Confidential Audit</option>
                </select>
              </div>
              <div>
                <label htmlFor="doc-class-select" className={labelStyle}>Classification</label>
                <select
                  id="doc-class-select"
                  value={formData.classification || 'Internal'}
                  onChange={(e) => handleFieldChange('classification', e.target.value)}
                  className={inputStyle}
                >
                  <option value="Public">Public Access</option>
                  <option value="Internal">Internal Only</option>
                  <option value="Restricted">Restricted (Flagged Logged)</option>
                </select>
              </div>
              <div>
                <label htmlFor="doc-size-field" className={labelStyle}>File Size (KB)</label>
                <input
                  id="doc-size-field"
                  type="number"
                  required
                  placeholder="e.g. 480"
                  value={formData.sizeKb || ''}
                  onChange={(e) => handleFieldChange('sizeKb', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-45 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <form 
        onSubmit={handleFormSubmit}
        className="bg-white rounded-none sm:rounded-3xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] p-5 sm:p-6 flex flex-col gap-4 relative text-left overflow-hidden"
      >
        
        {/* Header content */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-[#EA580C] rounded-xl border border-amber-100">
              {moduleName === "Correspondence" && <Mail className="w-5 h-5" />}
              {moduleName === "Subscriptions" && <Calendar className="w-5 h-5" />}
              {moduleName === "Inventory" && <Package className="w-5 h-5" />}
              {moduleName === "Fuel" && <Fuel className="w-5 h-5" />}
              {moduleName === "Documents" && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">
                Log New {moduleName} Record
              </h2>
              <p className="text-[11px] text-[#64748B] font-medium leading-none mt-1">
                Fill out the fields below to add a new record
              </p>
            </div>
          </div>

          <button
            type="button"
            id="quickadd-close-btn"
            onClick={onClose}
            className="p-1 px-2.5 text-slate-400 hover:text-slate-705 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message banner */}
        {errorText && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-xs font-semibold">
            {errorText}
          </div>
        )}

        {/* Fields rendering center with responsive scroll containment */}
        <div className="flex-1 overflow-y-auto min-h-[180px] pr-1 py-1 select-none">
          {renderFields()}
        </div>

        {/* Action button rows with mobile stacking support */}
        <div className="flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-100 pt-4 mt-auto">
          <button
            type="button"
            id="quickadd-cancel-btn"
            onClick={onClose}
            className="w-full sm:w-auto text-center p-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#0F172A] rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            id="quickadd-submit-btn"
            disabled={isSubmitting}
            className="w-full sm:w-auto p-2.5 px-5 bg-slate-900 hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold cursor-pointer shadow flex items-center justify-center gap-1.5 transition-all select-none disabled:opacity-55"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Entry</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
