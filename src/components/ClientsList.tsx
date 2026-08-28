import React, { useState, useMemo } from 'react';
import { Client, FinancialYear, MonthlyWork, User, WorkStatus } from '../types';
import {
  Search,
  Plus,
  Filter,
  FileDown,
  FileUp,
  Eye,
  Edit2,
  Trash2,
  CalendarCheck,
  Building,
  Phone,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Landmark,
} from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  users: User[];
  currentUser: User;
  selectedFY: FinancialYear;
  selectedMonth: string;
  monthlyWork: MonthlyWork[];
  onOpenAddClient: () => void;
  onOpenEditClient: (client: Client) => void;
  onOpenViewClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onOpenImportModal: () => void;
  onExportCSV: () => void;
  onNavigateToMonthlyWork: (clientGSTIN?: string) => void;
  onNavigateToBankTurnover?: (clientId: number) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  users,
  currentUser,
  selectedFY,
  selectedMonth,
  monthlyWork,
  onOpenAddClient,
  onOpenEditClient,
  onOpenViewClient,
  onDeleteClient,
  onOpenImportModal,
  onExportCSV,
  onNavigateToMonthlyWork,
  onNavigateToBankTurnover,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScheme, setFilterScheme] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isAdmin = currentUser.role === 'admin';

  // Monthly work mapping for selected FY & month
  const currentMonthWorkMap = useMemo(() => {
    const map = new Map<number, MonthlyWork>();
    monthlyWork
      .filter((m) => m.financial_year_id === selectedFY.id && m.month === selectedMonth)
      .forEach((r) => map.set(r.client_id, r));
    return map;
  }, [monthlyWork, selectedFY.id, selectedMonth]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesGSTIN = client.gstin.toLowerCase().includes(query);
        const matchesFirm = client.firm_name.toLowerCase().includes(query);
        const matchesName = client.client_name.toLowerCase().includes(query);
        const matchesMobile = client.mobile.includes(query);
        const matchesCity = client.city?.toLowerCase().includes(query) || false;
        if (!matchesGSTIN && !matchesFirm && !matchesName && !matchesMobile && !matchesCity) {
          return false;
        }
      }

      // Filter scheme
      if (filterScheme !== 'all' && client.gst_type !== filterScheme) {
        return false;
      }

      // Filter status
      if (filterStatus !== 'all' && client.status !== filterStatus) {
        return false;
      }

      // Filter staff
      if (filterStaff !== 'all') {
        if (filterStaff === 'unassigned') {
          if (client.assigned_staff_id) return false;
        } else if (client.assigned_staff_id !== Number(filterStaff)) {
          return false;
        }
      }

      return true;
    });
  }, [clients, searchTerm, filterScheme, filterStatus, filterStaff]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const getStaffName = (staffId?: number) => {
    if (!staffId) return 'Unassigned';
    const staff = users.find((u) => u.id === staffId);
    return staff ? staff.name : 'Unknown';
  };

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
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Master GST Clients Directory</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {filteredClients.length} Clients
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Permanent client master data. Changes apply globally across all financial years.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="clients-export-csv-btn"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors"
            title="Download full client master list as CSV"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <button
              id="clients-import-csv-btn"
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl transition-colors"
              title="Bulk import clients with validation"
            >
              <FileUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Import CSV</span>
            </button>
          )}

          {isAdmin && (
            <button
              id="clients-add-new-btn"
              onClick={onOpenAddClient}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="clients-search-input"
            type="text"
            placeholder="Search by GSTIN, Firm, Name, Phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Scheme Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Scheme:</span>
            <select
              id="clients-filter-scheme"
              value={filterScheme}
              onChange={(e) => {
                setFilterScheme(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Schemes</option>
              <option value="regular">Regular</option>
              <option value="composition">Composition</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              id="clients-filter-status"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Staff Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Staff:</span>
            <select
              id="clients-filter-staff"
              value={filterStaff}
              onChange={(e) => {
                setFilterStaff(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Reset Filters */}
          {(searchTerm || filterScheme !== 'all' || filterStatus !== 'all' || filterStaff !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterScheme('all');
                setFilterStatus('all');
                setFilterStaff('all');
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">GSTIN / Scheme</th>
                <th className="px-4 py-3">Firm & Contact Person</th>
                <th className="px-4 py-3">Phone & Location</th>
                <th className="px-4 py-3">Assigned Staff</th>
                <th className="px-4 py-3 text-center">
                  Work Status ({selectedMonth})
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No clients match your filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try searching with another keyword or add a new client.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const currentWork = currentMonthWorkMap.get(client.id);
                  const currentStatus: WorkStatus = currentWork ? currentWork.status : 'Not Started';

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* GSTIN & Scheme */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                            {client.gstin}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              client.gst_type === 'regular'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {client.gst_type}
                          </span>
                          {client.status === 'inactive' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Firm & Contact Person */}
                      <td className="px-4 py-3">
                        <div
                          onClick={() => onOpenViewClient(client)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{client.firm_name}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Contact: <span className="font-medium text-slate-700">{client.client_name}</span>
                        </div>
                      </td>

                      {/* Phone & Location */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-800 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.mobile}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[160px]">
                          {client.city ? `${client.city}, ${client.state || ''}` : client.state || '-'}
                        </div>
                      </td>

                      {/* Assigned Staff */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-800">
                            {getStaffName(client.assigned_staff_id)}
                          </span>
                        </div>
                      </td>

                      {/* Work Status for Current Month */}
                      <td className="px-4 py-3 text-center">
                        <div>{getStatusBadge(currentStatus)}</div>
                        {currentWork?.remark && (
                          <div
                            className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px] mx-auto"
                            title={currentWork.remark}
                          >
                            "{currentWork.remark}"
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`client-view-btn-${client.id}`}
                            onClick={() => onOpenViewClient(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Full Profile, Bank Turnover & GST Matrix"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {onNavigateToBankTurnover && (
                            <button
                              id={`client-bank-btn-${client.id}`}
                              onClick={() => onNavigateToBankTurnover(client.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Manage Monthly Bank Turnover"
                            >
                              <Landmark className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            id={`client-tracker-btn-${client.id}`}
                            onClick={() => onNavigateToMonthlyWork(client.gstin)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Go to Monthly Work Tracker"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              id={`client-edit-btn-${client.id}`}
                              onClick={() => onOpenEditClient(client)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit Client"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              id={`client-delete-btn-${client.id}`}
                              onClick={() => onDeleteClient(client)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Client"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              id="clients-page-size-selector"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>of {filteredClients.length} clients</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="clients-prev-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              id="clients-next-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
