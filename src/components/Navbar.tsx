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
  onSwitchUser: (user: User) => void;
  users: User[];
  financialYears: FinancialYear[];
  selectedFY: FinancialYear;
  onSelectFY: (fy: FinancialYear) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onToggleSidebar: () => void;
  onOpenHostingerModal: () => void;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  users,
  financialYears,
  selectedFY,
  onSelectFY,
  selectedMonth,
  onSelectMonth,
  onToggleSidebar,
  onOpenHostingerModal,
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
              <div className="font-bold text-slate-900 leading-tight text-sm md:text-base">
                {companyName}
              </div>
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                GST Client & Monthly Work Portal
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

          {/* Hostinger Package Deployer Button */}
          <button
            id="hostinger-package-header-btn"
            onClick={onOpenHostingerModal}
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-all"
            title="Download Hostinger PHP/MySQL Package"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Hostinger Package</span>
            <span className="bg-emerald-800/60 text-[10px] px-1.5 py-0.2 rounded-full font-mono">PHP</span>
          </button>

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

            {/* Switch User Dropdown */}
            <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Signed in as:</div>
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentUser.role.toUpperCase()}
                </span>
              </div>

              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role / User:
              </div>

              {users.map((u) => (
                <button
                  key={u.id}
                  id={`switch-user-${u.id}-btn`}
                  onClick={() => onSwitchUser(u)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                    u.id === currentUser.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {u.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> : <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                    <span className="truncate">{u.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase">{u.role}</span>
                </button>
              ))}

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  id="hostinger-package-dropdown-btn"
                  onClick={onOpenHostingerModal}
                  className="w-full text-left px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Hostinger PHP Code & SQL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
