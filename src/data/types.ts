export type ManifestDataset = {
  id: string
  label: string
  format: string
  scope: string
  notes?: string
}

export type ManifestSnapshot = {
  id: string
  label: string
  date: string
  format: string
  path: string
  scope: string
  datasetId: string
  notes?: string
}

export type Manifest = {
  datasets: ManifestDataset[]
  snapshots: ManifestSnapshot[]
}

export type NormalizedMember = {
  playerKey: string
  name: string
  server: string
  playerId?: string
  baseStats: number
  level: number
  mine: number
  treasury: number
}

export type NormalizedGuild = {
  guildKey: string
  guildName: string
  members: NormalizedMember[]
}

export type NormalizedSnapshot = {
  scannedAt: string
  guilds: NormalizedGuild[]
}

export type RawToNormalizedAdapter = {
  id: string
  label: string
  supportsFormat: (format: string) => boolean
  normalize: (raw: unknown, meta: ManifestSnapshot) => NormalizedSnapshot
}

export type PlayerSeriesPoint = {
  date: string
  baseStats: number
  level: number
  mine: number
  treasury: number
  guildKey: string
}

export type PlayerSeries = {
  playerKey: string
  name: string
  server: string
  playerId?: string
  points: PlayerSeriesPoint[]
}

export type GuildSeriesPoint = {
  date: string
  memberCount: number
  baseStatsMedian: number
  baseStatsAvg: number
  levelMedian: number
  levelAvg: number
  mineMedian: number
  mineAvg: number
  treasuryMedian: number
  treasuryAvg: number
}

export type GuildSeries = {
  guildKey: string
  guildName: string
  points: GuildSeriesPoint[]
}

export type IntervalMetric = {
  startDate: string
  endDate: string
  days: number
  delta: number
  perDay: number
}

export type WindowMetric = {
  startDate: string
  endDate: string
  days: number
  delta: number
  perDay: number
}

export type WindowKey = '1' | '3' | '6' | '12'

export type PlayerWindowMetrics = {
  baseStats: Record<WindowKey, WindowMetric | null>
  level: Record<WindowKey, WindowMetric | null>
  mine: Record<WindowKey, WindowMetric | null>
  treasury: Record<WindowKey, WindowMetric | null>
}

export type SnapshotSummary = {
  id: string
  label: string
  date: string
  guildCount: number
  memberCount: number
}

export type PlayerComputed = {
  playerKey: string
  name: string
  server: string
  playerId?: string
  latestGuildKey?: string
  latestGuildName?: string
  points: PlayerSeriesPoint[]
  intervals: {
    baseStats: IntervalMetric[]
    level: IntervalMetric[]
    mine: IntervalMetric[]
    treasury: IntervalMetric[]
  }
  lastIntervals: {
    baseStats?: IntervalMetric
    level?: IntervalMetric
    mine?: IntervalMetric
    treasury?: IntervalMetric
  }
  baseStatsPerDayYear: number
  levelPerDayYear: number
  minePerDayYear: number
  treasuryPerDayYear: number
  coverage: {
    points: number
    days: number
  }
  windowMetrics: PlayerWindowMetrics
  bestInterval?: IntervalMetric
  worstInterval?: IntervalMetric
  percentiles: {
    baseStats: number
    level: number
    mine: number
    treasury: number
    resource: number
  }
  score: number
  rank: number
  recommendation: 'Main' | 'Wing' | 'None'
  tags: {
    strengths: string[]
    weaknesses: string[]
  }
}

export type GuildComputed = {
  guildKey: string
  guildName: string
  points: GuildSeriesPoint[]
  intervals: IntervalMetric[]
  baseStatsPerDayYear: number
  minePerDayYear: number
  treasuryPerDayYear: number
  levelMedianLatest: number
  baseStatsMedianLatest: number
  mineMedianLatest: number
  treasuryMedianLatest: number
  goodIntervals: IntervalMetric[]
  badIntervals: IntervalMetric[]
}

export type PlayerWindowEntry = {
  playerKey: string
  name: string
  guildKey?: string
  perDay: number
  delta: number
}

export type WorkerResult = {
  datasetId: string
  latestDate: string
  rangeStart: string
  snapshots: SnapshotSummary[]
  players: PlayerComputed[]
  guilds: GuildComputed[]
  topMovers: Record<WindowKey, PlayerWindowEntry[]>
  recommendations: {
    main: string[]
    wing: string[]
  }
}
