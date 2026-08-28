import React, { useState } from 'react';
import { Client, FinancialYear, FY_MONTHS, MonthlyWork, User, WorkHistory, WorkStatus } from '../types';
import {
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  Clock,
  History,
  FileSpreadsheet,
  ArrowRight,
  Edit2,
  CalendarCheck,
} from 'lucide-react';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  financialYears: FinancialYear[];
  selectedFY: FinancialYear;
  monthlyWork: MonthlyWork[];
  workHistory: WorkHistory[];
  users: User[];
  onOpenEdit: (client: Client) => void;
  onNavigateToMonthlyWork: (gstin: string) => void;
}

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  isOpen,
  onClose,
  client,
  financialYears,
  selectedFY,
  monthlyWork,
  workHistory,
  users,
  onOpenEdit,
  onNavigateToMonthlyWork,
}) => {
  const [activeFYId, setActiveFYId] = useState<number>(selectedFY.id);

  if (!isOpen || !client) return null;

  const activeFY = financialYears.find((f) => f.id === activeFYId) || selectedFY;

  // Monthly work for this client in the chosen FY
  const clientFYWork = monthlyWork.filter(
    (m) => m.client_id === client.id && m.financial_year_id === activeFY.id
  );
  const workMap = new Map<string, MonthlyWork>();
  clientFYWork.forEach((w) => workMap.set(w.month, w));

  // Client status history
  const clientHistory = workHistory.filter((h) => h.client_id === client.id);

  const staffName = client.assigned_staff_id
    ? users.find((u) => u.id === client.assigned_staff_id)?.name || 'Unassigned'
    : 'Unassigned';

  const getStatusBadge = (status: WorkStatus) => {
    const styleMap: Record<WorkStatus, string> = {
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Not Started': 'bg-slate-100 text-slate-700 border-slate-200',
      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
      'Bill Pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'Tax Payment Pending': 'bg-rose-100 text-rose-800 border-rose-200',
      'Documents Pending': 'bg-purple-100 text-purple-800 border-purple-200',
      'Client Response Pending': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      Other: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
          styleMap[status] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{client.firm_name}</h3>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {client.gstin}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    client.gst_type === 'regular'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {client.gst_type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contact: <strong className="text-slate-700">{client.client_name}</strong> • Phone:{' '}
                <strong className="text-slate-700">{client.mobile}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenEdit(client);
              }}
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit Client"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Master Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[11px] block">Contact & Email</span>
              <div className="font-semibold text-slate-800 mt-0.5">{client.mobile}</div>
              <div className="text-slate-500 text-[11px]">{client.email || 'No email provided'}</div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Assigned Staff & Status</span>
              <div className="font-semibold text-slate-800 mt-0.5">{staffName}</div>
              <div className="text-slate-500 text-[11px] capitalize">Status: {client.status}</div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Location & Address</span>
              <div className="font-semibold text-slate-800 mt-0.5 truncate">
                {client.city ? `${client.city}, ${client.state || ''}` : client.state || '-'}
              </div>
              <div className="text-slate-500 text-[11px] truncate">
                {client.address || 'No street address'}
              </div>
            </div>
          </div>

          {client.notes && (
            <div className="bg-amber-50/70 border border-amber-200 text-amber-900 p-3 rounded-xl">
              <strong className="block mb-0.5">Special Filing Instructions / Notes:</strong>
              <p className="text-slate-700">{client.notes}</p>
            </div>
          )}

          {/* 12-Month Matrix Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  12-Month Compliance Matrix ({activeFY.display_name})
                </h4>
              </div>

              {/* FY Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                <span className="text-slate-500 text-[11px] font-medium">Switch FY:</span>
                <select
                  value={activeFYId}
                  onChange={(e) => setActiveFYId(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                >
                  {financialYears.map((fy) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-3.5 py-2.5">Month</th>
                    <th className="px-3.5 py-2.5">Work Status</th>
                    <th className="px-3.5 py-2.5">Remark / Note</th>
                    <th className="px-3.5 py-2.5 text-right">Updated By / Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {FY_MONTHS.map((m) => {
                    const record = workMap.get(m);
                    const status: WorkStatus = record ? record.status : 'Not Started';

                    return (
                      <tr key={m} className="hover:bg-slate-50/60">
                        <td className="px-3.5 py-2 font-bold text-slate-800">{m}</td>
                        <td className="px-3.5 py-2">{getStatusBadge(status)}</td>
                        <td className="px-3.5 py-2 text-slate-600">
                          {record?.remark || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-3.5 py-2 text-right text-slate-400 text-[11px]">
                          {record?.updated_at ? (
                            <span>
                              {record.updated_at.split(' ')[0]} by{' '}
                              <strong className="text-slate-600">
                                {record.updated_by_name || 'Staff'}
                              </strong>
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit History */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h4 className="font-bold text-slate-900 text-sm">Status Audit Trail</h4>
            </div>

            {clientHistory.length === 0 ? (
              <p className="text-slate-400 italic text-xs">No status change history recorded yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {clientHistory.slice(0, 10).map((h) => (
                  <div
                    key={h.id}
                    className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {h.fy_name} - {h.month}:
                      </span>{' '}
                      <span className="text-slate-500">{h.previous_status}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="font-bold text-slate-900">{h.new_status}</span>
                      {h.remark && <span className="text-slate-600 ml-2">"{h.remark}"</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {h.changed_at} by {h.changed_by_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onNavigateToMonthlyWork(client.gstin);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <span>Open in Monthly Work Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
