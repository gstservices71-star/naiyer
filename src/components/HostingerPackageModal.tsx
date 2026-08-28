import React, { useState } from 'react';
import { PHP_CODEBASE, PHPFile } from '../data/phpCodebase';
import { GSTStorage } from '../utils/storage';
import {
  X,
  Download,
  FileCode,
  FolderTree,
  Check,
  Copy,
  Database,
  Server,
  Terminal,
  ShieldCheck,
  ExternalLink,
  Info,
} from 'lucide-react';

interface HostingerPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingerPackageModal: React.FC<HostingerPackageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<PHPFile>(PHP_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'guide'>('files');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const blob = await GSTStorage.generateHostingerZip();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hostinger_gst_portal_php8_mysql.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const categories = Array.from(new Set(PHP_CODEBASE.map((f) => f.category)));

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              PHP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Hostinger PHP 8 + MySQL Deployment Center
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  Production Ready
                </span>
              </div>
              <p className="text-xs text-slate-300">
                100% Native PHP 8, PDO Prepared Statements, No Node.js / Laravel / Composer required.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="download-complete-zip-btn"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Generating ZIP...' : 'Download Hostinger Package (.zip)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-1 border-b-2 font-bold transition-colors ${
              activeTab === 'files'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Source Code Explorer ({PHP_CODEBASE.length} files)
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-1 border-b-2 font-bold transition-colors ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Hostinger Step-by-Step Installation Guide
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'files' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: File Tree */}
            <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto p-3 space-y-4 text-xs">
              {categories.map((cat) => (
                <div key={cat}>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {cat}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {PHP_CODEBASE.filter((f) => f.category === cat).map((file) => {
                      const isSelected = selectedFile.path === file.path;
                      return (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-mono text-[11px] transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <FileCode
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-white' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{file.path}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Code Viewer */}
            <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
              {/* File details bar */}
              <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-emerald-400">{selectedFile.path}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Code Pre container */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 selection:bg-blue-600 selection:text-white">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        ) : (
          /* Guide Tab */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900">
              <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <span>Zero-Configuration Hostinger Shared Hosting Deployment</span>
              </h4>
              <p>
                This application requires no Node.js build steps, no SSH commands, and no npm/composer.
                Follow the 4 simple steps below using Hostinger hPanel File Manager and phpMyAdmin.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <span>Create Database in Hostinger hPanel</span>
                </div>
                <p className="text-slate-600 ml-8">
                  Navigate to <strong>Databases → MySQL Databases</strong>. Enter a database name (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">gst_portal</code>), username, and strong password. Click <strong>Create</strong>.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <span>Import `database.sql` via phpMyAdmin</span>
                </div>
                <p className="text-slate-600 ml-8">
                  Click <strong>Enter phpMyAdmin</strong> next to your new database. Click the <strong>Import</strong> tab, select <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">database.sql</code> from the package, and click <strong>Go</strong>.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <span>Upload Files to `public_html` via File Manager</span>
                </div>
                <p className="text-slate-600 ml-8">
                  Open <strong>Files → File Manager</strong> in Hostinger. Go inside the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">public_html</code> directory. Extract the contents of <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">hostinger_gst_portal_php8_mysql.zip</code> directly into <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">public_html</code>.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <span>Update `config/database.php`</span>
                </div>
                <p className="text-slate-600 ml-8 mb-2">
                  Inside File Manager, open <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">config/database.php</code> and set your database name, username, and password:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs ml-8">
                  define('DB_HOST', 'localhost');<br />
                  define('DB_NAME', 'u123456789_gstadmin');<br />
                  define('DB_USER', 'u123456789_gstuser');<br />
                  define('DB_PASS', 'YourSecretPassword');
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    5
                  </span>
                  <span>Log In & Start Tracking</span>
                </div>
                <p className="text-slate-600 ml-8">
                  Open your domain (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://yourdomain.com</code>) in any browser. Log in with:
                  <br />
                  • Username: <strong className="text-slate-900">admin</strong>
                  <br />
                  • Password: <strong className="text-slate-900">admin</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
