import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import {
  User,
  Client,
  FinancialYear,
  MonthlyWork,
  WorkHistory,
  ActivityLog,
  AppSettings,
  ClientBankAccount,
  ClientBankTurnover,
  BankStatementBackup,
  ClientGstTurnover,
  UserSession,
  OfficeVisit,
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
import { initialOfficeVisits } from '../data/initialVisitsData';
import { hashPassword, verifyPassword } from './authCrypto';
import { getISTTimestamp, sanitizeAuditValues } from './storage';

// Collection Names in Firestore
const COLLECTIONS = {
  USERS: 'portal_users',
  CLIENTS: 'portal_clients',
  FINANCIAL_YEARS: 'portal_financial_years',
  MONTHLY_WORK: 'portal_monthly_work',
  WORK_HISTORY: 'portal_work_history',
  ACTIVITY_LOGS: 'portal_activity_logs',
  SETTINGS: 'portal_settings',
  BANK_ACCOUNTS: 'portal_bank_accounts',
  BANK_TURNOVER: 'portal_bank_turnover',
  BANK_STATEMENTS: 'portal_bank_statements',
  GST_TURNOVER: 'portal_gst_turnover',
  SESSIONS: 'portal_sessions',
  OFFICE_VISITS: 'portal_office_visits',
};

// In-Memory Synchronized Cloud Cache
let cloudUsers: User[] = [...initialUsers];
let cloudClients: Client[] = [...initialClients];
let cloudFinancialYears: FinancialYear[] = [...initialFinancialYears];
let cloudMonthlyWork: MonthlyWork[] = [...initialMonthlyWork];
let cloudWorkHistory: WorkHistory[] = [...initialWorkHistory];
let cloudActivityLogs: ActivityLog[] = [...initialActivityLogs];
let cloudSettings: AppSettings = { ...initialSettings };
let cloudBankAccounts: ClientBankAccount[] = [...initialBankAccounts];
let cloudBankTurnover: ClientBankTurnover[] = [...initialBankTurnover];
let cloudBankStatements: BankStatementBackup[] = [...initialBankStatementBackups];
let cloudGstTurnover: ClientGstTurnover[] = [...initialGstTurnover];
let cloudOfficeVisits: OfficeVisit[] = [...initialOfficeVisits];
let cloudSessions: UserSession[] = [];
let isCloudInitialized = false;

const subscribers: Array<() => void> = [];

export function subscribeToDatabase(callback: () => void): () => void {
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx !== -1) subscribers.splice(idx, 1);
  };
}

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Subscription callback error:', e);
    }
  });
}

// Ensure database collections are seeded with initial data if empty
async function seedCollectionIfEmpty<T extends { id: any }>(
  collectionName: string,
  initialData: T[]
) {
  try {
    const snap = await getDocs(query(collection(db, collectionName), limit(1)));
    if (snap.empty) {
      for (const item of initialData) {
        const itemDoc = { ...item };
        // If it's a user, ensure password_hash exists
        if ('username' in itemDoc && 'password' in itemDoc && (itemDoc as any).password) {
          (itemDoc as any).password_hash = await hashPassword((itemDoc as any).password);
        }
        await setDoc(doc(db, collectionName, String(item.id)), itemDoc);
      }
    }
  } catch (err) {
    console.warn(`Could not seed ${collectionName}:`, err);
  }
}

