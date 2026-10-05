import { useState, useEffect, useCallback } from 'react'
import KafkaHeader from './KafkaHeader.jsx'
import KafkaSidebar from './KafkaSidebar.jsx'
import KafkaDashboard from './KafkaDashboard.jsx'
import KafkaClusterConfig from './KafkaClusterConfig.jsx'
import KafkaBrokersView from './KafkaBrokersView.jsx'
import KafkaTopicsView from './KafkaTopicsView.jsx'
import KafkaConsumersView from './KafkaConsumersView.jsx'
import { useThemeSettings } from '../../context/ThemeSettingsContext.jsx'

const INITIAL_CLUSTERS = [
  {
    id: 'cluster-local',
    name: 'local',
    environment: 'local',
    securityProtocol: 'PLAINTEXT',
    version: '3.5-IV2',
    status: 'checking',
    readOnly: false,
    brokersCount: 1,
    partitions: 12,
    topicsCount: 4,
    consumersCount: 3,
    production: '0 Bytes',
    consumption: '0 Bytes',
    servers: [{ host: 'localhost', port: '8080' }],
    bootstrapServers: 'localhost:8080',
    truststore: null,
    auth: null,
    schemaRegistry: { url: 'http://localhost:8081', auth: false },
    kafkaConnect: null,
    ksql: null,
    metrics: null,
    latency: null,
    probeError: null
  }
]

export default function KfkaxApp() {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const [clusters, setClusters] = useState(INITIAL_CLUSTERS)
  const [activeClusterId, setActiveClusterId] = useState('cluster-local')
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' | 'config' | 'brokers' | 'topics' | 'consumers'
  const [editingCluster, setEditingCluster] = useState(null)
  const [successNotice, setSuccessNotice] = useState('')
  const [isProbing, setIsProbing] = useState(false)

  const activeCluster = clusters.find((c) => c.id === activeClusterId) || clusters[0] || null

  const probeSingleCluster = useCallback(async (cluster) => {
    if (!cluster) return null
    const host = cluster.servers?.[0]?.host || 'localhost'
    const port = cluster.servers?.[0]?.port || 8080
    try {
      const res = await fetch(`/api/kafka/probe?host=${encodeURIComponent(host)}&port=${encodeURIComponent(port)}`)
      const data = await res.json()
      return {
        ...cluster,
        status: data.online ? 'online' : 'offline',
        latency: data.online ? `${data.latency}ms` : null,
        probeError: data.online
          ? null
          : (data.error || `Connection refused on ${host}:${port} (Docker container not running)`)
      }
    } catch {
      return {
        ...cluster,
        status: 'offline',
        latency: null,
        probeError: `Unable to probe ${host}:${port}`
      }
    }
  }, [])

  const probeAllClusters = useCallback(async (clusterList) => {
    const list = clusterList || clusters
    setIsProbing(true)
    try {
      const updated = await Promise.all(list.map((c) => probeSingleCluster(c)))
      setClusters(updated)
    } finally {
      setIsProbing(false)
    }
  }, [clusters, probeSingleCluster])

  // Probe on initial mount
  useEffect(() => {
    probeAllClusters(INITIAL_CLUSTERS)
  }, [])

  const handleProbeCluster = async (targetCluster) => {
    const c = targetCluster || activeCluster
    if (!c) return
    setIsProbing(true)
    try {
      const updated = await probeSingleCluster(c)
      if (updated) {
        setClusters((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      }
    } finally {
      setIsProbing(false)
    }
  }

  const handleOpenNewConfig = () => {
    setEditingCluster(null)
    setCurrentView('config')
  }

  const handleConfigureCluster = (cluster) => {
    setEditingCluster(cluster)
    setCurrentView('config')
  }

  const handleSaveCluster = async (savedCluster) => {
    // Immediately probe the newly configured cluster
    const probedCluster = await probeSingleCluster(savedCluster)
    const toSave = probedCluster || savedCluster

    const exists = clusters.some((c) => c.id === toSave.id)
    if (exists) {
      setClusters((prev) => prev.map((c) => (c.id === toSave.id ? toSave : c)))
      setSuccessNotice(`Cluster "${toSave.name}" updated successfully.`)
    } else {
      setClusters((prev) => [...prev, toSave])
      setSuccessNotice(
        `Cluster "${toSave.name}" added (${toSave.status === 'online' ? 'Connected' : 'Offline / Standalone'}).`
      )
    }
    setActiveClusterId(toSave.id)
    setCurrentView('dashboard')

    setTimeout(() => {
      setSuccessNotice('')
    }, 4000)
  }

  return (
    <div
      className={`flex h-full flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#0d0f16] text-mist-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Kafka Top bar */}
      <KafkaHeader
        activeCluster={activeCluster}
        isProbing={isProbing}
        onProbeCluster={handleProbeCluster}
        onGoDashboard={() => setCurrentView('dashboard')}
        onOpenConfig={handleOpenNewConfig}
      />

      {/* Success banner if cluster was created or updated */}
      {successNotice && (
        <div
          className={`flex items-center justify-between border-b px-4 py-2 text-xs transition-colors ${
            isDark
              ? 'border-indigo-500/30 bg-indigo-950/60 text-indigo-200'
              : 'border-indigo-200 bg-indigo-50 text-indigo-800'
          }`}
        >
          <span>{successNotice}</span>
          <button
            onClick={() => setSuccessNotice('')}
            className={isDark ? 'text-mist-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace: Sidebar + View Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <KafkaSidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          clusters={clusters}
          activeCluster={activeCluster}
          onSelectCluster={(c) => {
            setActiveClusterId(c.id)
            setCurrentView('brokers')
          }}
          onNewCluster={handleOpenNewConfig}
        />

        {/* View switching */}
        {currentView === 'dashboard' && (
          <KafkaDashboard
            clusters={clusters}
            isProbing={isProbing}
            onProbeCluster={handleProbeCluster}
            onProbeAllClusters={() => probeAllClusters()}
            onOpenConfig={handleOpenNewConfig}
            onConfigureCluster={handleConfigureCluster}
            onSelectCluster={(c) => {
              setActiveClusterId(c.id)
              setCurrentView('brokers')
            }}
          />
        )}

        {currentView === 'config' && (
          <KafkaClusterConfig
            initialCluster={editingCluster}
            onSave={handleSaveCluster}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'brokers' && (
          <KafkaBrokersView
            cluster={activeCluster}
            isProbing={isProbing}
            onProbeCluster={handleProbeCluster}
          />
        )}

        {currentView === 'topics' && <KafkaTopicsView cluster={activeCluster} />}

        {currentView === 'consumers' && <KafkaConsumersView cluster={activeCluster} />}
      </div>
    </div>
  )
}
