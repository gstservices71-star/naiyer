export type UserRole = 'admin' | 'staff' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  username: string;
  password?: string;
  password_hash?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  last_login?: string | null;
}

export type GSTType = 'regular' | 'composition';
export type ClientStatus = 'active' | 'inactive';

export interface Client {
  id: number;
  gstin: string;
  firm_name: string;
  client_name: string;
  mobile: string;
  alternate_mobile?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  gst_type: GSTType;
  assigned_staff_id: number | null;
  registration_date: string;
  status: ClientStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialYear {
  id: number;
  start_year: number;
  end_year: number;
  display_name: string; // e.g. "2026-27"
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export type WorkStatus =
  | 'Not Started'
  | 'Pending'
  | 'Completed'
  | 'Bill Pending'
  | 'Tax Payment Pending'
  | 'Documents Pending'
  | 'Client Response Pending'
  | 'Other';

export interface MonthlyWork {
  id: number;
  financial_year_id: number;
  month: string; // "April", "May", ... "March"
  client_id: number;
  status: WorkStatus;
  remark: string;
  updated_by: number;
  updated_by_name?: string;
  updated_at: string;
}

export interface WorkHistory {
  id: number;
  client_id: number;
  client_name?: string;
  firm_name?: string;
  financial_year_id: number;
  fy_name?: string;
  month: string;
  previous_status: WorkStatus;
  new_status: WorkStatus;
  remark: string;
  changed_by: number;
  changed_by_name?: string;
  changed_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: UserRole;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export interface AppSettings {
  company_name: string;
  company_logo?: string;
  admin_email: string;
  default_fy_id: number;
  default_month: string;
  timezone: string;
  date_format: string;
}

export const FY_MONTHS = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
] as const;

export const WORK_STATUSES: WorkStatus[] = [
  'Not Started',
  'Pending',
  'Completed',
  'Bill Pending',
  'Tax Payment Pending',
  'Documents Pending',
  'Client Response Pending',
  'Other',
];

export const STATUS_COLORS: Record<WorkStatus, { bg: string; text: string; border: string; badge: string }> = {
  'Not Started': {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700 border border-gray-300',
  },
  'Pending': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
  },
  'Completed': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  },
  'Bill Pending': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800 border border-orange-300',
  },
  'Tax Payment Pending': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border border-rose-300',
  },
  'Documents Pending': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
  'Client Response Pending': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800 border border-purple-300',
  },
  'Other': {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-800 border border-slate-300',
  },
};

// ==========================================
// BANK TURNOVER MANAGEMENT TYPES (NEW FEATURE)
// ==========================================
export type BankAccountSlot = 1 | 2 | 3 | 4 | 5;
export type BankAccountType = 'Current' | 'Savings' | 'OD/CC' | 'Cash Credit' | 'Other';
export type BankAccountStatus = 'active' | 'inactive';

export interface ClientBankAccount {
  id: number;
  client_id: number;
  slot_number: BankAccountSlot;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  account_type: BankAccountType;
  ifsc: string;
  status: BankAccountStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientBankTurnover {
  id: number;
  client_id: number;
  bank_account_id: number;
  financial_year_id: number;
  month: string; // e.g. "April", "May", ... "March"
  turnover_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BankStatementBackup {
  id: number;
  client_id: number;
  bank_account_id: number;
  financial_year_id: number;
  file_name: string;
  stored_file_name: string;
  file_path?: string;
  file_size: number;
  file_data_base64?: string;
  uploaded_at: string;
  uploaded_by: number;
  uploaded_by_name?: string;
}

export interface BankAccountTurnoverSummary {
  bankAccount: ClientBankAccount;
  monthlyTurnover: Record<string, number>;
  annualTotal: number;
  backupStatement?: BankStatementBackup;
}

// ==========================================
// GST MONTHLY TURNOVER TYPES (TAXABLE + EXEMPT)
// ==========================================
export interface ClientGstTurnover {
  id: number;
  client_id: number;
  financial_year_id: number;
  month: string; // "April", "May", ... "March"
  taxable_turnover: number;
  exempt_turnover: number;
  total_gst_turnover: number; // taxable_turnover + exempt_turnover
  created_at: string;
  updated_at: string;
}

export type ReportType =
  | 'combined' // Client Financial Report (Combined Bank + GST)
  | 'gst' // GST Turnover Report Only
  | 'bank' // Bank Turnover Report Only
  | 'all_clients'; // All Clients Combined Financial Report

export interface FinancialReportData {
  client: Client;
  financialYear: FinancialYear;
  gstRows: {
    month: string;
    taxable: number;
    exempt: number;
    total: number;
  }[];
  gstTotals: {
    taxable: number;
    exempt: number;
    total: number;
  };
  bankAccounts: {
    slotNumber: BankAccountSlot;
    account: ClientBankAccount | null;
    monthlyTurnover: Record<string, number>;
    total: number;
  }[];
  totalBankTurnover: number;
}

