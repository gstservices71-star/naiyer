import React from 'react';
import {
  ActivityLog,
  Client,
  FinancialYear,
  FY_MONTHS,
  MonthlyWork,
  OfficeVisit,
  User,
  WorkStatus,
} from '../types';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  TrendingUp,
  ArrowRight,
  FileSpreadsheet,
  PlusCircle,
  FileCheck,
  Calendar,
  Layers,
  HelpCircle,
  ShieldCheck,
  Landmark,
  FileText,
  RefreshCw,
  UserCheck,
  Building2,
  LogIn,
  LogOut,
  BadgePercent,
  Sparkles,
  Phone,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

interface DashboardProps {
  clients: Client[];
  monthlyWork: MonthlyWork[];
  financialYears: FinancialYear[];
  selectedFY: FinancialYear;
  selectedMonth: string;
  users: User[];
  activityLogs: ActivityLog[];
  officeVisits?: OfficeVisit[];
  onNavigateTab: (tab: any, filterStatus?: string, filterScheme?: string) => void;
  onOpenAddClient: () => void;
  onOpenImportModal: () => void;
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Completed: '#10b981',
  'Not Started': '#94a3b8',
  Pending: '#f59e0b',
  'Bill Pending': '#f97316',
  'Tax Payment Pending': '#ef4444',
  'Documents Pending': '#8b5cf6',
  'Client Response Pending': '#06b6d4',
  Other: '#64748b',
};

export const getSchemeCategory = (val?: string): 'Normal' | 'Composition' | 'QRMP' => {
  if (!val) return 'Normal';
  const c = val.trim().toLowerCase();
  if (c === 'composition') return 'Composition';
  if (c === 'qrmp') return 'QRMP';
  return 'Normal';
};

