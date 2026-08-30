import React, { useState } from 'react';
import { Client, FinancialYear, MonthlyWork, User, WorkStatus, FY_MONTHS } from '../types';
import {
  Users,
  CheckCircle2,
  Clock,
  Send,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface UserDashboardProps {
  currentUser: User;
  clients: Client[];
  monthlyWork: MonthlyWork[];
  selectedFY: FinancialYear;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onNavigateToMonthlyWork: (filter?: string) => void;
  onUpdateStatus: (fyId: number, month: string, clientId: number, status: WorkStatus, remark: string) => void;
  onRefresh?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  clients,
  monthlyWork,
  selectedFY,
  selectedMonth,
  onSelectMonth,
  onNavigateToMonthlyWork,
  onUpdateStatus,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };
  // Filter clients assigned to this user (or all if none assigned yet)
  const myClients = clients.filter(
    (c) => c.assigned_staff_id === currentUser.id && c.status === 'active'
  );

  const displayClients = myClients.length > 0 ? myClients : clients.filter((c) => c.status === 'active');

  const myClientIds = new Set(displayClients.map((c) => c.id));

  // Current month work for these clients
  const currentMonthWork = monthlyWork.filter(
    (w) => w.financial_year_id === selectedFY.id && w.month === selectedMonth && myClientIds.has(w.client_id)
  );

  const completedCount = currentMonthWork.filter((w) => w.status === 'Completed').length;
  const pendingCount = currentMonthWork.filter(
    (w) =>
      w.status === 'Pending' ||
      w.status === 'Bill Pending' ||
      w.status === 'Tax Payment Pending' ||
      w.status === 'Documents Pending' ||
      w.status === 'Client Response Pending'
  ).length;
  const notStartedCount = displayClients.length - completedCount - pendingCount;

  const completionRate = displayClients.length > 0 ? Math.round((completedCount / displayClients.length) * 100) : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl border border-blue-900/40 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Staff Workspace
              </span>
              <span className="text-xs text-slate-400">FY {selectedFY.display_name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {currentUser.name}!</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {myClients.length > 0
                ? `You have ${myClients.length} assigned master clients for monthly compliance.`
                : 'Showing all master clients. Your admin will assign specific clients to your account.'}
            </p>
          </div>

          {/* Month Quick Picker & Refresh Button */}
          <div className="flex items-center gap-2">
            <button
              id="staff-dashboard-refresh-btn"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-xs"
              title="Refresh Staff Portal Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-blue-300'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-300 font-medium pl-1">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                {FY_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Clients</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{displayClients.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active business entities</div>
        </div>

        {/* Completed */}
        <div
          onClick={() => onNavigateToMonthlyWork('Completed')}
          className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed ({selectedMonth})</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{completedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">{completionRate}% compliance</div>
        </div>

        {/* In Progress / Pending */}
        <div
          onClick={() => onNavigateToMonthlyWork('Pending')}
          className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 mt-1">Pending / Doc collection</div>
        </div>

        {/* Not Started */}
        <div
          onClick={() => onNavigateToMonthlyWork('Not Started')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Not Started</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700 mt-2">{notStartedCount > 0 ? notStartedCount : 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting initiation</div>
        </div>
      </div>

      {/* Fast Status Update Table for User */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>
                My Work List for {selectedMonth} (FY {selectedFY.display_name})
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change filing status and add compliance remarks directly below.
            </p>
          </div>

          <button
            onClick={() => onNavigateToMonthlyWork()}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            <span>Open Full Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Client Firm</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">GST Type</th>
                <th className="px-4 py-3">Return Status</th>
                <th className="px-4 py-3">Remark / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayClients.slice(0, 10).map((client) => {
                const work = currentMonthWork.find((w) => w.client_id === client.id);
                const currentStatus: WorkStatus = work ? work.status : 'Not Started';
                const currentRemark = work ? work.remark : '';

                return (
                  <tr key={client.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{client.firm_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{client.gstin}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                        {client.gst_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          onUpdateStatus(
                            selectedFY.id,
                            selectedMonth,
                            client.id,
                            e.target.value as WorkStatus,
                            currentRemark
                          )
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors ${
                          currentStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : currentStatus === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : currentStatus === 'Documents Pending'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : currentStatus === 'Tax Payment Pending'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : currentStatus === 'Client Response Pending'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="Pending">Pending</option>
                        <option value="Documents Pending">Documents Pending</option>
                        <option value="Client Response Pending">Client Response Pending</option>
                        <option value="Tax Payment Pending">Tax Payment Pending</option>
                        <option value="Bill Pending">Bill Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={currentRemark}
                        placeholder="Add remark..."
                        onBlur={(e) => {
                          if (e.target.value !== currentRemark) {
                            onUpdateStatus(
                              selectedFY.id,
                              selectedMonth,
                              client.id,
                              currentStatus,
                              e.target.value
                            );
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Role Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold">Role Access: Staff Member</div>
          <p className="text-blue-800 text-[11px] mt-0.5">
            You are logged in with standard staff permissions. You can view client details and update monthly filing work. User management, database backups, and system settings are reserved for Administrators.
          </p>
        </div>
      </div>
    </div>
  );
};
