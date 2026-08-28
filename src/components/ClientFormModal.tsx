import React, { useState, useEffect } from 'react';
import { Client, User } from '../types';
import { validateGSTIN } from '../utils/gstValidation';
import { X, Check, Building, AlertCircle, Sparkles } from 'lucide-react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => { success: boolean; error?: string };
  editClient?: Client | null;
  users: User[];
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editClient,
  users,
}) => {
  const [formData, setFormData] = useState({
    gstin: '',
    firm_name: '',
    client_name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin_code: '',
    gst_type: 'regular' as 'regular' | 'composition',
    assigned_staff_id: '' as string | number,
    registration_date: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const [gstinFeedback, setGstinFeedback] = useState<{ isValid: boolean; error?: string; stateName?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (editClient) {
      setFormData({
        gstin: editClient.gstin,
        firm_name: editClient.firm_name,
        client_name: editClient.client_name,
        mobile: editClient.mobile,
        alternate_mobile: editClient.alternate_mobile || '',
        email: editClient.email || '',
        address: editClient.address || '',
        city: editClient.city || '',
        state: editClient.state || '',
        pin_code: editClient.pin_code || '',
        gst_type: editClient.gst_type,
        assigned_staff_id: editClient.assigned_staff_id || '',
        registration_date: editClient.registration_date || '',
        status: editClient.status,
        notes: editClient.notes || '',
      });
      setGstinFeedback(validateGSTIN(editClient.gstin));
    } else {
      setFormData({
        gstin: '',
        firm_name: '',
        client_name: '',
        mobile: '',
        alternate_mobile: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pin_code: '',
        gst_type: 'regular',
        assigned_staff_id: '',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: '',
      });
      setGstinFeedback(null);
    }
    setErrorMessage('');
  }, [editClient, isOpen]);

  if (!isOpen) return null;

  const handleGSTINChange = (val: string) => {
    const formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setFormData((prev) => ({ ...prev, gstin: formatted }));

    if (formatted.length >= 2) {
      const valResult = validateGSTIN(formatted);
      setGstinFeedback(valResult);
      if (valResult.stateName && !formData.state) {
        setFormData((prev) => ({ ...prev, state: valResult.stateName! }));
      }
    } else {
      setGstinFeedback(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const valResult = validateGSTIN(formData.gstin);
    if (!valResult.isValid) {
      setErrorMessage(valResult.error || 'Invalid GSTIN number format.');
      return;
    }

    if (!formData.firm_name.trim()) {
      setErrorMessage('Firm / Trade name is required.');
      return;
    }

    if (!formData.client_name.trim()) {
      setErrorMessage('Client contact person name is required.');
      return;
    }

    if (!formData.mobile.trim() || formData.mobile.length < 10) {
      setErrorMessage('A valid 10-digit mobile number is required.');
      return;
    }

    const payload = {
      ...formData,
      gstin: formData.gstin.toUpperCase().trim(),
      assigned_staff_id: formData.assigned_staff_id ? Number(formData.assigned_staff_id) : undefined,
    };

    const res = onSave(payload);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save client.');
    } else {
      onClose();
    }
  };

  const staffMembers = users.filter((u) => u.role === 'staff' && u.status === 'active');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editClient ? 'Edit Master Client' : 'Add New Master Client'}
              </h3>
              <p className="text-xs text-slate-500">
                Master client records are permanent and used across all financial years.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: GSTIN, Scheme, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-bold text-slate-700 mb-1">
                GSTIN (15 Digits) <span className="text-rose-500">*</span>
              </label>
              <input
                id="client-form-gstin-input"
                type="text"
                maxLength={15}
                placeholder="27AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={(e) => handleGSTINChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase tracking-wider"
                required
              />
              {gstinFeedback && (
                <div
                  className={`text-[10px] mt-1 font-semibold flex items-center gap-1 ${
                    gstinFeedback.isValid ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {gstinFeedback.isValid ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Valid GSTIN ({gstinFeedback.state})</span>
                    </>
                  ) : (
                    <span>{gstinFeedback.error}</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                GST Scheme <span className="text-rose-500">*</span>
              </label>
              <select
                id="client-form-scheme-select"
                value={formData.gst_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gst_type: e.target.value as 'regular' | 'composition',
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="regular">Regular (GSTR-1/3B)</option>
                <option value="composition">Composition (CMP-08)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Client Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="client-form-status-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as 'active' | 'inactive',
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="active">Active (Filing Regular)</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          {/* Row 2: Firm Name & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Firm / Trade Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="client-form-firm-name-input"
                type="text"
                placeholder="e.g. Apex Infotech Solutions"
                value={formData.firm_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, firm_name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Client Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                id="client-form-client-name-input"
                type="text"
                placeholder="e.g. Rajesh Nair"
                value={formData.client_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Row 3: Mobile, Alternate Mobile, Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="client-form-mobile-input"
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mobile: e.target.value.replace(/[^0-9]/g, ''),
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alternate Phone</label>
              <input
                type="tel"
                placeholder="Optional"
                value={formData.alternate_mobile}
                onChange={(e) => setFormData((prev) => ({ ...prev, alternate_mobile: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="client@domain.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Row 4: Address, City, State, PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                placeholder="Office or shop address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Row 5: Assigned Staff, Registration Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Staff Member</label>
              <select
                id="client-form-staff-select"
                value={formData.assigned_staff_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, assigned_staff_id: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">-- Unassigned --</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Registration Date</label>
              <input
                type="date"
                value={formData.registration_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, registration_date: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="Add client-specific notes, portal login tips or filing instructions..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              id="client-form-submit-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editClient ? 'Update Master Client' : 'Save Master Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
