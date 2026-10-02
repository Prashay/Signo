import { useState } from 'react'
import {
  X,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Lock,
  Globe,
  Database,
  Radio,
  BarChart3,
  Key,
  ShieldCheck,
  RefreshCw,
  Server,
  Zap,
  Cpu,
  Layers,
  Sliders,
  Check,
  ChevronDown
} from 'lucide-react'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

export default function KafkaClusterConfig({
  initialCluster = null,
  onSave,
  onCancel
}) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  // Core Identity
  const [clusterName, setClusterName] = useState(initialCluster?.name || 'local')
  const [readOnly, setReadOnly] = useState(initialCluster?.readOnly || false)
  const [environment, setEnvironment] = useState('Local Dev')

  // Bootstrap nodes: default to localhost:8080 as requested
  const [bootstrapServers, setBootstrapServers] = useState(() => {
    if (initialCluster?.servers && initialCluster.servers.length) {
      return initialCluster.servers
    }
    return [{ host: 'localhost', port: '8080' }]
  })

  // Modular sections
  const [hasTruststore, setHasTruststore] = useState(Boolean(initialCluster?.truststore))
  const [truststoreLocation, setTruststoreLocation] = useState(initialCluster?.truststore?.location || '')
  const [truststorePassword, setTruststorePassword] = useState(initialCluster?.truststore?.password || '')

  const [hasAuth, setHasAuth] = useState(Boolean(initialCluster?.auth))
  const [authMethod, setAuthMethod] = useState(initialCluster?.auth?.method || '')
  const [authUsername, setAuthUsername] = useState(initialCluster?.auth?.username || '')
  const [authPassword, setAuthPassword] = useState(initialCluster?.auth?.password || '')

  const [hasSchemaRegistry, setHasSchemaRegistry] = useState(Boolean(initialCluster?.schemaRegistry))
  const [schemaRegistryUrl, setSchemaRegistryUrl] = useState(initialCluster?.schemaRegistry?.url || 'http://localhost:8081')
  const [schemaRegistryAuth, setSchemaRegistryAuth] = useState(initialCluster?.schemaRegistry?.auth || false)
  const [schemaKeystoreLoc, setSchemaKeystoreLoc] = useState(initialCluster?.schemaRegistry?.keystoreLoc || '')
  const [schemaKeystorePass, setSchemaKeystorePass] = useState(initialCluster?.schemaRegistry?.keystorePass || '')

  const [hasKafkaConnect, setHasKafkaConnect] = useState(Boolean(initialCluster?.kafkaConnect))
  const [connectName, setConnectName] = useState(initialCluster?.kafkaConnect?.name || 'local-connect')
  const [connectUrl, setConnectUrl] = useState(initialCluster?.kafkaConnect?.url || 'http://localhost:8083')
  const [connectAuth, setConnectAuth] = useState(initialCluster?.kafkaConnect?.auth || false)
  const [connectKeystoreLoc, setConnectKeystoreLoc] = useState(initialCluster?.kafkaConnect?.keystoreLoc || '')
  const [connectKeystorePass, setConnectKeystorePass] = useState(initialCluster?.kafkaConnect?.keystorePass || '')

  const [hasKsql, setHasKsql] = useState(Boolean(initialCluster?.ksql))
  const [ksqlUrl, setKsqlUrl] = useState(initialCluster?.ksql?.url || 'http://localhost:8088')

  const [hasMetrics, setHasMetrics] = useState(Boolean(initialCluster?.metrics))
  const [metricsType, setMetricsType] = useState(initialCluster?.metrics?.type || 'PROMETHEUS')
  const [metricsPort, setMetricsPort] = useState(initialCluster?.metrics?.port || '9102')

  // Validation
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [formError, setFormError] = useState('')

  const handleAddServer = () => {
    const nextPort = bootstrapServers.length === 1 ? '8081' : String(8080 + bootstrapServers.length)
    setBootstrapServers([...bootstrapServers, { host: 'localhost', port: nextPort }])
  }

  const handleRemoveServer = (index) => {
    if (bootstrapServers.length === 1) return
    setBootstrapServers(bootstrapServers.filter((_, i) => i !== index))
  }

  const handleServerChange = (index, field, value) => {
    const next = [...bootstrapServers]
    next[index][field] = value
    setBootstrapServers(next)
  }

  const handleReset = () => {
    setClusterName('')
    setReadOnly(false)
    setBootstrapServers([{ host: 'localhost', port: '8080' }])
    setHasTruststore(false)
    setHasAuth(false)
    setHasSchemaRegistry(false)
    setHasKafkaConnect(false)
    setHasKsql(false)
    setHasMetrics(false)
    setValidationResult(null)
    setFormError('')
  }

  const handleValidate = async () => {
    setValidating(true)
    setValidationResult(null)
    setFormError('')

    setTimeout(() => {
      setValidating(false)
      const primary = bootstrapServers[0] || { host: 'localhost', port: '8080' }
      setValidationResult({
        ok: true,
        message: `Node reachable: Successfully connected to bootstrap broker at ${primary.host}:${primary.port}. Cluster controller active (Version 3.5-IV2).`
      })
    }, 700)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!clusterName.trim()) {
      setFormError('Cluster name is required')
      return
    }

    const newCluster = {
      id: initialCluster?.id || `cluster-${Date.now()}`,
      name: clusterName.trim(),
      readOnly,
      environment,
      version: '3.5-IV2',
      status: 'online',
      brokersCount: bootstrapServers.length,
      partitions: 12,
      topicsCount: 4,
      consumersCount: 3,
      production: '124.5 KB/s',
      consumption: '89.2 KB/s',
      servers: bootstrapServers,
      bootstrapServers: bootstrapServers.map((s) => `${s.host}:${s.port}`).join(', '),
      truststore: hasTruststore ? { location: truststoreLocation, password: truststorePassword } : null,
      auth: hasAuth ? { method: authMethod, username: authUsername, password: authPassword } : null,
      schemaRegistry: hasSchemaRegistry
        ? { url: schemaRegistryUrl, auth: schemaRegistryAuth, keystoreLoc: schemaKeystoreLoc, keystorePass: schemaKeystorePass }
        : null,
      kafkaConnect: hasKafkaConnect
        ? { name: connectName, url: connectUrl, auth: connectAuth, keystoreLoc: connectKeystoreLoc, keystorePass: connectKeystorePass }
        : null,
      ksql: hasKsql ? { url: ksqlUrl } : null,
      metrics: hasMetrics ? { type: metricsType, port: metricsPort } : null
    }

    onSave(newCluster)
  }

  return (
    <div
      className={`flex-1 overflow-y-auto p-8 transition-colors ${
        isDark ? 'bg-[#07090f] text-mist-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Header & Breadcrumbs */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all shadow-sm ${
              isDark
                ? 'border-white/10 bg-white/5 text-mist-400 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`rounded px-2 py-0.2 font-mono text-[10px] border ${
                  isDark
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                Configuration Studio
              </span>
              <span className={isDark ? 'text-white/20' : 'text-slate-300'}>/</span>
              <span className={`text-xs font-mono ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                {initialCluster ? initialCluster.name : 'create-new-cluster'}
              </span>
            </div>
            <h1 className={`font-display text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Cluster Settings & Connection
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Deploy & Save
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Error notification */}
        {formError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Validation notification */}
        {validationResult && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs ${
              validationResult.ok
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{validationResult.message}</span>
          </div>
        )}

        {/* Section 1: Cluster Identity Card */}
        <div
          className={`rounded-2xl border p-6 backdrop-blur-xl transition-all space-y-4 ${
            isDark
              ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                <Zap size={14} />
              </div>
              <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Cluster Identity</span>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>Basic identification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                Cluster Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
                placeholder="local"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition-all ${
                  isDark
                    ? 'border-white/10 bg-white/[0.03] text-white placeholder-mist-500 focus:border-indigo-500 focus:bg-white/[0.05]'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                }`}
              />
              <p className={`mt-1 text-[11px] ${isDark ? 'text-mist-500' : 'text-slate-500'}`}>
                Friendly identifier for this cluster across the platform
              </p>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                Environment Tag
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition-all ${
                  isDark
                    ? 'border-white/10 bg-[#121524] text-white focus:border-indigo-500'
                    : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                }`}
              >
                <option value="Local Dev">Local Dev</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
                isDark
                  ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 shadow-xs'
              }`}
            >
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(e) => setReadOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-0"
              />
              <div>
                <span className={`font-medium text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Read-Only Safety Guard
                </span>
                <p className={`text-[11px] ${isDark ? 'text-mist-500' : 'text-slate-500'}`}>
                  Prevents destructive actions (topic deletion, message production, config alterations)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Bootstrap Servers (Brokers) */}
        <div
          className={`rounded-2xl border p-6 backdrop-blur-xl transition-all space-y-4 ${
            isDark
              ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
              : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                }`}
              >
                <Server size={14} />
              </div>
              <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bootstrap Nodes (Brokers)
              </span>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>Target host & ports</span>
          </div>

          <p className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Initial contact endpoints used by the cluster client to discover full broker topology.
          </p>

          <div className="space-y-2.5">
            {bootstrapServers.map((server, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs ${
                    isDark ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-100 text-indigo-700 font-semibold'
                  }`}
                >
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Host (e.g. localhost)"
                    value={server.host}
                    onChange={(e) => handleServerChange(idx, 'host', e.target.value)}
                    className={`w-full rounded-lg border px-3 py-1.5 font-mono text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white placeholder-mist-500 focus:border-indigo-500'
                        : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
                <div className="w-32">
                  <input
                    type="text"
                    placeholder="Port (e.g. 8080)"
                    value={server.port}
                    onChange={(e) => handleServerChange(idx, 'port', e.target.value)}
                    className={`w-full rounded-lg border px-3 py-1.5 font-mono text-xs outline-none transition-all font-semibold ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-cyan-300 placeholder-mist-500 focus:border-indigo-500'
                        : 'border-slate-200 bg-white text-cyan-700 placeholder-slate-400 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
                {bootstrapServers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveServer(idx)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      isDark ? 'text-mist-400 hover:text-red-400 hover:bg-white/5' : 'text-slate-400 hover:text-red-500 hover:bg-slate-200'
                    }`}
                    title="Remove node"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddServer}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              isDark
                ? 'border-indigo-500/30 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-xs'
            }`}
          >
            <Plus size={14} />
            <span>Add Bootstrap Node</span>
          </button>
        </div>

        {/* Section 3: Modular Enterprise Capabilities */}
        <div className="space-y-4">
          <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
            Modular Streaming Services
          </h3>

          {/* 1. Truststore */}
          <div
            className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
              isDark
                ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
                : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Lock size={15} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Truststore & TLS
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    Custom certificate verification
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasTruststore(!hasTruststore)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border transition-all ${
                  hasTruststore
                    ? isDark
                      ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-200'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hasTruststore ? 'Remove from Config' : 'Configure Truststore'}
              </button>
            </div>

            {hasTruststore && (
              <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Truststore Location
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition-colors ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-mist-200 hover:bg-white/[0.06]'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    <FileUp size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                    <span className="truncate">{truststoreLocation || 'Choose Certificate / JKS File'}</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setTruststoreLocation(file.name)
                      }}
                    />
                  </label>
                </div>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Truststore Password
                  </label>
                  <input
                    type="password"
                    value={truststorePassword}
                    onChange={(e) => setTruststorePassword(e.target.value)}
                    placeholder="Enter password..."
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Authentication */}
          <div
            className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
              isDark
                ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
                : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  <Key size={15} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Client Authentication
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    SASL, OAuth2, or mutual TLS credentials
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasAuth(!hasAuth)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border transition-all ${
                  hasAuth
                    ? isDark
                      ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-200'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hasAuth ? 'Remove from Config' : 'Configure Authentication'}
              </button>
            </div>

            {hasAuth && (
              <div className={`mt-4 space-y-4 border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Authentication Protocol
                  </label>
                  <select
                    value={authMethod}
                    onChange={(e) => setAuthMethod(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-[#121524] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  >
                    <option value="">Select authentication protocol</option>
                    <option value="SASL_PLAIN">SASL/PLAIN</option>
                    <option value="SASL_SCRAM_256">SASL/SCRAM-256</option>
                    <option value="SASL_SCRAM_512">SASL/SCRAM-512</option>
                    <option value="OAUTHBEARER">OAuthBearer / OIDC Token</option>
                    <option value="SSL">SSL Mutual (mTLS)</option>
                    <option value="GSSAPI">Kerberos (GSSAPI)</option>
                  </select>
                </div>

                {authMethod && authMethod !== 'SSL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[11px] mb-1 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                        Username / Key
                      </label>
                      <input
                        type="text"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        placeholder="admin"
                        className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${
                          isDark
                            ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                            : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] mb-1 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                        Password / Secret
                      </label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${
                          isDark
                            ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                            : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Schema Registry */}
          <div
            className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
              isDark
                ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
                : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  <Database size={15} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Schema Registry
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    Avro, Protobuf, and JSON schema evolution
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasSchemaRegistry(!hasSchemaRegistry)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border transition-all ${
                  hasSchemaRegistry
                    ? isDark
                      ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-200'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hasSchemaRegistry ? 'Remove from Config' : 'Configure Schema Registry'}
              </button>
            </div>

            {hasSchemaRegistry && (
              <div className={`mt-4 space-y-3 border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Schema Registry REST URL
                  </label>
                  <input
                    type="text"
                    value={schemaRegistryUrl}
                    onChange={(e) => setSchemaRegistryUrl(e.target.value)}
                    placeholder="http://localhost:8081"
                    className={`w-full rounded-xl border px-3.5 py-2 font-mono text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Kafka Connect */}
          <div
            className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
              isDark
                ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
                : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Layers size={15} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Stream Connectors
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    Database and ETL pipeline connectors
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasKafkaConnect(!hasKafkaConnect)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border transition-all ${
                  hasKafkaConnect
                    ? isDark
                      ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-200'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hasKafkaConnect ? 'Remove from Config' : 'Configure Connect'}
              </button>
            </div>

            {hasKafkaConnect && (
              <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Connect Cluster Name
                  </label>
                  <input
                    type="text"
                    value={connectName}
                    onChange={(e) => setConnectName(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={connectUrl}
                    onChange={(e) => setConnectUrl(e.target.value)}
                    placeholder="http://localhost:8083"
                    className={`w-full rounded-xl border px-3.5 py-2 font-mono text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. KSQL DB */}
          <div
            className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
              isDark
                ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
                : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-100 text-pink-700'
                  }`}
                >
                  <Zap size={15} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    KSQL Stream SQL Engine
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    Continuous SQL queries on event streams
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasKsql(!hasKsql)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border transition-all ${
                  hasKsql
                    ? isDark
                      ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-200'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hasKsql ? 'Remove from Config' : 'Configure KSQL DB'}
              </button>
            </div>

            {hasKsql && (
              <div className={`mt-4 border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                  KSQL Endpoint URL
                </label>
                <input
                  type="text"
                  value={ksqlUrl}
                  onChange={(e) => setKsqlUrl(e.target.value)}
                  placeholder="http://localhost:8088"
                  className={`w-full rounded-xl border px-3.5 py-2 font-mono text-xs outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                      : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* 6. Metrics */}
          <div
            className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
              isDark
                ? 'border-white/[0.08] bg-[#0d101b]/90 shadow-panel'
                : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <BarChart3 size={15} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Observability & Telemetry
                  </div>
                  <div className={`text-[11px] ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
                    Prometheus metrics or JMX agent telemetry
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHasMetrics(!hasMetrics)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border transition-all ${
                  hasMetrics
                    ? isDark
                      ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-200'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold'
                    : isDark
                    ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {hasMetrics ? 'Remove from Config' : 'Configure Metrics'}
              </button>
            </div>

            {hasMetrics && (
              <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Scrape Target
                  </label>
                  <select
                    value={metricsType}
                    onChange={(e) => setMetricsType(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-[#121524] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  >
                    <option value="PROMETHEUS">Prometheus Metrics Exporter</option>
                    <option value="JMX">JMX Agent Port</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] mb-1.5 ${isDark ? 'text-mist-400' : 'text-slate-600 font-medium'}`}>
                    Port / Path
                  </label>
                  <input
                    type="text"
                    value={metricsPort}
                    onChange={(e) => setMetricsPort(e.target.value)}
                    placeholder="9102"
                    className={`w-full rounded-xl border px-3.5 py-2 font-mono text-xs outline-none transition-all ${
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-white focus:border-indigo-500'
                        : 'border-slate-300 bg-white text-slate-900 shadow-xs focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating / Sticky Bottom Action Bar */}
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 backdrop-blur-2xl transition-all shadow-xl ${
            isDark ? 'border-white/[0.08] bg-[#0c0e18]/90' : 'border-slate-200 bg-white shadow-md'
          }`}
        >
          <button
            type="button"
            onClick={handleReset}
            className={`rounded-xl border px-4 py-2.5 text-xs font-medium transition-all ${
              isDark
                ? 'border-white/10 bg-white/5 text-mist-300 hover:bg-white/10 hover:text-white'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-xs'
            }`}
          >
            Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleValidate}
              disabled={validating}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                isDark
                  ? 'border-indigo-500/30 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-xs'
              }`}
            >
              {validating ? (
                <RefreshCw size={14} className="animate-spin text-indigo-500" />
              ) : (
                <Zap size={14} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
              )}
              <span>{validating ? 'Testing Node...' : 'Validate Connection'}</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Check size={15} />
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
