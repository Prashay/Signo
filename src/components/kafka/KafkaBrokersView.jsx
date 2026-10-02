import { useState } from 'react'
import {
  Server,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function KafkaBrokersView({ cluster, isProbing = false, onProbeCluster }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const isOnline = cluster?.status === 'online'
  const isChecking = cluster?.status === 'checking' || isProbing
  const host = cluster?.servers?.[0]?.host || 'localhost'
  const port = cluster?.servers?.[0]?.port || '8080'

  const brokers = cluster?.brokersList || [
    {
      id: 1,
      host,
      port,
      rack: 'us-east-1a',
      isController: true,
      partitionsCount: isOnline ? 16 : 0,
      diskUsage: isOnline ? '14.2 GB / 500 GB (2.8%)' : '0 Bytes',
      uptime: isOnline ? '4d 18h' : 'Offline',
      status: isOnline ? 'UP' : 'DOWN'
    }
  ]

  return (
    <div
      className={`flex-1 overflow-y-auto p-8 transition-colors ${
        isDark ? 'bg-[#07090f] text-mist-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`flex h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span
              className={`text-[11px] font-mono uppercase tracking-widest font-semibold ${
                isOnline
                  ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                  : isDark ? 'text-rose-400' : 'text-rose-700'
              }`}
            >
              Cluster Topology ({isOnline ? 'Live Connected' : 'Docker Disconnected'})
            </span>
          </div>
          <h1
            className={`font-display text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Broker Nodes
          </h1>
          <div className={`text-xs font-mono mt-0.5 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Active Cluster:{' '}
            <span className={`font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {cluster?.name || 'local'}
            </span>{' '}
            ({cluster?.version || '3.5-IV2'}) •{' '}
            <span className={isOnline ? 'text-emerald-500' : 'text-rose-500 font-semibold'}>
              {isOnline ? `Online (${cluster?.latency || '4ms'})` : 'Broker Offline / Docker Stopped'}
            </span>
          </div>
        </div>

        {onProbeCluster && (
          <button
            type="button"
            onClick={() => onProbeCluster(cluster)}
            disabled={isChecking}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              isDark
                ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs'
            }`}
          >
            <RefreshCw size={13} className={isChecking ? 'animate-spin text-amber-400' : ''} />
            <span>{isChecking ? 'Probing...' : 'Test Connection'}</span>
          </button>
        )}
      </div>

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-rose-500/30 bg-rose-950/20 text-rose-200'
              : 'border-rose-200 bg-rose-50/80 text-rose-900 shadow-xs'
          }`}
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
          <div className="text-xs">
            <span className="font-bold">Broker at {host}:{port} is unreachable.</span>
            <p className={`mt-0.5 ${isDark ? 'text-rose-300/80' : 'text-rose-700'}`}>
              Docker or your Kafka container is currently stopped. Kfkax is functioning in Standalone Simulation Mode. Run <code>docker-compose up</code> to restore live connection, then click <strong>"Test Connection"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Metrics overview cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Active Broker Nodes</span>
            <Server size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          </div>
          <div className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isOnline ? brokers.length : 0}
          </div>
          <div
            className={`text-[11px] mt-2 flex items-center gap-1.5 font-medium ${
              isOnline
                ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                : isDark ? 'text-rose-400' : 'text-rose-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {isOnline ? 'All broker nodes healthy & responsive' : 'Broker offline (Docker disconnected)'}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Cluster Controller</span>
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
          <div className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Node #1
          </div>
          <div className={`text-[11px] mt-2 font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            KRaft metadata quorum active
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
            isDark
              ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between text-xs mb-2 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            <span className="font-medium">Total Partitions Allocated</span>
            <HardDrive size={14} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
          </div>
          <div className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            16
          </div>
          <div className={`text-[11px] mt-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700 font-medium'}`}>
            100% in-sync replicas (ISR)
          </div>
        </div>
      </div>

      {/* Brokers Table */}
      <div
        className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors ${
          isDark
            ? 'border-white/[0.08] bg-[#0c0e18]/80 shadow-panel'
            : 'border-slate-200 bg-white shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[11px] font-medium ${
                isDark
                  ? 'border-white/[0.08] bg-white/[0.02] text-mist-400'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <tr>
                <th className="px-5 py-3.5">Node ID</th>
                <th className="px-5 py-3.5">Host & Port</th>
                <th className="px-5 py-3.5">Rack Zone</th>
                <th className="px-5 py-3.5">Controller Status</th>
                <th className="px-5 py-3.5">Partitions</th>
                <th className="px-5 py-3.5">Storage Footprint</th>
                <th className="px-5 py-3.5">Uptime</th>
                <th className="px-5 py-3.5 text-right">Health Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono text-xs ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {brokers.map((broker) => (
                <tr
                  key={broker.id}
                  className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}
                >
                  <td className={`px-5 py-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Node #{broker.id}
                  </td>
                  <td className={`px-5 py-4 font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                    {broker.host}:{broker.port}
                  </td>
                  <td className={`px-5 py-4 ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>
                    {broker.rack}
                  </td>
                  <td className="px-5 py-4">
                    {broker.isController ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] border font-sans font-medium ${
                          isDark
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        Active Controller
                      </span>
                    ) : (
                      <span className={`text-[10px] ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
                        Follower
                      </span>
                    )}
                  </td>
                  <td className={`px-5 py-4 font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {broker.partitionsCount}
                  </td>
                  <td className={`px-5 py-4 ${isDark ? 'text-mist-300' : 'text-slate-600'}`}>
                    {broker.diskUsage}
                  </td>
                  <td className={`px-5 py-4 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    {broker.uptime}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] border font-sans font-medium ${
                        isOnline
                          ? isDark
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDark
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {isOnline ? 'ONLINE' : 'OFFLINE (Docker Stopped)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
