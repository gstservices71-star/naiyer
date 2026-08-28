import React, { useState, useMemo } from 'react';
import { Client, FinancialYear, FY_MONTHS, MonthlyWork as MonthlyWorkType, User, WorkStatus } from '../types';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  Calendar,
  Sparkles,
  UserCheck,
  Check,
  FileSpreadsheet,
  FileDown,
  Info,
} from 'lucide-react';

interface MonthlyWorkProps {
  clients: Client[];
  monthlyWork: MonthlyWorkType[];
  financialYears: FinancialYear[];
  selectedFY: FinancialYear;
  onSelectFY: (fy: FinancialYear) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  users: User[];
  currentUser: User;
  onUpdateStatus: (
    fyId: number,
    month: string,
    clientId: number,
    status: WorkStatus,
    remark: string
  ) => void;
  initialSearchQuery?: string;
  initialStatusFilter?: string;
  onExportCSV: () => void;
}

const STATUS_OPTIONS: WorkStatus[] = [
  'Not Started',
  'Pending',
  'Completed',
  'Bill Pending',
  'Tax Payment Pending',
  'Documents Pending',
  'Client Response Pending',
  'Other',
];

const REMARK_PRESETS = [
  'Bill अभी प्राप्त नहीं हुआ।',
  'Client ने tax payment नहीं किया है।',
  'Documents / Statements pending हैं।',
  'Client response pending.',
  'Challan generated, awaiting OTP.',
  'Data received, preparing GSTR-3B.',
  'GSTR-1 & 3B filed successfully.',
  'Nil return filed.',
];

