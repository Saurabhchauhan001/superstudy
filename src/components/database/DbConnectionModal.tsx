'use client';
import { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, HelpCircle, Server, Key } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface DbStatus {
  isConnected: boolean;
  readyState: number;
  uriConfigured: boolean;
  dbName?: string;
  host?: string;
  error?: string;
}

export default function DbConnectionModal({
  isOpen,
  onClose,
  onConnected,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}) {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setTestResult(null);
    }
  }, [isOpen]);

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch('/api/settings/db');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ isConnected: false, readyState: 0, uriConfigured: false });
    } finally {
      setChecking(false);
    }
  }

  async function handleTest() {
    if (!connectionString.trim()) {
      toast('Please enter a MongoDB connection string', 'error');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionString.trim(), saveToEnv: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ success: false, message: data.error || 'Connection failed' });
      } else {
        setTestResult({
          success: true,
          message: `Connection successful! Database: ${data.dbName || 'connected'}`,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error testing connection',
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveAndConnect() {
    if (!connectionString.trim()) {
      toast('Please enter a MongoDB connection string', 'error');
      return;
    }
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionString.trim(), saveToEnv: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ success: false, message: data.error || 'Failed to connect and save' });
        toast(data.error || 'Failed to connect', 'error');
      } else {
        toast('Connected to MongoDB and saved!', 'success');
        setTestResult({
          success: true,
          message: `Connected successfully! All data will now be stored in database: "${data.dbName || 'MongoDB'}".`,
        });
        await checkStatus();
        if (onConnected) onConnected();
      }
    } catch (err: unknown) {
      toast('Connection error', 'error');
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to connect',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">MongoDB Connection</h2>
            <p className="text-xs text-slate-500">Connect your database to store subjects, MCQs, and exam results.</p>
          </div>
        </div>

        {/* Live Status Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status</span>
            <button
              onClick={checkStatus}
              disabled={checking}
              className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="flex items-center gap-2">
            {status?.isConnected ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Connected</span>
                  {status.dbName && (
                    <p className="text-xs text-slate-500">
                      Database: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{status.dbName}</span>
                      {status.host ? ` on ${status.host}` : ''}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-amber-600 dark:text-amber-400">Not Connected</span>
                  <p className="text-xs text-slate-500">Enter your MongoDB connection string below to connect.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            MongoDB Connection String (URI)
          </label>
          <input
            type="text"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="mongodb+srv://user:password@cluster0.mongodb.net/preptrack?retryWrites=true&w=majority"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-400">
            Supports local MongoDB (<code className="text-xs font-mono">mongodb://localhost:27017/preptrack</code>) or MongoDB Atlas cloud cluster.
          </p>
        </div>

        {/* Feedback message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <span className="break-all">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleTest}
            disabled={testing || saving || !connectionString.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSaveAndConnect}
            disabled={saving || testing || !connectionString.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving ? 'Connecting...' : 'Save & Connect'}
          </button>
        </div>

        {/* Quick Help Collapsible */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" /> How to get a free MongoDB Atlas connection string?
          </button>

          {showGuide && (
            <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>Create a free account at <strong className="text-indigo-600">mongodb.com/atlas</strong>.</li>
                <li>Create a free <strong className="text-slate-900 dark:text-white">M0 Sandbox Cluster</strong> (100% free).</li>
                <li>Go to <strong className="text-slate-900 dark:text-white">Database Access</strong> and create a Database User with password.</li>
                <li>Go to <strong className="text-slate-900 dark:text-white">Network Access</strong> and click &quot;Add IP Address&quot; &rarr; Choose &quot;Allow Access from Anywhere&quot; (<code className="font-mono">0.0.0.0/0</code>).</li>
                <li>Click <strong className="text-slate-900 dark:text-white">&quot;Connect&quot;</strong> &rarr; &quot;Drivers&quot; &rarr; Copy the connection string and paste it above!</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