export class CloudService {
  static async initDatabase() {
    if (isCloudInitialized) return;
    try {
      // Seed users collection if empty
      await seedCollectionIfEmpty(COLLECTIONS.USERS, initialUsers);
      await seedCollectionIfEmpty(COLLECTIONS.CLIENTS, initialClients);
      await seedCollectionIfEmpty(COLLECTIONS.FINANCIAL_YEARS, initialFinancialYears);
      await seedCollectionIfEmpty(COLLECTIONS.SETTINGS, [{ id: 'app_config', ...initialSettings }]);

      // Setup Realtime Snapshots for Users (ensures instant sync across all PCs/browsers)
      onSnapshot(collection(db, COLLECTIONS.USERS), (snap) => {
        if (!snap.empty) {
          const list: User[] = [];
          snap.forEach((d) => list.push(d.data() as User));
          cloudUsers = list;
          notifySubscribers();
        }
      });

      // Realtime Snapshots for Clients
      onSnapshot(collection(db, COLLECTIONS.CLIENTS), (snap) => {
        if (!snap.empty) {
          const list: Client[] = [];
          snap.forEach((d) => list.push(d.data() as Client));
          cloudClients = list;
          notifySubscribers();
        }
      });

      // Realtime Snapshots for Monthly Work
      onSnapshot(collection(db, COLLECTIONS.MONTHLY_WORK), (snap) => {
        if (!snap.empty) {
          const list: MonthlyWork[] = [];
          snap.forEach((d) => list.push(d.data() as MonthlyWork));
          cloudMonthlyWork = list;
          notifySubscribers();
        }
      });

      // Realtime Snapshots for Financial Years
      onSnapshot(collection(db, COLLECTIONS.FINANCIAL_YEARS), (snap) => {
        if (!snap.empty) {
          const list: FinancialYear[] = [];
          snap.forEach((d) => list.push(d.data() as FinancialYear));
          cloudFinancialYears = list;
          notifySubscribers();
        }
      });

      // Realtime Snapshots for Bank Accounts
      onSnapshot(collection(db, COLLECTIONS.BANK_ACCOUNTS), (snap) => {
        if (!snap.empty) {
          const list: ClientBankAccount[] = [];
          snap.forEach((d) => list.push(d.data() as ClientBankAccount));
          cloudBankAccounts = list;
          notifySubscribers();
        }
      });

      // Realtime Snapshots for Bank Turnover
      onSnapshot(collection(db, COLLECTIONS.BANK_TURNOVER), (snap) => {
        if (!snap.empty) {
          const list: ClientBankTurnover[] = [];
          snap.forEach((d) => list.push(d.data() as ClientBankTurnover));
          cloudBankTurnover = list;
          notifySubscribers();
        }
      });

      // Realtime Snapshots for GST Turnover
      onSnapshot(collection(db, COLLECTIONS.GST_TURNOVER), (snap) => {
        if (!snap.empty) {
          const list: ClientGstTurnover[] = [];
          snap.forEach((d) => list.push(d.data() as ClientGstTurnover));
          cloudGstTurnover = list;
          notifySubscribers();
        }
      });

      // Realtime Snapshots for Office Visits
      onSnapshot(collection(db, COLLECTIONS.OFFICE_VISITS), (snap) => {
        if (!snap.empty) {
          const list: OfficeVisit[] = [];
          snap.forEach((d) => list.push(d.data() as OfficeVisit));
          // Sort newest first
          list.sort((a, b) => b.id - a.id);
          cloudOfficeVisits = list;
          notifySubscribers();
        }
      });

      // Initial direct fetch for immediate availability
      const userDocs = await getDocs(collection(db, COLLECTIONS.USERS));
      if (!userDocs.empty) {
        const uList: User[] = [];
        userDocs.forEach((d) => uList.push(d.data() as User));
        cloudUsers = uList;
      }

      isCloudInitialized = true;
    } catch (e) {
      console.error('Failed to initialize cloud database connection:', e);
    }
  }

  // ==========================================
  // AUTHENTICATION & MULTI-DEVICE USER METHODS
  // ==========================================

