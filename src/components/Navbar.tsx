import React from 'react';
import { User, FinancialYear, FY_MONTHS } from '../types';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Download, 
  LogOut, 
  Menu, 
  ShieldCheck, 
  UserCheck, 
  User as UserIcon,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSwitchUser?: (user: User) => void;
  onLogout: () => void;
  users?: User[];
  financialYears: FinancialYear[];
  selectedFY: FinancialYear;
  onSelectFY: (fy: FinancialYear) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onToggleSidebar: () => void;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  onLogout,
  users,
  financialYears,
  selectedFY,
  onSelectFY,
  selectedMonth,
  onSelectMonth,
  onToggleSidebar,
  companyName,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-950 tracking-tight text-base sm:text-lg leading-tight">
                {companyName}
              </div>
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>GST Client & Monthly Work Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* FY Selector */}
          <div className="flex items-center bg-blue-50/80 border border-blue-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
            <span className="font-semibold text-blue-950 mr-1 hidden sm:inline">FY:</span>
            <select
              id="global-fy-selector"
              value={selectedFY.id}
              onChange={(e) => {
                const found = financialYears.find((f) => f.id === Number(e.target.value));
                if (found) onSelectFY(found);
              }}
              className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer pr-1 text-xs"
            >
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-600 mr-1.5" />
            <span className="font-semibold text-slate-700 mr-1 hidden sm:inline">Month:</span>
            <select
              id="global-month-selector"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              {FY_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 leading-none">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* User Profile Dropdown */}
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Signed in as:</div>
                <div className="text-sm font-bold text-slate-900 truncate mt-0.5">{currentUser.name}</div>
                {currentUser.email && (
                  <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentUser.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{currentUser.role.toUpperCase()}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">@{currentUser.username}</span>
                </div>
              </div>

              <div className="px-2 pt-1.5">
                <button
                  id="user-logout-dropdown-btn"
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out / Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Direct Logout Icon Button */}
          <button
            id="navbar-logout-btn"
            onClick={onLogout}
            title="Sign Out / Lock Session"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
