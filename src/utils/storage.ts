import {
  ActivityLog,
  AppSettings,
  Client,
  FinancialYear,
  MonthlyWork,
  User,
  WorkHistory,
  WorkStatus,
  ClientBankAccount,
  ClientBankTurnover,
  BankStatementBackup,
  BankAccountSlot,
  ClientGstTurnover,
  FY_MONTHS,
  FinancialReportData,
} from '../types';
import {
  initialActivityLogs,
  initialClients,
  initialFinancialYears,
  initialMonthlyWork,
  initialSettings,
  initialUsers,
  initialWorkHistory,
} from '../data/initialData';
import {
  initialBankAccounts,
  initialBankTurnover,
  initialBankStatementBackups,
} from '../data/initialBankData';
import { initialGstTurnover } from '../data/initialGstData';
import { validateGSTIN } from './gstValidation';

const STORAGE_KEYS = {
  USERS: 'gst_app_users_v1',
  CLIENTS: 'gst_app_clients_v1',
  FINANCIAL_YEARS: 'gst_app_fy_v1',
  MONTHLY_WORK: 'gst_app_monthly_work_v1',
  WORK_HISTORY: 'gst_app_work_history_v1',
  ACTIVITY_LOGS: 'gst_app_activity_logs_v1',
  SETTINGS: 'gst_app_settings_v1',
  CURRENT_USER_ID: 'gst_app_current_user_id',
  SELECTED_FY_ID: 'gst_app_selected_fy_id',
  SELECTED_MONTH: 'gst_app_selected_month',
  BANK_ACCOUNTS: 'gst_app_bank_accounts_v1',
  BANK_TURNOVER: 'gst_app_bank_turnover_v1',
  BANK_STATEMENTS: 'gst_app_bank_statements_v1',
  GST_TURNOVER: 'gst_app_gst_turnover_v1',
};