export const Dashboard: React.FC<DashboardProps> = ({
  clients,
  monthlyWork,
  financialYears,
  selectedFY,
  selectedMonth,
  users,
  activityLogs,
  officeVisits = [],
  onNavigateTab,
  onOpenAddClient,
  onOpenImportModal,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Current month work map
  const activeClients = clients.filter((c) => c.status === 'active');
  const currentMonthRecords = monthlyWork.filter(
    (m) => m.financial_year_id === selectedFY.id && m.month === selectedMonth
  );

  const workMap = new Map<number, MonthlyWork>();
  currentMonthRecords.forEach((r) => workMap.set(r.client_id, r));

  // Compute status counts
  let completed = 0;
  let notStarted = 0;
  let pendingGeneral = 0;
  let billPending = 0;
  let taxPaymentPending = 0;
  let docsPending = 0;
  let clientResponsePending = 0;
  let other = 0;

  activeClients.forEach((c) => {
    const rec = workMap.get(c.id);
    const status: WorkStatus = rec ? rec.status : 'Not Started';

    if (status === 'Completed') completed++;
    else if (status === 'Not Started') notStarted++;
    else if (status === 'Pending') pendingGeneral++;
    else if (status === 'Bill Pending') billPending++;
    else if (status === 'Tax Payment Pending') taxPaymentPending++;
    else if (status === 'Documents Pending') docsPending++;
    else if (status === 'Client Response Pending') clientResponsePending++;
    else other++;
  });

  const totalPending =
    pendingGeneral + billPending + taxPaymentPending + docsPending + clientResponsePending + other;

  // Split Taxpayers by Normal vs Composition vs QRMP
  const normalClients = activeClients.filter((c) => getSchemeCategory(c.gst_type) === 'Normal');
  const compositionClients = activeClients.filter((c) => getSchemeCategory(c.gst_type) === 'Composition');
  const qrmpClients = activeClients.filter((c) => getSchemeCategory(c.gst_type) === 'QRMP');

  // Normal scheme stats
  let normalCompleted = 0;
  let normalPending = 0;
  let normalNotStarted = 0;
  normalClients.forEach((c) => {
    const st = workMap.get(c.id)?.status || 'Not Started';
    if (st === 'Completed') normalCompleted++;
    else if (st === 'Not Started') normalNotStarted++;
    else normalPending++;
  });
  const normalCompRate = normalClients.length > 0 ? Math.round((normalCompleted / normalClients.length) * 100) : 0;

  // Composition scheme stats
  let compCompleted = 0;
  let compPending = 0;
  let compNotStarted = 0;
  compositionClients.forEach((c) => {
    const st = workMap.get(c.id)?.status || 'Not Started';
    if (st === 'Completed') compCompleted++;
    else if (st === 'Not Started') compNotStarted++;
    else compPending++;
  });
  const compCompRate = compositionClients.length > 0 ? Math.round((compCompleted / compositionClients.length) * 100) : 0;

  // QRMP scheme stats
  let qrmpCompleted = 0;
  let qrmpPending = 0;
  let qrmpNotStarted = 0;
  qrmpClients.forEach((c) => {
    const st = workMap.get(c.id)?.status || 'Not Started';
    if (st === 'Completed') qrmpCompleted++;
    else if (st === 'Not Started') qrmpNotStarted++;
    else qrmpPending++;
  });
  const qrmpCompRate = qrmpClients.length > 0 ? Math.round((qrmpCompleted / qrmpClients.length) * 100) : 0;

  const completionRate =
    activeClients.length > 0 ? Math.round((completed / activeClients.length) * 100) : 0;

  // Chart 1: Scheme Distribution (Normal, Composition, QRMP)
  const schemeData = [
    { name: 'Normal (Monthly GSTR-1/3B)', value: normalClients.length, color: '#2563eb' },
    { name: 'Composition (CMP-08)', value: compositionClients.length, color: '#8b5cf6' },
    { name: 'QRMP (Quarterly+IFF)', value: qrmpClients.length, color: '#f97316' },
  ].filter((s) => s.value > 0);

  // Office Visits Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const activeInOfficeVisits = officeVisits.filter((v) => v.status === 'IN');
  const todayVisits = officeVisits.filter((v) => v.visit_date === todayStr);
  const monthVisits = officeVisits.filter(
    (v) => v.financial_year_id === selectedFY.id && v.month === selectedMonth
  );

  // Recent visits (sorted latest first)
  const recentVisits = [...officeVisits]
    .sort((a, b) => new Date(b.created_at || b.visit_date).getTime() - new Date(a.created_at || a.visit_date).getTime())
    .slice(0, 6);

  // Chart 2: Status Breakdown
  const statusData = [
    { name: 'Completed', count: completed, fill: '#10b981' },
    { name: 'Bill Pending', count: billPending, fill: '#f97316' },
    { name: 'Tax Pending', count: taxPaymentPending, fill: '#ef4444' },
    { name: 'Docs Pending', count: docsPending, fill: '#8b5cf6' },
    { name: 'Client Resp.', count: clientResponsePending, fill: '#06b6d4' },
    { name: 'General Pending', count: pendingGeneral, fill: '#f59e0b' },
    { name: 'Not Started', count: notStarted, fill: '#94a3b8' },
  ].filter((s) => s.count > 0);

  // Chart 3: 12-Month FY Trend
  const trendData = FY_MONTHS.map((m) => {
    const monthRecs = monthlyWork.filter(
      (mw) => mw.financial_year_id === selectedFY.id && mw.month === m
    );
    const comp = monthRecs.filter((r) => r.status === 'Completed').length;
    const pend = monthRecs.filter((r) => r.status !== 'Completed' && r.status !== 'Not Started').length;
    return {
      month: m.slice(0, 3),
      Completed: comp,
      Pending: pend,
    };
  });

  // Chart 4: Staff Workload Distribution
  const staffUsers = users.filter((u) => u.role === 'staff' && u.status === 'active');
  const staffWorkloadData = staffUsers.map((staff) => {
    const staffClients = activeClients.filter((c) => c.assigned_staff_id === staff.id);
    let sCompleted = 0;
    let sPending = 0;
    let sNotStarted = 0;

    staffClients.forEach((sc) => {
      const rec = workMap.get(sc.id);
      const st = rec ? rec.status : 'Not Started';
      if (st === 'Completed') sCompleted++;
      else if (st === 'Not Started') sNotStarted++;
      else sPending++;
    });

    return {
      name: staff.name.split(' ')[0],
      Completed: sCompleted,
      Pending: sPending,
      'Not Started': sNotStarted,
      total: staffClients.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / FY Context */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-blue-200 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Financial Year {selectedFY.display_name} Work Status</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              GST WORK DASHBOARD CA RISHAB JAISWAL — <span className="text-amber-300">{selectedMonth}</span>
            </h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-3xl">
              Track monthly filing progress, pending documentation, tax payment statuses, and staff assignments across master clients. by Naiyer Iqbal 8228069899
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              id="dashboard-refresh-btn"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 bg-blue-900/60 hover:bg-blue-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-blue-400/30 shadow-xs transition-colors cursor-pointer"
              title="Refresh Dashboard & Compliance Metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-300' : 'text-blue-200'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              id="dashboard-quick-add-client-btn"
              onClick={onOpenAddClient}
              className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Client</span>
            </button>
            <button
              id="dashboard-quick-track-btn"
              onClick={() => onNavigateTab('monthly-work')}
              className="flex items-center gap-1.5 bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-blue-400/40 shadow-xs transition-colors cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Monthly Work Tracker</span>
            </button>
          </div>
        </div>

        {/* Progress Bar inside banner */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-100">
              Filing Completion Rate ({selectedMonth}):
            </span>
            <div className="w-48 bg-black/30 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <span className="font-bold text-emerald-300">{completionRate}% Done</span>
          </div>
          <div className="text-blue-200">
            <strong>{completed}</strong> of <strong>{activeClients.length}</strong> clients filed
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Clients */}
        <div
          id="metric-total-clients"
          onClick={() => onNavigateTab('clients')}
          className="bg-white border border-slate-200 hover:border-blue-400 p-4 rounded-xl shadow-2xs cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Clients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 group-hover:text-blue-600">
            {activeClients.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between gap-1 flex-wrap font-medium">
            <span className="text-blue-700 font-bold">Norm: {normalClients.length}</span>
            <span className="text-purple-700 font-bold">Cmp: {compositionClients.length}</span>
            <span className="text-orange-700 font-bold">QRMP: {qrmpClients.length}</span>
          </div>
        </div>

        {/* Completed */}
        <div
          id="metric-completed"
          onClick={() => onNavigateTab('monthly-work', 'Completed')}
          className="bg-emerald-50/50 border border-emerald-200 hover:border-emerald-400 p-4 rounded-xl shadow-2xs cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{completed}</div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
            <span>{completionRate}% of active</span>
          </div>
        </div>

        {/* Total Pending */}
        <div
          id="metric-total-pending"
          onClick={() => onNavigateTab('monthly-work', 'Pending')}
          className="bg-amber-50/50 border border-amber-200 hover:border-amber-400 p-4 rounded-xl shadow-2xs cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold">Total Pending</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">{totalPending}</div>
          <div className="text-[11px] text-amber-700 mt-1">Requires follow-up</div>
        </div>

        {/* Bill Pending */}
        <div
          id="metric-bill-pending"
          onClick={() => onNavigateTab('monthly-work', 'Bill Pending')}
          className="bg-orange-50/50 border border-orange-200 hover:border-orange-400 p-4 rounded-xl shadow-2xs cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between text-orange-800 mb-2">
            <span className="text-xs font-semibold">Bill Pending</span>
            <FileSpreadsheet className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-800">{billPending}</div>
          <div className="text-[11px] text-orange-700 mt-1">Sales/Purchase bill</div>
        </div>

        {/* Tax Payment Pending */}
        <div
          id="metric-tax-pending"
          onClick={() => onNavigateTab('monthly-work', 'Tax Payment Pending')}
          className="bg-rose-50/50 border border-rose-200 hover:border-rose-400 p-4 rounded-xl shadow-2xs cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between text-rose-800 mb-2">
            <span className="text-xs font-semibold">Tax Pending</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-800">{taxPaymentPending}</div>
          <div className="text-[11px] text-rose-700 mt-1">Challan generation</div>
        </div>

        {/* Not Started */}
        <div
          id="metric-not-started"
          onClick={() => onNavigateTab('monthly-work', 'Not Started')}
          className="bg-slate-50 border border-slate-200 hover:border-slate-400 p-4 rounded-xl shadow-2xs cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold">Not Started</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{notStarted}</div>
          <div className="text-[11px] text-slate-500 mt-1">Initial state</div>
        </div>
      </div>

      {/* TAXPAYER SCHEME SPLIT: Normal vs Composition vs QRMP (User Requested) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-blue-600" />
              <span>Taxpayer Scheme Split & Compliance Status ({selectedMonth})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client categorization across Normal / Regular, Composition, and QRMP schemes
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Total Base: {activeClients.length} Clients</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Normal / Regular Card */}
          <div
            id="scheme-card-normal"
            onClick={() => onNavigateTab('monthly-work', 'all', 'Normal')}
            className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/40 hover:bg-blue-50/80 hover:border-blue-400 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase tracking-wider">
                Normal / Regular
              </span>
              <span className="text-xs font-bold text-blue-800">
                {normalClients.length > 0 ? ((normalClients.length / (activeClients.length || 1)) * 100).toFixed(0) : 0}% Share
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900 group-hover:text-blue-700">
                {normalClients.length}
              </span>
              <span className="text-xs font-bold text-slate-500">Clients</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Monthly Return Filing (GSTR-1 & 3B)
            </div>

            {/* Compliance bar */}
            <div className="mt-3 pt-3 border-t border-blue-200/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Completion:</span>
                <span className="font-black text-blue-700">{normalCompRate}% ({normalCompleted}/{normalClients.length})</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${normalCompRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                <span className="text-emerald-700 font-bold">✓ {normalCompleted} Done</span>
                <span className="text-amber-700 font-bold">⏳ {normalPending} Pend</span>
                <span className="text-slate-500 font-bold">○ {normalNotStarted} Unstarted</span>
              </div>
            </div>
          </div>

          {/* Composition Scheme Card */}
          <div
            id="scheme-card-composition"
            onClick={() => onNavigateTab('monthly-work', 'all', 'Composition')}
            className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50/40 hover:bg-purple-50/80 hover:border-purple-400 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white uppercase tracking-wider">
                Composition
              </span>
              <span className="text-xs font-bold text-purple-800">
                {compositionClients.length > 0 ? ((compositionClients.length / (activeClients.length || 1)) * 100).toFixed(0) : 0}% Share
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900 group-hover:text-purple-700">
                {compositionClients.length}
              </span>
              <span className="text-xs font-bold text-slate-500">Clients</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Quarterly CMP-08 & Annual GSTR-4
            </div>

            {/* Compliance bar */}
            <div className="mt-3 pt-3 border-t border-purple-200/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Completion:</span>
                <span className="font-black text-purple-700">{compCompRate}% ({compCompleted}/{compositionClients.length})</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${compCompRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                <span className="text-emerald-700 font-bold">✓ {compCompleted} Done</span>
                <span className="text-amber-700 font-bold">⏳ {compPending} Pend</span>
                <span className="text-slate-500 font-bold">○ {compNotStarted} Unstarted</span>
              </div>
            </div>
          </div>

          {/* QRMP Scheme Card */}
          <div
            id="scheme-card-qrmp"
            onClick={() => onNavigateTab('monthly-work', 'all', 'QRMP')}
            className="p-4 rounded-xl border-2 border-orange-200 bg-orange-50/40 hover:bg-orange-50/80 hover:border-orange-400 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-orange-600 text-white uppercase tracking-wider">
                QRMP Scheme
              </span>
              <span className="text-xs font-bold text-orange-800">
                {qrmpClients.length > 0 ? ((qrmpClients.length / (activeClients.length || 1)) * 100).toFixed(0) : 0}% Share
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900 group-hover:text-orange-700">
                {qrmpClients.length}
              </span>
              <span className="text-xs font-bold text-slate-500">Clients</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              Quarterly Return + Monthly Payment (IFF)
            </div>

            {/* Compliance bar */}
            <div className="mt-3 pt-3 border-t border-orange-200/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Completion:</span>
                <span className="font-black text-orange-700">{qrmpCompRate}% ({qrmpCompleted}/{qrmpClients.length})</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-600 h-full rounded-full transition-all"
                  style={{ width: `${qrmpCompRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                <span className="text-emerald-700 font-bold">✓ {qrmpCompleted} Done</span>
                <span className="text-amber-700 font-bold">⏳ {qrmpPending} Pend</span>
                <span className="text-slate-500 font-bold">○ {qrmpNotStarted} Unstarted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Work Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Status Distribution ({selectedMonth})
              </h3>
              <p className="text-xs text-slate-500">Breakdown of all active GST client filings</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md">
              {activeClients.length} Active
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [`${val} clients`, 'Count']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 12-Month Financial Year Progression */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                12-Month Trend (FY {selectedFY.display_name})
              </h3>
              <p className="text-xs text-slate-500">Month-over-month completion vs pending count</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md">
              Apr – Mar
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="Completed" stroke="#10b981" fillOpacity={1} fill="url(#colorComp)" />
                <Area type="monotone" dataKey="Pending" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Staff Workload Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Staff Workload & Performance</h3>
              <p className="text-xs text-slate-500">Distribution of client assignments for {selectedMonth}</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>View Full Report</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffWorkloadData} margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Completed" stackId="a" fill="#10b981" />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Not Started" stackId="a" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: GST Registration Scheme Pie */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Taxpayer Scheme Split</h3>
              <p className="text-xs text-slate-500">Normal vs Composition vs QRMP Taxpayers</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
              Master Base
            </span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={schemeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {schemeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} clients`, 'Count']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* OFFICE CLIENT ENTRY & VISIT REGISTER SECTION (User Requested) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Office Client Entry & Visit Register</span>
                  {activeInOfficeVisits.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>{activeInOfficeVisits.length} In Office Now</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time client walk-ins, consultation logs, and office check-in / check-out records
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Today: <strong className="text-slate-900">{todayVisits.length}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Month: <strong className="text-slate-900">{monthVisits.length}</strong></span>
            </div>

            <button
              id="dashboard-new-visit-btn"
              onClick={() => onNavigateTab('office-visits')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>+ Record Client Entry</span>
            </button>

            <button
              onClick={() => onNavigateTab('office-visits')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 px-2.5 py-2 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              <span>Full Register ({officeVisits.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Office Entries Table */}
        {recentVisits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Client / Firm Name</th>
                  <th className="px-3 py-2.5">Contact Person</th>
                  <th className="px-3 py-2.5">Scheme / Type</th>
                  <th className="px-3 py-2.5">Purpose of Visit</th>
                  <th className="px-3 py-2.5">In / Out Time</th>
                  <th className="px-3 py-2.5">Attended By</th>
                  <th className="px-3 py-2.5">Remark / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentVisits.map((visit) => {
                  const clientObj = clients.find((c) => c.id === visit.client_id);
                  const scheme = getSchemeCategory(clientObj?.gst_type || visit.gst_type);
                  const isCurrentlyIn = visit.status === 'IN';

                  return (
                    <tr
                      key={visit.id}
                      className={`transition-colors ${
                        isCurrentlyIn ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {isCurrentlyIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-2xs animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>IN OFFICE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            <LogOut className="w-3 h-3 text-slate-400" />
                            <span>OUT</span>
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{visit.firm_name}</span>
                          {visit.file_no && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                              #{visit.file_no}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{visit.visit_date}</span>
                          <span>•</span>
                          <span className={visit.client_type === 'registered' ? 'text-blue-600 font-semibold' : 'text-slate-500'}>
                            {visit.client_type === 'registered' ? 'Registered Client' : 'New Visitor'}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{visit.contact_person || '—'}</div>
                        {visit.mobile && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{visit.mobile}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            scheme === 'Normal'
                              ? 'bg-blue-100 text-blue-800'
                              : scheme === 'Composition'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {scheme}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {visit.purpose || 'General Consultation'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">
                        <div className="text-emerald-700 font-bold">
                          In: {visit.in_time || '—'}
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          Out: {visit.out_time ? visit.out_time : isCurrentlyIn ? 'Active Now' : '—'}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">
                        {visit.attended_by_name || 'Assigned Staff'}
                      </td>

                      <td className="px-3 py-2.5 text-slate-600 text-[11px] max-w-xs truncate">
                        {visit.remarks || visit.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No Office Client Entries Logged Yet</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
              Track walk-in visitors, consultations, document submissions, and in/out timings by recording the first entry.
            </p>
            <button
              onClick={() => onNavigateTab('office-visits')}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Record First Office Client Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: Quick Links & Recent Activity Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Quick Shortcuts</span>
          </h3>

          <div className="space-y-2">
            <button
              onClick={onOpenAddClient}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Add New Master Client</div>
                  <div className="text-[10px] text-slate-500 font-normal">With GSTIN regex check</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={onOpenImportModal}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Import Clients (CSV)</div>
                  <div className="text-[10px] text-slate-500 font-normal">Bulk upload with duplicate check</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('bank-turnover')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Bank Turnover (5 Accounts)</div>
                  <div className="text-[10px] text-slate-500 font-normal">12-month compliance & ZIP backups</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('reports')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Turnover Reports & PDF</div>
                  <div className="text-[10px] text-slate-500 font-normal">GST & Bank Turnover PDF generation</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>Real-Time Activity Audit Trail</span>
            </h3>
            <button
              onClick={() => onNavigateTab('activity-logs')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {activityLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {log.user_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {log.created_at}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate">{log.description}</p>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    By <strong className="text-slate-600">{log.user_name}</strong> ({log.user_role}) • IP: {log.ip_address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