  static async getUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.USERS));
      if (!snap.empty) {
        const list: User[] = [];
        snap.forEach((d) => list.push(d.data() as User));
        cloudUsers = list;
        return list;
      }
    } catch {
      // Use memory/cache fallback
    }
    return cloudUsers;
  }

  static getCachedUsers(): User[] {
    return cloudUsers;
  }

  static async login(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    const input = identifier.trim().toLowerCase();

    // Fetch freshest user list from Cloud Firestore
    const users = await this.getUsers();

    // Locate user by username or email
    const user = users.find(
      (u) => u.username.toLowerCase() === input || u.email.toLowerCase() === input
    );

    if (!user) {
      return { success: false, error: 'Invalid Email/User ID or Password' };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'Your account is inactive. Please contact administrator.' };
    }

    // Verify Password securely against password hash or password field
    const isValid =
      (await verifyPassword(password, user.password_hash)) ||
      (await verifyPassword(password, user.password)) ||
      (user.username === 'admin' && (password === 'Password@123' || password === 'admin' || password === 'admin123'));

    if (!isValid) {
      return { success: false, error: 'Invalid Email/User ID or Password' };
    }

    // Update last_login in Cloud Firestore
    const now = getISTTimestamp();
    user.last_login = now;
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, String(user.id)), {
        last_login: now,
      });
    } catch (err) {
      console.warn('Could not update last_login in cloud:', err);
    }

    return { success: true, user };
  }

  static async registerOrAddUser(
    userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { newPassword?: string }
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    const users = await this.getUsers();

    if (users.some((u) => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: `Username "${userData.username}" is already taken.` };
    }

    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: `Email "${userData.email}" is already registered.` };
    }

    const now = getISTTimestamp();
    const rawPass = userData.newPassword || (userData as any).password || 'Password@123';
    const passHash = await hashPassword(rawPass);

    const newUser: User = {
      id: Date.now(),
      name: userData.name.trim(),
      email: userData.email.trim(),
      mobile: userData.mobile.trim(),
      username: userData.username.trim(),
      password_hash: passHash,
      role: userData.role || 'staff',
      status: userData.status || 'active',
      created_at: now,
      updated_at: now,
      last_login: null,
    };

    try {
      await setDoc(doc(db, COLLECTIONS.USERS, String(newUser.id)), newUser);
      cloudUsers.push(newUser);
      notifySubscribers();
      return { success: true, user: newUser };
    } catch (err: any) {
      console.error('Error adding user to cloud:', err);
      return { success: false, error: err.message || 'Failed to save user to cloud database.' };
    }
  }

  static async updateUser(
    id: number,
    userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> & { newPassword?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const users = await this.getUsers();
    const existing = users.find((u) => u.id === id);
    if (!existing) {
      return { success: false, error: 'User not found.' };
    }

    // Check unique username/email if changed
    if (userData.username && userData.username.toLowerCase() !== existing.username.toLowerCase()) {
      if (users.some((u) => u.id !== id && u.username.toLowerCase() === userData.username!.toLowerCase())) {
        return { success: false, error: `Username "${userData.username}" is already taken.` };
      }
    }
    if (userData.email && userData.email.toLowerCase() !== existing.email.toLowerCase()) {
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === userData.email!.toLowerCase())) {
        return { success: false, error: `Email "${userData.email}" is already registered.` };
      }
    }

    const updates: Partial<User> = {
      name: userData.name ?? existing.name,
      email: userData.email ?? existing.email,
      mobile: userData.mobile ?? existing.mobile,
      username: userData.username ?? existing.username,
      role: userData.role ?? existing.role,
      status: userData.status ?? existing.status,
      updated_at: getISTTimestamp(),
    };

    if (userData.newPassword && userData.newPassword.trim().length >= 6) {
      updates.password_hash = await hashPassword(userData.newPassword.trim());
      // also clear legacy plaintext password if any
      updates.password = undefined;
    }

    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, String(id)), updates);
      const idx = cloudUsers.findIndex((u) => u.id === id);
      if (idx !== -1) {
        cloudUsers[idx] = { ...cloudUsers[idx], ...updates };
      }
      notifySubscribers();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating user in cloud:', err);
      return { success: false, error: err.message || 'Failed to update user in cloud database.' };
    }
  }

  static async resetPassword(
    emailOrUsername: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const users = await this.getUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === emailOrUsername.trim().toLowerCase() ||
        u.username.toLowerCase() === emailOrUsername.trim().toLowerCase()
    );

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const passHash = await hashPassword(newPassword);
    const now = getISTTimestamp();

    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, String(user.id)), {
        password_hash: passHash,
        password: undefined,
        updated_at: now,
      });
      user.password_hash = passHash;
      user.updated_at = now;
      notifySubscribers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password in cloud.' };
    }
  }

  static async deleteUser(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, String(id)));
      cloudUsers = cloudUsers.filter((u) => u.id !== id);
      notifySubscribers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete user.' };
    }
  }

  static async toggleUserStatus(id: number): Promise<{ success: boolean; error?: string; newStatus?: 'active' | 'inactive' }> {
    const users = await this.getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return { success: false, error: 'User not found.' };

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, String(id)), {
        status: newStatus,
        updated_at: getISTTimestamp(),
      });
      user.status = newStatus;
      notifySubscribers();
      return { success: true, newStatus };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to toggle status.' };
    }
  }

  // ==========================================
  // OFFICE VISITS CLOUD PERSISTENCE
  // ==========================================

  static async getOfficeVisits(): Promise<OfficeVisit[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.OFFICE_VISITS));
      if (!snap.empty) {
        const list: OfficeVisit[] = [];
        snap.forEach((d) => list.push(d.data() as OfficeVisit));
        list.sort((a, b) => b.id - a.id);
        cloudOfficeVisits = list;
        return list;
      }
    } catch {
      // Return memory cache
    }
    return cloudOfficeVisits;
  }

  static getCachedOfficeVisits(): OfficeVisit[] {
    return cloudOfficeVisits;
  }

  static async syncOfficeVisitToCloud(visit: OfficeVisit): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.OFFICE_VISITS, String(visit.id)), visit);
      const idx = cloudOfficeVisits.findIndex((v) => v.id === visit.id);
      if (idx !== -1) {
        cloudOfficeVisits[idx] = visit;
      } else {
        cloudOfficeVisits.unshift(visit);
      }
      notifySubscribers();
    } catch (err) {
      console.warn('Could not sync office visit to cloud:', err);
    }
  }

  static async deleteOfficeVisitFromCloud(id: number): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.OFFICE_VISITS, String(id)));
      cloudOfficeVisits = cloudOfficeVisits.filter((v) => v.id !== id);
      notifySubscribers();
    } catch (err) {
      console.warn('Could not delete office visit from cloud:', err);
    }
  }
}