export class GSTStorage {
  // Getters
  static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      this.saveUsers(initialUsers);
      return initialUsers;
    }
    return JSON.parse(raw);
  }

  static saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getClients(): Client[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) {
      this.saveClients(initialClients);
      return initialClients;
    }
    return JSON.parse(raw);
  }

  static getClientById(id: number): Client | undefined {
    return this.getClients().find((c) => c.id === id);
  }

  static saveClients(clients: Client[]) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  static getFinancialYears(): FinancialYear[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCIAL_YEARS);
    if (!raw) {
      this.saveFinancialYears(initialFinancialYears);
      return initialFinancialYears;
    }
    try {
      const parsed: FinancialYear[] = JSON.parse(raw);
      // Ensure all 30+ future financial years exist in the list
      if (parsed.length < initialFinancialYears.length) {
        const existingNames = new Set(parsed.map((f) => f.display_name));
        let maxId = parsed.reduce((max, f) => Math.max(max, f.id), 0);
        const merged = [...parsed];
        initialFinancialYears.forEach((initFy) => {
          if (!existingNames.has(initFy.display_name)) {
            maxId++;
            merged.push({ ...initFy, id: maxId });
            existingNames.add(initFy.display_name);
          }
        });
        merged.sort((a, b) => a.start_year - b.start_year);
        this.saveFinancialYears(merged);
        return merged;
      }
      return parsed;
    } catch {
      this.saveFinancialYears(initialFinancialYears);
      return initialFinancialYears;
    }
  }

  static saveFinancialYears(fys: FinancialYear[]) {
    localStorage.setItem(STORAGE_KEYS.FINANCIAL_YEARS, JSON.stringify(fys));
  }

  static getMonthlyWork(): MonthlyWork[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY_WORK);
    if (!raw) {
      this.saveMonthlyWork(initialMonthlyWork);
      return initialMonthlyWork;
    }
    return JSON.parse(raw);
  }

  static saveMonthlyWork(work: MonthlyWork[]) {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_WORK, JSON.stringify(work));
  }

  static getWorkHistory(): WorkHistory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WORK_HISTORY);
    if (!raw) {
      this.saveWorkHistory(initialWorkHistory);
      return initialWorkHistory;
    }
    return JSON.parse(raw);
  }

  static saveWorkHistory(history: WorkHistory[]) {
    localStorage.setItem(STORAGE_KEYS.WORK_HISTORY, JSON.stringify(history));
  }

  static getActivityLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) {
      this.saveActivityLogs(initialActivityLogs);
      return initialActivityLogs;
    }
    return JSON.parse(raw);
  }

  static saveActivityLogs(logs: ActivityLog[]) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  }

  static getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      this.saveSettings(initialSettings);
      return initialSettings;
    }
    return JSON.parse(raw);
  }

  static saveSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getCurrentUser(): User | null {
    const storedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!storedId) return null;
    const users = this.getUsers();
    const found = users.find((u) => u.id === Number(storedId));
    return found || null;
  }

  static setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, String(user.id));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }

  static login(identifier: string, password: string): { success: boolean; error?: string; user?: User } {
    const input = identifier.trim().toLowerCase();
    const users = this.getUsers();
    
    // Find user by username or email
    const user = users.find(
      (u) => u.username.toLowerCase() === input || u.email.toLowerCase() === input
    );

    if (!user) {
      return { success: false, error: 'Invalid Email/User ID or Password' };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'Your account is inactive. Please contact administrator.' };
    }

    // In demo environment, accept 'Password@123', 'admin', or the stored user's password/hash default
    const validPassword = 
      password === 'Password@123' ||
      password === 'admin' ||
      password === 'admin123' ||
      password === user.password ||
      (user.username === 'admin' && (password === 'admin' || password === 'Password@123'));

    if (!validPassword) {
      return { success: false, error: 'Invalid Email/User ID or Password' };
    }

    // Update last_login
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    user.last_login = now;
    this.saveUsers(users);
    this.setCurrentUser(user);

    this.logActivity('Login', `User ${user.name} (${user.role.toUpperCase()}) logged in successfully`);

    return { success: true, user };
  }

  static logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.logActivity('Logout', `User ${user.name} logged out`);
    }
    this.setCurrentUser(null);
  }

  static forgotPassword(email: string): { success: boolean; error?: string; resetToken?: string; message?: string } {
    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'No account registered with this email address.' };
    }
    if (user.status === 'inactive') {
      return { success: false, error: 'This account is deactivated. Please contact the administrator.' };
    }
    const token = 'rst_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return {
      success: true,
      resetToken: token,
      message: `Password reset request generated for ${user.email}. Use the token or link below to set a new password.`,
    };
  }

  static resetPassword(emailOrUsername: string, newPassword: string): { success: boolean; error?: string } {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }
    const users = this.getUsers();
    const userIdx = users.findIndex(
      (u) => u.email.toLowerCase() === emailOrUsername.trim().toLowerCase() || u.username.toLowerCase() === emailOrUsername.trim().toLowerCase()
    );
    if (userIdx === -1) {
      return { success: false, error: 'User account not found.' };
    }
    users[userIdx].password = newPassword;
    users[userIdx].updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.saveUsers(users);
    this.logActivity('Password Reset', `Password reset for user ${users[userIdx].username}`);
    return { success: true };
  }

  static updateUser(
    id: number,
    userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> & { newPassword?: string }
  ): { success: boolean; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, error: 'User not found.' };
    }

    // Check unique username/email if changed
    if (userData.username && userData.username.toLowerCase() !== users[index].username.toLowerCase()) {
      if (users.some((u) => u.id !== id && u.username.toLowerCase() === userData.username!.toLowerCase())) {
        return { success: false, error: `Username "${userData.username}" is already taken.` };
      }
    }
    if (userData.email && userData.email.toLowerCase() !== users[index].email.toLowerCase()) {
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === userData.email!.toLowerCase())) {
        return { success: false, error: `Email "${userData.email}" is already registered.` };
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    users[index] = {
      ...users[index],
      name: userData.name ?? users[index].name,
      email: userData.email ?? users[index].email,
      mobile: userData.mobile ?? users[index].mobile,
      username: userData.username ?? users[index].username,
      role: userData.role ?? users[index].role,
      status: userData.status ?? users[index].status,
      password: userData.newPassword ? userData.newPassword : users[index].password,
      updated_at: now,
    };

    this.saveUsers(users);
    this.logActivity('User Updated', `Updated profile of ${users[index].name} (${users[index].username})`);
    return { success: true };
  }

  static toggleUserStatus(id: number): { success: boolean; error?: string; newStatus?: 'active' | 'inactive' } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, error: 'User not found.' };
    }
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      return { success: false, error: 'You cannot deactivate your own active logged-in account.' };
    }
    const newStatus = users[index].status === 'active' ? 'inactive' : 'active';
    users[index].status = newStatus;
    users[index].updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.saveUsers(users);
    this.logActivity('User Status Changed', `Changed status of ${users[index].username} to ${newStatus}`);
    return { success: true, newStatus };
  }

  static deleteUser(id: number): { success: boolean; error?: string } {
    const users = this.getUsers();
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      return { success: false, error: 'You cannot delete your own logged-in account.' };
    }
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) {
      return { success: false, error: 'User not found.' };
    }
    const updatedUsers = users.filter((u) => u.id !== id);
    this.saveUsers(updatedUsers);

    // Unassign staff from clients
    const clients = this.getClients();
    const updatedClients = clients.map((c) =>
      c.assigned_staff_id === id ? { ...c, assigned_staff_id: null } : c
    );
    this.saveClients(updatedClients);

    this.logActivity('User Deleted', `Deleted user account ${userToDelete.name} (${userToDelete.username})`);
    return { success: true };
  }

  static getSelectedFY(): FinancialYear {
    const fys = this.getFinancialYears();
    const storedId = localStorage.getItem(STORAGE_KEYS.SELECTED_FY_ID);
    if (storedId) {
      const found = fys.find((f) => f.id === Number(storedId));
      if (found) return found;
    }
    return fys[1] || fys[0]; // 2026-27 by default
  }

  static setSelectedFY(fy: FinancialYear) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_FY_ID, String(fy.id));
  }

  static getSelectedMonth(): string {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH);
    return stored || 'August';
  }

  static setSelectedMonth(month: string) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, month);
  }

  // Business Operations
  static logActivity(action: string, description: string) {
    const currentUser = this.getCurrentUser();
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: Date.now(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      action,
      description,
      ip_address: '103.21.124.55',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    logs.unshift(newLog);
    this.saveActivityLogs(logs.slice(0, 500));
  }

  static addClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): { success: boolean; error?: string; client?: Client } {
    const clients = this.getClients();
    const gstin = clientData.gstin.trim().toUpperCase();

    // Check duplicate GSTIN
    if (clients.some((c) => c.gstin.toUpperCase() === gstin)) {
      return { success: false, error: `Client with GSTIN "${gstin}" already exists in Master Database.` };
    }

    const validation = validateGSTIN(gstin);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newId = clients.length > 0 ? Math.max(...clients.map((c) => c.id)) + 1 : 101;
    const newClient: Client = {
      ...clientData,
      id: newId,
      gstin,
      created_at: now,
      updated_at: now,
    };

    clients.unshift(newClient);
    this.saveClients(clients);
    this.logActivity('Client Created', `Created client ${newClient.firm_name} (${newClient.gstin})`);
    return { success: true, client: newClient };
  }

  static updateClient(id: number, clientData: Partial<Client>): { success: boolean; error?: string } {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) return { success: false, error: 'Client not found.' };

    if (clientData.gstin) {
      const gstin = clientData.gstin.trim().toUpperCase();
      if (clients.some((c) => c.id !== id && c.gstin.toUpperCase() === gstin)) {
        return { success: false, error: `Another client with GSTIN "${gstin}" already exists.` };
      }
      clientData.gstin = gstin;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    clients[index] = {
      ...clients[index],
      ...clientData,
      updated_at: now,
    };

    this.saveClients(clients);
    this.logActivity('Client Updated', `Updated details for ${clients[index].firm_name}`);
    return { success: true };
  }

  static deleteClient(id: number): { success: boolean; error?: string } {
    const clients = this.getClients();
    const client = clients.find((c) => c.id === id);
    if (!client) return { success: false, error: 'Client not found.' };

    const remaining = clients.filter((c) => c.id !== id);
    this.saveClients(remaining);

    // Remove client from monthly work and work history
    const monthly = this.getMonthlyWork().filter((m) => m.client_id !== id);
    this.saveMonthlyWork(monthly);

    this.logActivity('Client Deleted', `Deleted client ${client.firm_name} (${client.gstin})`);
    return { success: true };
  }

  static updateMonthlyStatus(
    fyId: number,
    month: string,
    clientId: number,
    newStatus: WorkStatus,
    remark: string
  ): { success: boolean; updatedWork?: MonthlyWork } {
    const currentUser = this.getCurrentUser();
    const monthlyList = this.getMonthlyWork();
    const clients = this.getClients();
    const client = clients.find((c) => c.id === clientId);
    const fys = this.getFinancialYears();
    const fy = fys.find((f) => f.id === fyId);

    const index = monthlyList.findIndex(
      (m) => m.financial_year_id === fyId && m.month === month && m.client_id === clientId
    );

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const previousStatus: WorkStatus = index !== -1 ? monthlyList[index].status : 'Not Started';

    let updatedWork: MonthlyWork;

    if (index !== -1) {
      updatedWork = {
        ...monthlyList[index],
        status: newStatus,
        remark,
        updated_by: currentUser.id,
        updated_by_name: currentUser.name,
        updated_at: now,
      };
      monthlyList[index] = updatedWork;
    } else {
      updatedWork = {
        id: Date.now(),
        financial_year_id: fyId,
        month,
        client_id: clientId,
        status: newStatus,
        remark,
        updated_by: currentUser.id,
        updated_by_name: currentUser.name,
        updated_at: now,
      };
      monthlyList.push(updatedWork);
    }

    this.saveMonthlyWork(monthlyList);

    // Audit trail logging
    if (previousStatus !== newStatus || remark) {
      const historyList = this.getWorkHistory();
      const newHistory: WorkHistory = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        client_id: clientId,
        client_name: client?.client_name,
        firm_name: client?.firm_name,
        financial_year_id: fyId,
        fy_name: fy?.display_name,
        month,
        previous_status: previousStatus,
        new_status: newStatus,
        remark,
        changed_by: currentUser.id,
        changed_by_name: currentUser.name,
        changed_at: now,
      };
      historyList.unshift(newHistory);
      this.saveWorkHistory(historyList.slice(0, 1000));
    }

    this.logActivity(
      'Status Updated',
      `Updated ${month} work for ${client?.firm_name || 'Client #' + clientId} to "${newStatus}"`
    );

    return { success: true, updatedWork };
  }

  static addFinancialYear(startYear: number): { success: boolean; error?: string; fy?: FinancialYear } {
    const endYear = startYear + 1;
    const displayName = `${startYear}-${String(endYear).slice(2)}`;
    const fys = this.getFinancialYears();

    if (fys.some((f) => f.display_name === displayName)) {
      return { success: false, error: `Financial Year "${displayName}" already exists.` };
    }

    const newFy: FinancialYear = {
      id: Date.now(),
      start_year: startYear,
      end_year: endYear,
      display_name: displayName,
      start_date: `${startYear}-04-01`,
      end_date: `${endYear}-03-31`,
      is_active: true,
    };

    fys.push(newFy);
    this.saveFinancialYears(fys);
    this.logActivity('Financial Year Created', `Created Financial Year ${displayName}`);
    return { success: true, fy: newFy };
  }

  static addUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): { success: boolean; error?: string } {
    const users = this.getUsers();
    if (users.some((u) => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: 'Username is already taken.' };
    }
    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'Email is already registered.' };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newUser: User = {
      ...userData,
      id: Date.now(),
      created_at: now,
      updated_at: now,
    };
    users.push(newUser);
    this.saveUsers(users);
    this.logActivity('User Created', `Created ${userData.role} user: ${userData.name}`);
    return { success: true };
  }

  // ==========================================
  // BANK ACCOUNTS & TURNOVER (NEW FEATURE)
  // ==========================================
  static getBankAccounts(): ClientBankAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BANK_ACCOUNTS);
    if (!raw) {
      this.saveBankAccounts(initialBankAccounts);
      return initialBankAccounts;
    }
    return JSON.parse(raw);
  }

  static saveBankAccounts(accounts: ClientBankAccount[]) {
    localStorage.setItem(STORAGE_KEYS.BANK_ACCOUNTS, JSON.stringify(accounts));
  }

  static getClientBankAccounts(clientId: number): ClientBankAccount[] {
    const all = this.getBankAccounts();
    return all.filter((a) => a.client_id === clientId).sort((a, b) => a.slot_number - b.slot_number);
  }

  static saveClientBankAccount(accountData: {
    client_id: number;
    slot_number: BankAccountSlot;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    account_type: ClientBankAccount['account_type'];
    ifsc: string;
    status: ClientBankAccount['status'];
  }): ClientBankAccount {
    const all = this.getBankAccounts();
    const existingIndex = all.findIndex(
      (a) => a.client_id === accountData.client_id && a.slot_number === accountData.slot_number
    );
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let savedAccount: ClientBankAccount;

    if (existingIndex >= 0) {
      savedAccount = {
        ...all[existingIndex],
        ...accountData,
        updated_at: now,
      };
      all[existingIndex] = savedAccount;
    } else {
      savedAccount = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        ...accountData,
        created_at: now,
        updated_at: now,
      };
      all.push(savedAccount);
    }

    this.saveBankAccounts(all);
    const client = this.getClientById(accountData.client_id);
    this.logActivity(
      'Bank Account Saved',
      `Updated Bank Slot #${accountData.slot_number} (${accountData.bank_name}) for ${client?.firm_name || 'Client #' + accountData.client_id}`
    );
    return savedAccount;
  }

  static deleteClientBankAccount(accountId: number): void {
    let all = this.getBankAccounts();
    const target = all.find((a) => a.id === accountId);
    all = all.filter((a) => a.id !== accountId);
    this.saveBankAccounts(all);

    if (target) {
      // Also clean associated turnover & backups for this account
      let turnovers = this.getBankTurnover().filter((t) => t.bank_account_id !== accountId);
      this.saveBankTurnover(turnovers);

      let backups = this.getBankStatementBackups().filter((b) => b.bank_account_id !== accountId);
      this.saveBankStatementBackups(backups);

      const client = this.getClientById(target.client_id);
      this.logActivity(
        'Bank Account Removed',
        `Removed Bank Slot #${target.slot_number} (${target.bank_name}) for ${client?.firm_name || 'Client #' + target.client_id}`
      );
    }
  }

  static getBankTurnover(): ClientBankTurnover[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BANK_TURNOVER);
    if (!raw) {
      this.saveBankTurnover(initialBankTurnover);
      return initialBankTurnover;
    }
    return JSON.parse(raw);
  }

  static saveBankTurnover(turnoverList: ClientBankTurnover[]) {
    localStorage.setItem(STORAGE_KEYS.BANK_TURNOVER, JSON.stringify(turnoverList));
  }

  static getClientBankTurnover(clientId: number, fyId: number): ClientBankTurnover[] {
    const all = this.getBankTurnover();
    return all.filter((t) => t.client_id === clientId && t.financial_year_id === fyId);
  }

  static batchSaveClientBankTurnover(
    clientId: number,
    bankAccountId: number,
    fyId: number,
    monthlyAmounts: Record<string, number>
  ): void {
    const all = this.getBankTurnover();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Remove existing turnover for this client + bank_account + FY to prevent duplicates
    const filtered = all.filter(
      (t) => !(t.client_id === clientId && t.bank_account_id === bankAccountId && t.financial_year_id === fyId)
    );

    // Insert new valid rows
    Object.entries(monthlyAmounts).forEach(([month, amount]) => {
      const numAmount = Number(amount) || 0;
      filtered.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        client_id: clientId,
        bank_account_id: bankAccountId,
        financial_year_id: fyId,
        month,
        turnover_amount: numAmount,
        created_at: now,
        updated_at: now,
      });
    });

    this.saveBankTurnover(filtered);
  }

  static getBankStatementBackups(): BankStatementBackup[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BANK_STATEMENTS);
    if (!raw) {
      this.saveBankStatementBackups(initialBankStatementBackups);
      return initialBankStatementBackups;
    }
    return JSON.parse(raw);
  }

  static saveBankStatementBackups(backups: BankStatementBackup[]) {
    localStorage.setItem(STORAGE_KEYS.BANK_STATEMENTS, JSON.stringify(backups));
  }

  static getClientBankStatements(clientId: number, fyId: number): BankStatementBackup[] {
    const all = this.getBankStatementBackups();
    return all.filter((b) => b.client_id === clientId && b.financial_year_id === fyId);
  }

  static saveBankStatementBackup(backupData: {
    client_id: number;
    bank_account_id: number;
    financial_year_id: number;
    file_name: string;
    file_size: number;
    file_data_base64?: string;
  }): BankStatementBackup {
    const all = this.getBankStatementBackups();
    const currentUser = this.getCurrentUser() || initialUsers[0];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Random safe stored filename
    const randomHex = Math.random().toString(36).substring(2, 10);
    const storedFileName = `stmt_${backupData.client_id}_${backupData.bank_account_id}_${backupData.financial_year_id}_${randomHex}.zip`;

    // Filter out previous backup for this slot & FY if replacing
    const filtered = all.filter(
      (b) =>
        !(
          b.client_id === backupData.client_id &&
          b.bank_account_id === backupData.bank_account_id &&
          b.financial_year_id === backupData.financial_year_id
        )
    );

    const newBackup: BankStatementBackup = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      client_id: backupData.client_id,
      bank_account_id: backupData.bank_account_id,
      financial_year_id: backupData.financial_year_id,
      file_name: backupData.file_name,
      stored_file_name: storedFileName,
      file_size: backupData.file_size,
      file_data_base64: backupData.file_data_base64,
      uploaded_at: now,
      uploaded_by: currentUser.id,
      uploaded_by_name: currentUser.name,
    };

    filtered.push(newBackup);
    this.saveBankStatementBackups(filtered);

    const client = this.getClientById(backupData.client_id);
    this.logActivity(
      'Statement Backup Uploaded',
      `Uploaded ZIP Statement (${backupData.file_name}) for ${client?.firm_name || 'Client #' + backupData.client_id}`
    );

    return newBackup;
  }

  static deleteBankStatementBackup(backupId: number): void {
    let all = this.getBankStatementBackups();
    const target = all.find((b) => b.id === backupId);
    all = all.filter((b) => b.id !== backupId);
    this.saveBankStatementBackups(all);

    if (target) {
      const client = this.getClientById(target.client_id);
      this.logActivity(
        'Statement Backup Deleted',
        `Deleted statement backup (${target.file_name}) for ${client?.firm_name || 'Client #' + target.client_id}`
      );
    }
  }

  static getClientBankTurnoverSummary(clientId: number, fyId: number): {
    accountCount: number;
    grandTotal: number;
    accounts: ClientBankAccount[];
    accountTotals: Record<number, number>;
  } {
    const accounts = this.getClientBankAccounts(clientId);
    const turnovers = this.getClientBankTurnover(clientId, fyId);

    const accountTotals: Record<number, number> = {};
    let grandTotal = 0;

    accounts.forEach((acc) => {
      const accTurnovers = turnovers.filter((t) => t.bank_account_id === acc.id);
      const total = accTurnovers.reduce((sum, t) => sum + (Number(t.turnover_amount) || 0), 0);
      accountTotals[acc.id] = total;
      grandTotal += total;
    });

    return {
      accountCount: accounts.length,
      grandTotal,
      accounts,
      accountTotals,
    };
  }

  // ==========================================
  // GST MONTHLY TURNOVER (TAXABLE + EXEMPT)
  // ==========================================
  static getGstTurnover(): ClientGstTurnover[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GST_TURNOVER);
    if (!raw) {
      this.saveGstTurnover(initialGstTurnover);
      return initialGstTurnover;
    }
    return JSON.parse(raw);
  }

  static saveGstTurnover(turnoverList: ClientGstTurnover[]) {
    localStorage.setItem(STORAGE_KEYS.GST_TURNOVER, JSON.stringify(turnoverList));
  }

  static getClientGstTurnover(clientId: number, fyId: number): ClientGstTurnover[] {
    const all = this.getGstTurnover();
    return all.filter((g) => g.client_id === clientId && g.financial_year_id === fyId);
  }

  static batchSaveClientGstTurnover(
    clientId: number,
    fyId: number,
    monthlyData: Record<string, { taxable: number; exempt: number }>
  ): void {
    const all = this.getGstTurnover();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Remove existing turnover for this client + FY
    const filtered = all.filter(
      (g) => !(g.client_id === clientId && g.financial_year_id === fyId)
    );

    Object.entries(monthlyData).forEach(([month, data]) => {
      const taxable = Number(data.taxable) || 0;
      const exempt = Number(data.exempt) || 0;
      filtered.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        client_id: clientId,
        financial_year_id: fyId,
        month,
        taxable_turnover: taxable,
        exempt_turnover: exempt,
        total_gst_turnover: taxable + exempt,
        created_at: now,
        updated_at: now,
      });
    });

    this.saveGstTurnover(filtered);
    const client = this.getClientById(clientId);
    this.logActivity(
      'GST Turnover Updated',
      `Saved 12-month GST turnover figures for ${client?.firm_name || 'Client #' + clientId}`
    );
  }

  // ==========================================
  // REPORT COMPILER HELPER (REAL-TIME AGGREGATION)
  // ==========================================
  static getFinancialReportData(clientId: number, fyId: number): FinancialReportData | null {
    const client = this.getClientById(clientId);
    if (!client) return null;

    const fys = this.getFinancialYears();
    const financialYear = fys.find((f) => f.id === fyId) || fys[0];

    // 1. GST Turnover (Taxable + Exempt + Total)
    const gstRecords = this.getClientGstTurnover(clientId, fyId);
    let totalTaxable = 0;
    let totalExempt = 0;
    let totalGst = 0;

    const gstRows = FY_MONTHS.map((m) => {
      const rec = gstRecords.find((r) => r.month === m);
      const taxable = rec ? Number(rec.taxable_turnover) || 0 : 0;
      const exempt = rec ? Number(rec.exempt_turnover) || 0 : 0;
      const total = taxable + exempt;

      totalTaxable += taxable;
      totalExempt += exempt;
      totalGst += total;

      return {
        month: m,
        taxable,
        exempt,
        total,
      };
    });

    // 2. Bank Accounts (Up to 5 slots)
    const bankAccountsList = this.getClientBankAccounts(clientId);
    const bankTurnovers = this.getClientBankTurnover(clientId, fyId);

    const slotNumbers: BankAccountSlot[] = [1, 2, 3, 4, 5];
    let totalBankTurnover = 0;

    const bankAccounts = slotNumbers.map((slotNum) => {
      const acc = bankAccountsList.find((a) => a.slot_number === slotNum) || null;
      const monthlyTurnover: Record<string, number> = {};
      let accTotal = 0;

      FY_MONTHS.forEach((m) => {
        if (acc) {
          const rec = bankTurnovers.find(
            (t) => t.bank_account_id === acc.id && t.month === m
          );
          const amt = rec ? Number(rec.turnover_amount) || 0 : 0;
          monthlyTurnover[m] = amt;
          accTotal += amt;
        } else {
          monthlyTurnover[m] = 0;
        }
      });

      if (acc) {
        totalBankTurnover += accTotal;
      }

      return {
        slotNumber: slotNum,
        account: acc,
        monthlyTurnover,
        total: accTotal,
      };
    });

    return {
      client,
      financialYear,
      gstRows,
      gstTotals: {
        taxable: totalTaxable,
        exempt: totalExempt,
        total: totalGst,
      },
      bankAccounts,
      totalBankTurnover,
    };
  }

  static resetToDefaultSeed() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.FINANCIAL_YEARS);
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_WORK);
    localStorage.removeItem(STORAGE_KEYS.WORK_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_FY_ID);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_MONTH);
    localStorage.removeItem(STORAGE_KEYS.BANK_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.BANK_TURNOVER);
    localStorage.removeItem(STORAGE_KEYS.BANK_STATEMENTS);
    localStorage.removeItem(STORAGE_KEYS.GST_TURNOVER);
  }
}