export const MonthlyWork: React.FC<MonthlyWorkProps> = ({
  clients,
  monthlyWork,
  financialYears,
  selectedFY,
  onSelectFY,
  selectedMonth,
  onSelectMonth,
  users,
  currentUser,
  onUpdateStatus,
  initialSearchQuery = '',
  initialStatusFilter = 'all',
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [staffFilter, setStaffFilter] = useState('all');
  const [schemeFilter, setSchemeFilter] = useState('all');

  // Draft local edits for instant responsive typing without lagging global store
  const [draftStatuses, setDraftStatuses] = useState<Record<number, WorkStatus>>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<number, string>>({});
  const [savedRowIds, setSavedRowIds] = useState<Record<number, boolean>>({});

  // Active clients
  const activeClients = useMemo(() => clients.filter((c) => c.status === 'active'), [clients]);

  // Work mapping for selected FY and month
  const workMap = useMemo(() => {
    const map = new Map<number, MonthlyWorkType>();
    monthlyWork
      .filter((m) => m.financial_year_id === selectedFY.id && m.month === selectedMonth)
      .forEach((r) => map.set(r.client_id, r));
    return map;
  }, [monthlyWork, selectedFY.id, selectedMonth]);

  // Status breakdown calculations
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: activeClients.length,
      Completed: 0,
      Pending: 0,
      'Bill Pending': 0,
      'Tax Payment Pending': 0,
      'Documents Pending': 0,
      'Client Response Pending': 0,
      'Not Started': 0,
    };

    activeClients.forEach((c) => {
      const rec = workMap.get(c.id);
      const st = rec ? rec.status : 'Not Started';
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });

    return counts;
  }, [activeClients, workMap]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return activeClients.filter((client) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesGSTIN = client.gstin.toLowerCase().includes(q);
        const matchesFirm = client.firm_name.toLowerCase().includes(q);
        const matchesClient = client.client_name.toLowerCase().includes(q);
        if (!matchesGSTIN && !matchesFirm && !matchesClient) return false;
      }

      // Scheme
      if (schemeFilter !== 'all' && client.gst_type !== schemeFilter) {
        return false;
      }

      // Staff
      if (staffFilter !== 'all') {
        if (staffFilter === 'unassigned') {
          if (client.assigned_staff_id) return false;
        } else if (client.assigned_staff_id !== Number(staffFilter)) {
          return false;
        }
      }

      // Status
      const rec = workMap.get(client.id);
      const curStatus: WorkStatus = draftStatuses[client.id] || (rec ? rec.status : 'Not Started');

      if (statusFilter !== 'all') {
        if (statusFilter === 'Pending') {
          if (curStatus === 'Completed' || curStatus === 'Not Started') return false;
        } else if (curStatus !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [activeClients, searchTerm, schemeFilter, staffFilter, statusFilter, workMap, draftStatuses]);

  const handleStatusChange = (clientId: number, newStatus: WorkStatus) => {
    setDraftStatuses((prev) => ({ ...prev, [clientId]: newStatus }));
    const currentRemark = draftRemarks[clientId] !== undefined
      ? draftRemarks[clientId]
      : (workMap.get(clientId)?.remark || '');

    // Auto-save on status change for fast workflow
    onUpdateStatus(selectedFY.id, selectedMonth, clientId, newStatus, currentRemark);

    // Show temporary saved indicator
    setSavedRowIds((prev) => ({ ...prev, [clientId]: true }));
    setTimeout(() => {
      setSavedRowIds((prev) => ({ ...prev, [clientId]: false }));
    }, 2000);
  };

  const handleRemarkChange = (clientId: number, text: string) => {
    setDraftRemarks((prev) => ({ ...prev, [clientId]: text }));
  };

  const handleSaveRow = (clientId: number) => {
    const rec = workMap.get(clientId);
    const status = draftStatuses[clientId] || (rec ? rec.status : 'Not Started');
    const remark = draftRemarks[clientId] !== undefined ? draftRemarks[clientId] : (rec?.remark || '');

    onUpdateStatus(selectedFY.id, selectedMonth, clientId, status, remark);

    setSavedRowIds((prev) => ({ ...prev, [clientId]: true }));
    setTimeout(() => {
      setSavedRowIds((prev) => ({ ...prev, [clientId]: false }));
    }, 2000);
  };

  const getStaffName = (staffId?: number) => {
    if (!staffId) return 'Unassigned';
    const s = users.find((u) => u.id === staffId);
    return s ? s.name : 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Monthly GST Work Tracker
            </h2>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              {selectedMonth} ({selectedFY.display_name})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Isolated monthly workspace. Status changes are stored in current FY and logged with audit trail.
          </p>
        </div>

        {/* Month & FY Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
            <span className="font-bold text-blue-900 mr-1">FY:</span>
            <select
              id="monthly-work-fy-select"
              value={selectedFY.id}
              onChange={(e) => {
                const found = financialYears.find((f) => f.id === Number(e.target.value));
                if (found) onSelectFY(found);
              }}
              className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer text-xs"
            >
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-600 mr-1.5" />
            <span className="font-bold text-slate-700 mr-1">Month:</span>
            <select
              id="monthly-work-month-select"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs"
            >
              {FY_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            id="monthly-work-export-csv-btn"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-xl transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Month CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Status Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Clients ({statusCounts.all})
        </button>

        <button
          onClick={() => setStatusFilter('Completed')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === 'Completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          Completed ({statusCounts.Completed})
        </button>

        <button
          onClick={() => setStatusFilter('Bill Pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === 'Bill Pending'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100'
          }`}
        >
          Bill Pending ({statusCounts['Bill Pending']})
        </button>

        <button
          onClick={() => setStatusFilter('Tax Payment Pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === 'Tax Payment Pending'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
          }`}
        >
          Tax Pending ({statusCounts['Tax Payment Pending']})
        </button>

        <button
          onClick={() => setStatusFilter('Documents Pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === 'Documents Pending'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100'
          }`}
        >
          Docs Pending ({statusCounts['Documents Pending']})
        </button>

        <button
          onClick={() => setStatusFilter('Client Response Pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === 'Client Response Pending'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100'
          }`}
        >
          Client Response ({statusCounts['Client Response Pending']})
        </button>

        <button
          onClick={() => setStatusFilter('Not Started')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === 'Not Started'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Not Started ({statusCounts['Not Started']})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="monthly-work-search-input"
            type="text"
            placeholder="Search by GSTIN or Firm Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Scheme */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Scheme:</span>
            <select
              value={schemeFilter}
              onChange={(e) => setSchemeFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All</option>
              <option value="regular">Regular</option>
              <option value="composition">Composition</option>
            </select>
          </div>

          {/* Staff */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Staff:</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Staff</option>
              <option value="unassigned">Unassigned</option>
              {users
                .filter((u) => u.role === 'staff')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          {(searchTerm || schemeFilter !== 'all' || staffFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSchemeFilter('all');
                setStaffFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Monthly Work Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3" style={{ width: '25%' }}>Client & GSTIN</th>
                <th className="px-4 py-3" style={{ width: '12%' }}>Scheme / Staff</th>
                <th className="px-4 py-3" style={{ width: '22%' }}>Compliance Status</th>
                <th className="px-4 py-3" style={{ width: '31%' }}>Remark & Notes</th>
                <th className="px-4 py-3 text-right" style={{ width: '10%' }}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No client work items match your current filter.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const record = workMap.get(client.id);
                  const currentStatus: WorkStatus =
                    draftStatuses[client.id] || (record ? record.status : 'Not Started');
                  const currentRemark =
                    draftRemarks[client.id] !== undefined
                      ? draftRemarks[client.id]
                      : (record?.remark || '');
                  const isSaved = savedRowIds[client.id];

                  // Status background styling for selector
                  const statusBgMap: Record<WorkStatus, string> = {
                    Completed: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                    'Not Started': 'bg-slate-50 text-slate-700 border-slate-300',
                    Pending: 'bg-amber-50 text-amber-800 border-amber-300',
                    'Bill Pending': 'bg-orange-50 text-orange-800 border-orange-300',
                    'Tax Payment Pending': 'bg-rose-50 text-rose-800 border-rose-300',
                    'Documents Pending': 'bg-purple-50 text-purple-800 border-purple-300',
                    'Client Response Pending': 'bg-cyan-50 text-cyan-800 border-cyan-300',
                    Other: 'bg-slate-50 text-slate-700 border-slate-300',
                  };

                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSaved ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Client & GSTIN */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 leading-tight">
                          {client.firm_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {client.gstin}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {client.client_name}
                          </span>
                        </div>
                      </td>

                      {/* Scheme & Staff */}
                      <td className="px-4 py-3">
                        <div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              client.gst_type === 'regular'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {client.gst_type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{getStaffName(client.assigned_staff_id)}</span>
                        </div>
                      </td>

                      {/* Compliance Status Selector */}
                      <td className="px-4 py-3">
                        <select
                          id={`work-status-select-${client.id}`}
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(client.id, e.target.value as WorkStatus)}
                          className={`w-full font-bold text-xs rounded-xl px-2.5 py-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                            statusBgMap[currentStatus]
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-white text-slate-800 font-normal">
                              {opt}
                            </option>
                          ))}
                        </select>

                        {record?.updated_at && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Updated {record.updated_at.split(' ')[0]} by {record.updated_by_name || 'Staff'}
                          </div>
                        )}
                      </td>

                      {/* Remark Input with Presets */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Add filing note or reason..."
                            value={currentRemark}
                            onChange={(e) => handleRemarkChange(client.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRow(client.id);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                          />

                          {/* Quick Preset Badges */}
                          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                              Quick:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleRemarkChange(client.id, 'Bill Pending');
                                handleStatusChange(client.id, 'Bill Pending');
                              }}
                              className="text-[10px] bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 px-1.5 py-0.2 rounded font-medium shrink-0"
                            >
                              Bill Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleRemarkChange(client.id, 'Tax Payment Pending');
                                handleStatusChange(client.id, 'Tax Payment Pending');
                              }}
                              className="text-[10px] bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded font-medium shrink-0"
                            >
                              Tax Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleRemarkChange(client.id, 'Filed on GST Portal.');
                                handleStatusChange(client.id, 'Completed');
                              }}
                              className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded font-medium shrink-0"
                            >
                              Filing Done
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          id={`work-save-row-btn-${client.id}`}
                          onClick={() => handleSaveRow(client.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSaved
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
