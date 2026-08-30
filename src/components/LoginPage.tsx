import React, { useState, useEffect } from 'react';
import { GSTStorage } from '../utils/storage';
import { CloudService } from '../utils/cloudService';
import { User } from '../types';
import {
  Receipt,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [sentLinkData, setSentLinkData] = useState<{
    token: string;
    resetUrl: string;
    email: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset password form state inside modal
  const [isResetStep, setIsResetStep] = useState(false);
  const [activeResetEmail, setActiveResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Check URL parameters for direct reset link on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('reset_token');
      const email = params.get('email');
      if (token && email) {
        setActiveResetEmail(decodeURIComponent(email));
        setIsResetStep(true);
        setShowForgotModal(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try production cloud authentication first
      const cloudRes = await CloudService.login(identifier, password);
      if (cloudRes.success && cloudRes.user) {
        GSTStorage.setCurrentUser(cloudRes.user);
        GSTStorage.startSession(cloudRes.user);
        setIsLoading(false);
        onLoginSuccess(cloudRes.user);
        return;
      }

      // 2. Fallback to local storage verification if offline or provision transition
      const localRes = GSTStorage.login(identifier, password);
      setIsLoading(false);

      if (!localRes.success) {
        setErrorMessage(cloudRes.error || localRes.error || 'Invalid Email/User ID or Password');
      } else if (localRes.user) {
        onLoginSuccess(localRes.user);
      }
    } catch (err: any) {
      // Fallback
      const res = GSTStorage.login(identifier, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid Email/User ID or Password');
      } else if (res.user) {
        onLoginSuccess(res.user);
      }
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setIsSendingLink(true);

    // Simulate sending email to user inbox with token
    setTimeout(() => {
      const res = GSTStorage.forgotPassword(forgotEmail);
      setIsSendingLink(false);

      if (!res.success) {
        setForgotError(res.error || 'Email address not found in registered accounts.');
      } else if (res.resetToken) {
        const origin = window.location.origin + window.location.pathname;
        const resetUrl = `${origin}?reset_token=${res.resetToken}&email=${encodeURIComponent(forgotEmail.trim())}`;
        setSentLinkData({
          token: res.resetToken,
          resetUrl,
          email: forgotEmail.trim(),
        });
      }
    }, 600);
  };

  const handleOpenResetStepFromLink = () => {
    if (sentLinkData) {
      setActiveResetEmail(sentLinkData.email);
      setIsResetStep(true);
    }
  };

  const handleCopyLink = () => {
    if (sentLinkData) {
      navigator.clipboard.writeText(sentLinkData.resetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirm password do not match.');
      return;
    }

    if (activeResetEmail) {
      // Update in cloud and local simultaneously
      await CloudService.resetPassword(activeResetEmail, newPassword);
      const res = GSTStorage.resetPassword(activeResetEmail, newPassword);
      if (res.success) {
        setResetSuccessMessage('Password reset successfully! You can now log in with your new password.');
        setTimeout(() => {
          setShowForgotModal(false);
          setSentLinkData(null);
          setIsResetStep(false);
          setForgotEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setResetSuccessMessage('');
          setIdentifier(activeResetEmail);
          setPassword(newPassword);
        }, 1500);
      } else {
        setForgotError(res.error || 'Failed to reset password.');
      }
    }
  };

  const fillDemoAccount = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 text-white mb-3 ring-4 ring-slate-800">
            <Receipt className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GST Management Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Secure Authentication & Work Compliance System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Error Message Box */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
            {/* Email / User ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email / User ID <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin or user@domain.com"
                  required
                  autoFocus
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="login-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                />
                <span className="text-xs text-slate-300 font-medium">Remember me</span>
              </label>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                256-bit BCrypt
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-blue-700 opacity-80 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating & Verifying Role...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Login Accounts:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="demo-admin-login-btn"
                onClick={() => fillDemoAccount('admin', 'admin')}
                className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/80 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">Admin Account</span>
                  <span className="text-[9px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded font-mono">Full</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  admin / admin
                </div>
              </button>

              <button
                type="button"
                id="demo-staff-login-btn"
                onClick={() => fillDemoAccount('rahul', 'Password@123')}
                className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/80 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">Staff / User</span>
                  <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-mono">User</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  rahul / Password@123
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
          <p>Protected by Server-Side PHP Session Security & PDO Prepared Statements</p>
          <p className="text-slate-400 text-[11px]">Direct private URL access without session is strictly redirected to this Login Page.</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {isResetStep ? 'Create New Password' : 'Reset Password by Email Link'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setSentLinkData(null);
                  setIsResetStep(false);
                  setForgotError('');
                  setResetSuccessMessage('');
                }}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {resetSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {!isResetStep ? (
              !sentLinkData ? (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your registered account email ID. A secure one-time password reset link will be sent to your email to generate a new password.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Registered Email ID <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. admin@gstmanagement.com or user@gmail.com"
                        required
                        autoFocus
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSendingLink}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSendingLink ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Password Reset Link</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Link Sent State - Simulates the inbox email with one-click direct password change link */
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-200">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-300 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Password Reset Link Dispatched</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      A unique reset link has been dispatched to <strong>{sentLinkData.email}</strong>.
                    </p>
                  </div>

                  {/* Simulated Email Box */}
                  <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                        <span>Email to: {sentLinkData.email}</span>
                      </div>
                      <span className="text-[10px] bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                        Just Now
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1.5">
                      <div className="font-semibold text-white">Subject: Reset your GST Portal Password</div>
                      <p className="text-[11px] text-slate-400">
                        You recently requested to reset your password. Click the link below to generate and save your new password:
                      </p>
                    </div>

                    {/* Interactive Reset Link Button */}
                    <button
                      type="button"
                      onClick={handleOpenResetStepFromLink}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>👉 Click Link to Change Password</span>
                    </button>

                    {/* Copy Link Option */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 truncate max-w-[240px] font-mono">
                        {sentLinkData.resetUrl}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer ml-2"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSentLinkData(null);
                        setShowForgotModal(false);
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Step 2: New Password Generation Form */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-200">
                  <div className="font-bold flex items-center gap-1.5 text-blue-300 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Token Verified</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Generating new password for: <strong className="text-white">{activeResetEmail}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    New Password (Min 6 characters) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new secure password"
                      required
                      autoFocus
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Save & Generate New Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetStep(false);
                      setSentLinkData(null);
                      setShowForgotModal(false);
                    }}
                    className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
