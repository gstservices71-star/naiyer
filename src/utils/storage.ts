import {
  ActivityLog,
  AppSettings,
  Client,
  FinancialYear,
  MonthlyWork,
  User,
  WorkHistory,
  WorkStatus,
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
import { validateGSTIN } from './gstValidation';
import JSZip from 'jszip';
import { PHP_CODEBASE } from '../data/phpCodebase';

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

  static saveClients(clients: Client[]) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  static getFinancialYears(): FinancialYear[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCIAL_YEARS);
    if (!raw) {
      this.saveFinancialYears(initialFinancialYears);
      return initialFinancialYears;
    }
    return JSON.parse(raw);
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

  static getCurrentUser(): User {
    const users = this.getUsers();
    const storedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (storedId) {
      const found = users.find((u) => u.id === Number(storedId));
      if (found) return found;
    }
    return users[0] || initialUsers[0];
  }

  static setCurrentUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, String(user.id));
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
  }

  static async generateHostingerZip(): Promise<Blob> {
    const zip = new JSZip();

    // Populate all files from the complete PHP Codebase
    PHP_CODEBASE.forEach((file) => {
      zip.file(file.path, file.content);
    });

    return await zip.generateAsync({ type: 'blob' });
  }
}
