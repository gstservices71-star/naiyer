import React from 'react';
import { Client, FinancialYear, FY_MONTHS, MonthlyWork, User } from '../types';
import {
  FileSpreadsheet,
  Printer,
  FileDown,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

interface ReportsProps {
  clients: Client[];
  monthlyWork: MonthlyWork[];
  financialYears: FinancialYear[];
  selectedFY: FinancialYear;
  selectedMonth: string;
  users: User[];
  onExportCSV: () => void;
}

export const Reports: React.FC<ReportsProps> = ({
  clients,
  monthlyWork,
  financialYears,
  selectedFY,
  selectedMonth,
  users,
  onExportCSV,
}) => {
  const activeClients = clients.filter((c) => c.status === 'active');
  const staffUsers = users.filter((u) => u.role === 'staff' && u.status === 'active');

  const currentMonthWork = monthlyWork.filter(
    (m) => m.financial_year_id === selectedFY.id && m.month === selectedMonth
  );
  const workMap = new Map<number, any>();
  currentMonthWork.forEach((w) => workMap.set(w.client_id, w));

  // Staff stats
  const staffStats = staffUsers.map((staff) => {
    const assigned = activeClients.filter((c) => c.assigned_staff_id === staff.id);
    let completed = 0;
    let pending = 0;
    let notStarted = 0;

    assigned.forEach((c) => {
      const rec = workMap.get(c.id);
      const st = rec ? rec.status : 'Not Started';
      if (st === 'Completed') completed++;
      else if (st === 'Not Started') notStarted++;
      else pending++;
    });

    const pct = assigned.length > 0 ? Math.round((completed / assigned.length) * 100) : 0;

    return {
      staff,
      total: assigned.length,
      completed,
      pending,
      notStarted,
      pct,
    };
  });

  // 12-Month Matrix
  const monthlyMatrix = FY_MONTHS.map((m) => {
    const monthRecs = monthlyWork.filter(
      (mw) => mw.financial_year_id === selectedFY.id && mw.month === m
    );
    const comp = monthRecs.filter((r) => r.status === 'Completed').length;
    const pend = monthRecs.filter((r) => r.status !== 'Completed' && r.status !== 'Not Started').length;
    const notSt = activeClients.length - comp - pend;

    return {
      month: m,
      completed: comp,
      pending: pend,
      notStarted: Math.max(0, notSt),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">GST Compliance Reports & Analytics</h2>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              FY {selectedFY.display_name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Staff workload, completion ratios, and 12-month historical progression breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Monthly CSV</span>
          </button>
        </div>
      </div>

      {/* Staff Performance Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>Staff Workload & Performance ({selectedMonth})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3 text-center">Total Clients</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Pending / In-Progress</th>
                <th className="px-4 py-3 text-center">Not Started</th>
                <th className="px-4 py-3" style={{ width: '30%' }}>Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffStats.map((st) => (
                <tr key={st.staff.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{st.staff.name}</div>
                    <div className="text-[11px] text-slate-500">{st.staff.email}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{st.total}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600">{st.completed}</td>
                  <td className="px-4 py-3 text-center font-bold text-amber-600">{st.pending}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{st.notStarted}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${st.pct}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-800 text-[11px] w-10 text-right">
                        {st.pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 12-Month Year Progress Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>12-Month Completion Progression (FY {selectedFY.display_name})</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {monthlyMatrix.map((m) => {
            const isSelected = m.month === selectedMonth;
            const pct =
              activeClients.length > 0 ? Math.round((m.completed / activeClients.length) * 100) : 0;

            return (
              <div
                key={m.month}
                className={`p-3.5 rounded-xl border text-xs ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">{m.month}</span>
                  <span className="font-bold text-emerald-600 text-[11px]">{pct}%</span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Filed:</span>
                    <strong className="text-emerald-700">{m.completed}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <strong className="text-amber-700">{m.pending}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
