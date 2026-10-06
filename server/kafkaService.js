import { Kafka, logLevel } from 'kafkajs'

export function buildKafkaClient(clusterConfig = {}) {
  let brokers = []
  if (Array.isArray(clusterConfig.servers) && clusterConfig.servers.length > 0) {
    brokers = clusterConfig.servers
      .map((s) => `${s.host || 'localhost'}:${s.port || 9092}`)
      .filter((s) => s && !s.startsWith(':'))
  } else if (typeof clusterConfig.bootstrapServers === 'string' && clusterConfig.bootstrapServers.trim()) {
    brokers = clusterConfig.bootstrapServers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  if (brokers.length === 0) {
    brokers = ['localhost:9092']
  }

  const securityProtocol = (
    clusterConfig.securityProtocol ||
    clusterConfig.auth?.securityProtocol ||
    'PLAINTEXT'
  ).toUpperCase()

  const isSsl = securityProtocol.includes('SSL')

  let sasl = undefined
  if (securityProtocol.startsWith('SASL') && clusterConfig.auth) {
    const rawMech = String(clusterConfig.auth.saslMechanism || 'PLAIN').toUpperCase()
    let mechanism = 'plain'
    if (rawMech.includes('512')) mechanism = 'scram-sha-512'
    else if (rawMech.includes('256')) mechanism = 'scram-sha-256'
    else if (rawMech.includes('PLAIN')) mechanism = 'plain'
    else if (rawMech.includes('OAUTH')) mechanism = 'oauthbearer'

    let username = clusterConfig.auth.username || ''
    let password = clusterConfig.auth.password || ''

    if ((!username || !password) && clusterConfig.auth.saslJaasConfig) {
      const uMatch = clusterConfig.auth.saslJaasConfig.match(/username=["']([^"']+)["']/)
      const pMatch = clusterConfig.auth.saslJaasConfig.match(/password=["']([^"']+)["']/)
      if (uMatch) username = uMatch[1]
      if (pMatch) password = pMatch[1]
    }

    if (username || password) {
      sasl = {
        mechanism,
        username,
        password
      }
    }
  }

  return new Kafka({
    clientId: `signo-client-${Math.random().toString(16).slice(2, 8)}`,
    brokers,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    sasl,
    connectionTimeout: 8000,
    requestTimeout: 12000,
    retry: { retries: 2, initialRetryTime: 300 },
    logLevel: logLevel.NOTHING
  })
}

export async function fetchKafkaTopics(clusterConfig) {
  const kafka = buildKafkaClient(clusterConfig)
  const admin = kafka.admin()
  try {
    await admin.connect()
    const topicNames = await admin.listTopics()
    if (!topicNames || topicNames.length === 0) {
      return { ok: true, topics: [] }
    }

    const metadata = await admin.fetchTopicMetadata({ topics: topicNames })
    
    // Fetch real topic configuration in one admin call. Do not invent size or cleanup values.
    let configByTopic = new Map()
    try {
      const described = await admin.describeConfigs({
        resources: metadata.topics.map((t) => ({ type: 2, name: t.name })),
        includeSynonyms: true
      })
      for (const resource of described.resources || []) {
        const entries = resource.configEntries || []
        configByTopic.set(resource.resourceName, new Map(entries.map((e) => [e.configName, e.configValue])))
      }
    } catch {}

    const topicsWithDetails = await Promise.all(
      metadata.topics.map(async (t) => {
        let messagesCount = 0
        try {
          const offsets = await admin.fetchTopicOffsets(t.name)
          if (Array.isArray(offsets)) {
            messagesCount = offsets.reduce((acc, p) => {
              try {
                const high = BigInt(p.high || '0')
                const low = BigInt(p.low || '0')
                const count = high >= low ? high - low : 0n
                return acc + safeNumber(count)
              } catch {
                return acc
              }
            }, 0)
          }
        } catch {}

        const partitions = t.partitions ? t.partitions.length : 1
        const replicationFactor = t.partitions?.[0]?.replicas?.length || 1
        const isInternal = Boolean(t.name.startsWith('_') || t.name.startsWith('__'))
        const config = configByTopic.get(t.name) || new Map()
        const cleanup = config.get('cleanup.policy') || 'N/A'

        return {
          name: t.name,
          partitions,
          replicationFactor,
          messagesCount,
          size: 'N/A',
          cleanUp: cleanup,
          internal: isInternal
        }
      })
    )

    // Sort: non-internal first alphabetically, then internal
    topicsWithDetails.sort((a, b) => {
      if (a.internal !== b.internal) return a.internal ? 1 : -1
      return a.name.localeCompare(b.name)
    })

    return { ok: true, topics: topicsWithDetails }
  } catch (err) {
    return { ok: false, error: err.message, topics: [] }
  } finally {
    try {
      await admin.disconnect()
    } catch {}
  }
}

export async function fetchKafkaClusterDetails(clusterConfig) {
  const kafka = buildKafkaClient(clusterConfig)
  const admin = kafka.admin()
  try {
    await admin.connect()
    const [clusterInfo, topicNames, groups] = await Promise.all([
      admin.describeCluster().catch(() => null),
      admin.listTopics().catch(() => []),
      admin.listGroups().catch(() => ({ groups: [] }))
    ])

    return {
      ok: true,
      clusterId: clusterInfo?.clusterId || null,
      controller: clusterInfo?.controller ?? null,
      brokers: clusterInfo?.brokers?.map((b) => ({
        id: b.nodeId,
        host: b.host,
        port: b.port,
        rack: b.rack || 'default',
        isController: b.nodeId === clusterInfo?.controller,
        partitionsCount: 0,
        diskUsage: 'Active',
        uptime: 'Live',
        status: 'UP'
      })) || [],
      topicsCount: Array.isArray(topicNames) ? topicNames.length : 0,
      consumersCount: Array.isArray(groups?.groups) ? groups.groups.length : 0
    }
  } catch (err) {
    return { ok: false, error: err.message }
  } finally {
    try {
      await admin.disconnect()
    } catch {}
  }
}

export async function createKafkaTopic(clusterConfig, { name, partitions = 1, replicationFactor = 1 }) {
  const kafka = buildKafkaClient(clusterConfig)
  const admin = kafka.admin()
  try {
    await admin.connect()
    await admin.createTopics({
      topics: [
        {
          topic: name,
          numPartitions: Number(partitions) || 1,
          replicationFactor: Number(replicationFactor) || 1
        }
      ]
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  } finally {
    try {
      await admin.disconnect()
    } catch {}
  }
}

export async function produceKafkaMessage(clusterConfig, { topic, key, value }) {
  const kafka = buildKafkaClient(clusterConfig)
  const producer = kafka.producer()
  try {
    await producer.connect()
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
    const result = await producer.send({
      topic,
      messages: [
        {
          key: key ? String(key) : undefined,
          value: valStr
        }
      ]
    })
    return { ok: true, result }
  } catch (err) {
    return { ok: false, error: err.message }
  } finally {
    try {
      await producer.disconnect()
    } catch {}
  }
}

export async function fetchKafkaConsumerGroups(clusterConfig) {
  const kafka = buildKafkaClient(clusterConfig)
  const admin = kafka.admin()
  try {
    await admin.connect()
    const { groups } = await admin.listGroups()
    if (!groups || groups.length === 0) {
      return { ok: true, groups: [] }
    }
    const groupIds = groups.map((g) => g.groupId)
    const descriptions = await admin.describeGroups(groupIds).catch(() => ({ groups: [] }))
    const formatted = descriptions.groups.map((g) => ({
      groupId: g.groupId,
      status: g.state || 'STABLE',
      protocol: g.protocolType,
      membersCount: g.members?.length || 0,
      partitionsCovered: 0,
      totalLag: 0,
      topics: [],
      topicsCount: 0,
      coordinator: g.coordinator ?? null
    }))
    return { ok: true, groups: formatted }
  } catch (err) {
    return { ok: false, error: err.message, groups: [] }
  } finally {
    try {
      await admin.disconnect()
    } catch {}
  }
}

function normalizeConfigSource(source) {
  const map = {
    0: 'UNKNOWN',
    1: 'DEFAULT_CONFIG',
    2: 'DYNAMIC_BROKER_CONFIG',
    3: 'DYNAMIC_TOPIC_CONFIG',
    4: 'DYNAMIC_DEFAULT_BROKER_CONFIG'
  }
  return map[source] || String(source || 'broker')
}

function parseOffset(value) {
  try {
    return BigInt(String(value ?? '0'))
  } catch {
    return 0n
  }
}

function safeNumber(bigintValue) {
  const max = BigInt(Number.MAX_SAFE_INTEGER)
  if (bigintValue > max) return Number.MAX_SAFE_INTEGER
  if (bigintValue < -max) return Number.MIN_SAFE_INTEGER
  return Number(bigintValue)
}

export async function fetchKafkaTopicDetails(clusterConfig, topicName) {
  const kafka = buildKafkaClient(clusterConfig)
  const admin = kafka.admin()
  try {
    await admin.connect()
    const metadata = await admin.fetchTopicMetadata({ topics: [topicName] })
    const topicMeta = metadata.topics?.find((t) => t.name === topicName)
    if (!topicMeta) return { ok: false, error: `Topic not found: ${topicName}` }

    let offsets = []
    try {
      offsets = await admin.fetchTopicOffsets(topicName)
    } catch {}

    const offsetByPartition = new Map((offsets || []).map((o) => [Number(o.partition), o]))
    const partitionDetails = (topicMeta.partitions || []).map((p) => {
      const o = offsetByPartition.get(Number(p.partitionId)) || {}
      const low = parseOffset(o.low)
      const high = parseOffset(o.high)
      return {
        partitionId: Number(p.partitionId),
        leader: p.leader,
        replicas: p.replicas || [],
        isr: p.isr || [],
        firstOffset: safeNumber(low),
        nextOffset: safeNumber(high),
        messageCount: safeNumber(high >= low ? high - low : 0n)
      }
    })

    const totalReplicas = partitionDetails.reduce((sum, p) => sum + p.replicas.length, 0)
    const inSyncReplicas = partitionDetails.reduce((sum, p) => sum + p.isr.length, 0)
    const underReplicatedPartitions = partitionDetails.filter(
      (p) => p.isr.length < p.replicas.length || p.leader === -1
    ).length
    const messageCount = partitionDetails.reduce((sum, p) => sum + p.messageCount, 0)

    let configs = []
    try {
      const described = await admin.describeConfigs({
        resources: [{ type: 2, name: topicName }],
        includeSynonyms: true
      })
      const entries = described.resources?.[0]?.configEntries || []
      configs = entries.map((entry) => ({
        name: entry.configName,
        value: entry.configValue,
        source: normalizeConfigSource(entry.configSource),
        sensitive: Boolean(entry.isSensitive),
        readOnly: Boolean(entry.isReadOnly)
      }))
    } catch {}

    const cleanupPolicy = configs.find((c) => c.name === 'cleanup.policy')?.value || 'N/A'
    const retentionMs = configs.find((c) => c.name === 'retention.ms')?.value || 'N/A'

    return {
      ok: true,
      details: {
        name: topicName,
        partitionsCount: partitionDetails.length,
        replicationFactor: partitionDetails[0]?.replicas?.length || 0,
        underReplicatedPartitions,
        inSyncReplicas,
        totalReplicas,
        messageCount,
        cleanupPolicy,
        retentionMs,
        partitions: partitionDetails
      },
      configs,
      statistics: {
        messageCount,
        estimatedBytes: null,
        partitions: partitionDetails.map((p) => ({
          partition: p.partitionId,
          low: p.firstOffset,
          high: p.nextOffset,
          count: p.messageCount
        }))
      }
    }
  } catch (err) {
    return { ok: false, error: err.message }
  } finally {
    try { await admin.disconnect() } catch {}
  }
}

function stringifyMessageValue(value) {
  if (value == null) return null
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value).toString('utf8')
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  if (Array.isArray(value)) return value.map(stringifyMessageValue)
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  return String(value)
}

export async function fetchKafkaTopicMessages(clusterConfig, options = {}) {
  const topicName = String(options.topic || '')
  if (!topicName) return { ok: false, error: 'Topic name is required', messages: [] }

  const kafka = buildKafkaClient(clusterConfig)
  const admin = kafka.admin()
  const groupId = `signo-topic-inspector-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const consumer = kafka.consumer({ groupId, allowAutoTopicCreation: false })
  const limit = Math.max(1, Math.min(1000, Number(options.limit || 500)))

  try {
    await admin.connect()
    const metadata = await admin.fetchTopicMetadata({ topics: [topicName] })
    const topicMeta = metadata.topics?.find((t) => t.name === topicName)
    if (!topicMeta) return { ok: false, error: `Topic not found: ${topicName}`, messages: [] }

    const allPartitions = (topicMeta.partitions || []).map((p) => Number(p.partitionId))
    const requested = Array.isArray(options.partitions) && options.partitions.length
      ? options.partitions.map(Number).filter((p) => allPartitions.includes(p))
      : allPartitions
    const targetPartitions = requested.length ? requested : allPartitions

    const currentOffsets = await admin.fetchTopicOffsets(topicName)
    const offsetsByPartition = new Map((currentOffsets || []).map((p) => [
      Number(p.partition),
      { low: parseOffset(p.low), high: parseOffset(p.high) }
    ]))

    const seekType = String(options.seekType || 'latest').toLowerCase()
    let starts = []

    if (seekType === 'latest') {
      // Initial topic-open load: read the most recent window without replaying the topic.
      const latestWindow = Math.min(100, Math.max(25, Math.floor(limit / Math.max(1, targetPartitions.length))))
      starts = targetPartitions.map((partition) => {
        const bounds = offsetsByPartition.get(partition) || { low: 0n, high: 0n }
        const start = bounds.high > BigInt(latestWindow) ? bounds.high - BigInt(latestWindow) : bounds.low
        return { partition, offset: start < 0n ? '0' : start.toString() }
      })
    } else if (seekType === 'timestamp') {
      const timestamp = Number(options.seekValue)
      if (!Number.isFinite(timestamp)) return { ok: false, error: 'Valid date/time is required', messages: [] }
      const byTimestamp = await admin.fetchTopicOffsetsByTimestamp(topicName, timestamp)
      starts = targetPartitions.map((partition) => {
        const resolved = byTimestamp.find((o) => Number(o.partition) === partition)
        const bounds = offsetsByPartition.get(partition) || { low: 0n, high: 0n }
        let offset = resolved ? parseOffset(resolved.offset) : bounds.high

        // Kafka returns -1 when no record exists at/after the timestamp. For a
        // live topic, use the latest offset rather than passing -1 to seek.
        if (offset < 0n) offset = bounds.high
        if (offset < bounds.low) offset = bounds.low
        if (offset > bounds.high) offset = bounds.high
        return { partition, offset: offset.toString() }
      })
    } else {
      const rawOffset = Number(options.seekValue)
      if (!Number.isFinite(rawOffset) || rawOffset < 0) return { ok: false, error: 'Valid offset is required', messages: [] }
      const requestedOffset = BigInt(Math.floor(rawOffset))
      starts = targetPartitions.map((partition) => {
        const bounds = offsetsByPartition.get(partition) || { low: 0n, high: 0n }
        let offset = requestedOffset
        if (offset < bounds.low) offset = bounds.low
        if (offset > bounds.high) offset = bounds.high
        return { partition, offset: offset.toString() }
      })
    }

    if (!starts.length) return { ok: true, messages: [], seekType, seekOffsets: [] }

    await consumer.connect()
    await consumer.subscribe({ topic: topicName, fromBeginning: true })

    // KafkaJS requires seek to be called after consumer.run(). Wait for the
    // group assignment, then seek each requested partition. This is the key
    // difference from the previous implementation where seek happened before
    // the consumer was actually running/assigned.
    let assignmentReadyResolve
    let assignmentReadyReject
    let assignmentTimer
    const assignmentReady = new Promise((resolve, reject) => {
      assignmentReadyResolve = resolve
      assignmentReadyReject = reject
      assignmentTimer = setTimeout(() => reject(new Error('Timed out waiting for Kafka partition assignment')), 10000)
    })

    const onGroupJoin = () => {
      clearTimeout(assignmentTimer)
      assignmentReadyResolve()
    }
    consumer.on(consumer.events.GROUP_JOIN, onGroupJoin)

    const messages = []
    const search = String(options.search || '').trim().toLowerCase()
    const keyFilter = String(options.keyFilter || '').trim().toLowerCase()
    const valueFilter = String(options.valueFilter || '').trim().toLowerCase()
    const matches = (key, value) => {
      const keyText = key == null ? '' : String(key)
      const valueText = value == null ? '' : String(value)
      if (search && !`${keyText}\n${valueText}`.toLowerCase().includes(search)) return false
      if (keyFilter && !keyText.toLowerCase().includes(keyFilter)) return false
      if (valueFilter && !valueText.toLowerCase().includes(valueFilter)) return false
      return true
    }

    let acceptingMessages = false
    let resolveCollection
    let collectionFinished = false
    const collectionDone = new Promise((resolve) => { resolveCollection = resolve })
    const finish = () => {
      if (collectionFinished) return
      collectionFinished = true
      resolveCollection()
    }

    const timeout = setTimeout(finish, 30000)

    consumer.run({
      autoCommit: false,
      partitionsConsumedConcurrently: Math.max(1, Math.min(10, targetPartitions.length)),
      eachMessage: async ({ partition, message }) => {
        // Records fetched before seek are intentionally ignored. KafkaJS marks
        // in-flight records stale when seek is called, and the accepting flag
        // also protects us from the initial batch race.
        if (!acceptingMessages || !targetPartitions.includes(Number(partition))) return
        const key = stringifyMessageValue(message.key)
        const value = stringifyMessageValue(message.value)
        if (!matches(key, value)) return

        messages.push({
          partition: Number(partition),
          offset: String(message.offset),
          timestamp: message.timestamp ? Number(message.timestamp) : null,
          key,
          value,
          headers: Object.fromEntries(
            Object.entries(message.headers || {}).map(([name, val]) => [name, stringifyMessageValue(val)])
          )
        })
        if (messages.length >= limit) finish()
      }
    }).catch(() => finish())

    await assignmentReady
    for (const start of starts) {
      consumer.seek({ topic: topicName, partition: Number(start.partition), offset: String(start.offset) })
    }
    acceptingMessages = true

    await collectionDone
    clearTimeout(timeout)

    try { await consumer.stop() } catch {}
    try { consumer.off(consumer.events.GROUP_JOIN, onGroupJoin) } catch {}

    const newestFirst = options.sortOrder === 'newest'
    messages.sort((a, b) => {
      const at = a.timestamp ?? 0
      const bt = b.timestamp ?? 0
      if (at !== bt) return newestFirst ? bt - at : at - bt
      const ap = Number(a.partition || 0)
      const bp = Number(b.partition || 0)
      if (ap !== bp) return newestFirst ? bp - ap : ap - bp
      const ao = parseOffset(a.offset)
      const bo = parseOffset(b.offset)
      return newestFirst ? safeNumber(bo - ao) : safeNumber(ao - bo)
    })

    return {
      ok: true,
      messages: messages.slice(0, limit),
      seekType,
      seekOffsets: starts,
      consumed: messages.length
    }
  } catch (err) {
    return { ok: false, error: err.message, messages: [] }
  } finally {
    try { await consumer.stop() } catch {}
    try { await consumer.disconnect() } catch {}
    try { await admin.disconnect() } catch {}
  }
}

export async function fetchKafkaTopicConsumers(clusterConfig, topicName) {
  const kafka = buildKafkaClient(clusterConfig)
  const admin = kafka.admin()
  try {
    await admin.connect()
    const { groups = [] } = await admin.listGroups()
    if (!groups.length) return { ok: true, consumers: [] }

    const topicOffsets = await admin.fetchTopicOffsets(topicName)
    const latestByPartition = new Map((topicOffsets || []).map((p) => [Number(p.partition), parseOffset(p.high)]))
    const groupIds = groups.map((g) => g.groupId)
    const descriptions = await admin.describeGroups(groupIds).catch(() => ({ groups: [] }))
    const descriptionById = new Map((descriptions.groups || []).map((g) => [g.groupId, g]))

    const results = []
    const concurrency = 20
    for (let i = 0; i < groupIds.length; i += concurrency) {
      const chunk = groupIds.slice(i, i + concurrency)
      const rows = await Promise.all(chunk.map(async (groupId) => {
        try {
          const offsets = await admin.fetchOffsets({ groupId, topics: [topicName] })
          const partitions = offsets?.[0]?.partitions || []
          if (!partitions.length) return null
          let lag = 0n
          let hasCommittedOffset = false
          for (const p of partitions) {
            const committed = parseOffset(p.offset)
            if (committed < 0n) continue
            hasCommittedOffset = true
            const latest = latestByPartition.get(Number(p.partition)) ?? committed
            if (latest > committed) lag += latest - committed
          }
          const desc = descriptionById.get(groupId)
          if (!hasCommittedOffset && !desc?.members?.length) return null
          return {
            groupId,
            activeConsumers: desc?.members?.length || 0,
            lag: safeNumber(lag),
            coordinator: desc?.coordinator ?? null,
            state: desc?.state || 'EMPTY'
          }
        } catch {
          return null
        }
      }))
      results.push(...rows.filter(Boolean))
    }

    return { ok: true, consumers: results.sort((a, b) => a.groupId.localeCompare(b.groupId)) }
  } catch (err) {
    return { ok: false, error: err.message, consumers: [] }
  } finally {
    try { await admin.disconnect() } catch {}
  }
}
