import React, { useState } from 'react';
import { AppSettings, FinancialYear, FY_MONTHS } from '../types';
import { GSTStorage } from '../utils/storage';
import { Settings, RefreshCw, Check, AlertTriangle, ShieldCheck, Database } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  financialYears: FinancialYear[];
  onResetDatabase: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  financialYears,
  onResetDatabase,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedMessage, setSavedMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedMessage('Settings updated successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleReset = () => {
    onResetDatabase();
    setConfirmReset(false);
    setSavedMessage('Database reset to initial demonstration state.');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>System & Portal Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize CA firm branding, default tax compliance defaults, and security configurations.
        </p>
      </div>

      {savedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              CA Firm / Company Trade Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData((p) => ({ ...p, company_name: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Admin Notification Email
              </label>
              <input
                type="email"
                value={formData.admin_email}
                onChange={(e) => setFormData((p) => ({ ...p, admin_email: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Financial Year</label>
              <select
                value={formData.default_fy_id}
                onChange={(e) => setFormData((p) => ({ ...p, default_fy_id: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {financialYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={formData.timezone}
                disabled
                className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date Display Format</label>
              <input
                type="text"
                value={formData.date_format}
                disabled
                className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Reset Database Section */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6">
        <h3 className="font-bold text-rose-900 text-sm mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Reset Demo Database</span>
        </h3>
        <p className="text-xs text-rose-700 mb-4">
          Reset all in-browser storage, mock clients, and monthly records back to clean initial seed data.
        </p>

        {confirmReset ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
            >
              Yes, Reset Everything Now
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-xs px-4 py-2 rounded-xl shadow-2xs"
          >
            Reset to Default Seed
          </button>
        )}
      </div>
    </div>
  );
};
