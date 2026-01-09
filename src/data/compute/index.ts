import type {
  GuildComputed,
  GuildSeries,
  GuildSeriesPoint,
  IntervalMetric,
  ManifestSnapshot,
  NormalizedSnapshot,
  PlayerComputed,
  PlayerSeries,
  PlayerSeriesPoint,
  PlayerWindowMetrics,
  SnapshotSummary,
  WindowKey,
  WorkerResult,
} from '../types'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_KEYS: WindowKey[] = ['1', '3', '6', '12']

const toDate = (value: string) => new Date(value)

const diffDays = (start: string, end: string) => {
  const days = Math.round((toDate(end).getTime() - toDate(start).getTime()) / DAY_MS)
  return Math.max(1, days)
}

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const median = (values: number[]) => {
  if (!values.length) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

const weightedPerDay = (intervals: IntervalMetric[]) => {
  const totalDays = intervals.reduce((sum, interval) => sum + interval.days, 0)
  const totalDelta = intervals.reduce((sum, interval) => sum + interval.delta, 0)
  return totalDays > 0 ? totalDelta / totalDays : 0
}

const buildIntervals = (
  points: PlayerSeriesPoint[],
  selector: (point: PlayerSeriesPoint) => number,
): IntervalMetric[] => {
  const intervals: IntervalMetric[] = []
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    const delta = selector(end) - selector(start)
    const days = diffDays(start.date, end.date)
    intervals.push({
      startDate: start.date,
      endDate: end.date,
      days,
      delta,
      perDay: delta / days,
    })
  }
  return intervals
}

const buildGuildIntervals = (points: GuildSeriesPoint[]): IntervalMetric[] => {
  const intervals: IntervalMetric[] = []
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    const delta = end.baseStatsMedian - start.baseStatsMedian
    const days = diffDays(start.date, end.date)
    intervals.push({
      startDate: start.date,
      endDate: end.date,
      days,
      delta,
      perDay: delta / days,
    })
  }
  return intervals
}

const buildGuildMetricIntervals = (
  points: GuildSeriesPoint[],
  selector: (point: GuildSeriesPoint) => number,
): IntervalMetric[] => {
  const intervals: IntervalMetric[] = []
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    const delta = selector(end) - selector(start)
    const days = diffDays(start.date, end.date)
    intervals.push({
      startDate: start.date,
      endDate: end.date,
      days,
      delta,
      perDay: delta / days,
    })
  }
  return intervals
}

const findWindowStart = (points: PlayerSeriesPoint[], months: number) => {
  if (!points.length) {
    return null
  }
  const endDate = toDate(points[points.length - 1].date)
  const target = new Date(endDate)
  target.setMonth(target.getMonth() - months)
  for (let index = points.length - 2; index >= 0; index -= 1) {
    const candidate = points[index]
    if (toDate(candidate.date) <= target) {
      return candidate
    }
  }
  return null
}

const buildWindowMetric = (
  start: PlayerSeriesPoint,
  end: PlayerSeriesPoint,
  selector: (point: PlayerSeriesPoint) => number,
) => {
  const delta = selector(end) - selector(start)
  const days = diffDays(start.date, end.date)
  return {
    startDate: start.date,
    endDate: end.date,
    days,
    delta,
    perDay: delta / days,
  }
}

const initializeWindowMetrics = (): PlayerWindowMetrics => ({
  baseStats: { '1': null, '3': null, '6': null, '12': null },
  level: { '1': null, '3': null, '6': null, '12': null },
  mine: { '1': null, '3': null, '6': null, '12': null },
  treasury: { '1': null, '3': null, '6': null, '12': null },
})

const computePercentiles = (values: Map<string, number>) => {
  const entries = Array.from(values.entries()).sort((a, b) => a[1] - b[1])
  const percentileMap = new Map<string, number>()
  if (!entries.length) {
    return percentileMap
  }
  let index = 0
  while (index < entries.length) {
    const value = entries[index][1]
    let end = index
    while (end < entries.length && entries[end][1] === value) {
      end += 1
    }
    const rank = (index + (end - 1)) / 2
    const percentile = entries.length === 1 ? 1 : rank / (entries.length - 1)
    for (let cursor = index; cursor < end; cursor += 1) {
      percentileMap.set(entries[cursor][0], percentile)
    }
    index = end
  }
  return percentileMap
}

export function computeDataset(
  normalizedSnapshots: NormalizedSnapshot[],
  manifestSnapshots: ManifestSnapshot[],
  datasetId: string,
): WorkerResult {
  const snapshots = normalizedSnapshots
    .map((snapshot, index) => ({
      snapshot,
      meta: manifestSnapshots[index],
    }))
    .sort(
      (a, b) => toDate(a.snapshot.scannedAt).getTime() - toDate(b.snapshot.scannedAt).getTime(),
    )

  const playerMap = new Map<string, PlayerSeries>()
  const guildMap = new Map<string, GuildSeries>()
  const snapshotSummaries: SnapshotSummary[] = []

  snapshots.forEach(({ snapshot, meta }) => {
    let snapshotMemberCount = 0
    snapshot.guilds.forEach((guild) => {
      const memberStats = {
        baseStats: [] as number[],
        level: [] as number[],
        mine: [] as number[],
        treasury: [] as number[],
      }
      const existingGuild = guildMap.get(guild.guildKey) ?? {
        guildKey: guild.guildKey,
        guildName: guild.guildName,
        points: [],
      }

      guild.members.forEach((member) => {
        snapshotMemberCount += 1
        memberStats.baseStats.push(member.baseStats)
        memberStats.level.push(member.level)
        memberStats.mine.push(member.mine)
        memberStats.treasury.push(member.treasury)

        const existingPlayer = playerMap.get(member.playerKey) ?? {
          playerKey: member.playerKey,
          name: member.name,
          server: member.server,
          playerId: member.playerId,
          points: [],
        }

        existingPlayer.name = member.name
        existingPlayer.server = member.server
        existingPlayer.playerId = member.playerId
        existingPlayer.points.push({
          date: snapshot.scannedAt,
          baseStats: member.baseStats,
          level: member.level,
          mine: member.mine,
          treasury: member.treasury,
          guildKey: guild.guildKey,
        })

        playerMap.set(member.playerKey, existingPlayer)
      })

      existingGuild.points.push({
        date: snapshot.scannedAt,
        memberCount: guild.members.length,
        baseStatsMedian: median(memberStats.baseStats),
        baseStatsAvg: average(memberStats.baseStats),
        levelMedian: median(memberStats.level),
        levelAvg: average(memberStats.level),
        mineMedian: median(memberStats.mine),
        mineAvg: average(memberStats.mine),
        treasuryMedian: median(memberStats.treasury),
        treasuryAvg: average(memberStats.treasury),
      })

      guildMap.set(guild.guildKey, existingGuild)
    })

    snapshotSummaries.push({
      id: meta?.id ?? snapshot.scannedAt,
      label: meta?.label ?? snapshot.scannedAt,
      date: meta?.date ?? snapshot.scannedAt,
      guildCount: snapshot.guilds.length,
      memberCount: snapshotMemberCount,
    })
  })

  const players: PlayerComputed[] = []
  const baseStatsValues = new Map<string, number>()
  const levelValues = new Map<string, number>()
  const mineValues = new Map<string, number>()
  const treasuryValues = new Map<string, number>()

  Array.from(playerMap.values()).forEach((player) => {
    player.points.sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
    const baseStatsIntervals = buildIntervals(player.points, (point) => point.baseStats)
    const levelIntervals = buildIntervals(player.points, (point) => point.level)
    const mineIntervals = buildIntervals(player.points, (point) => point.mine)
    const treasuryIntervals = buildIntervals(player.points, (point) => point.treasury)

    const lastPoint = player.points[player.points.length - 1]
    const windowMetrics = initializeWindowMetrics()

    WINDOW_KEYS.forEach((windowKey) => {
      const windowMonths = Number(windowKey)
      const startPoint = findWindowStart(player.points, windowMonths)
      if (!startPoint || !lastPoint) {
        return
      }
      windowMetrics.baseStats[windowKey] = buildWindowMetric(
        startPoint,
        lastPoint,
        (point) => point.baseStats,
      )
      windowMetrics.level[windowKey] = buildWindowMetric(
        startPoint,
        lastPoint,
        (point) => point.level,
      )
      windowMetrics.mine[windowKey] = buildWindowMetric(
        startPoint,
        lastPoint,
        (point) => point.mine,
      )
      windowMetrics.treasury[windowKey] = buildWindowMetric(
        startPoint,
        lastPoint,
        (point) => point.treasury,
      )
    })

    const baseStatsPerDayYear = weightedPerDay(baseStatsIntervals)
    const levelPerDayYear = weightedPerDay(levelIntervals)
    const minePerDayYear = weightedPerDay(mineIntervals)
    const treasuryPerDayYear = weightedPerDay(treasuryIntervals)

    baseStatsValues.set(player.playerKey, baseStatsPerDayYear)
    levelValues.set(player.playerKey, levelPerDayYear)
    mineValues.set(player.playerKey, minePerDayYear)
    treasuryValues.set(player.playerKey, treasuryPerDayYear)

    const coverageDays =
      player.points.length > 1
        ? diffDays(player.points[0].date, player.points[player.points.length - 1].date)
        : 0

    const bestInterval = baseStatsIntervals.length
      ? [...baseStatsIntervals].sort((a, b) => b.perDay - a.perDay)[0]
      : undefined
    const worstInterval = baseStatsIntervals.length
      ? [...baseStatsIntervals].sort((a, b) => a.perDay - b.perDay)[0]
      : undefined

    players.push({
      playerKey: player.playerKey,
      name: player.name,
      server: player.server,
      playerId: player.playerId,
      latestGuildKey: lastPoint?.guildKey,
      latestGuildName: undefined,
      points: player.points,
      intervals: {
        baseStats: baseStatsIntervals,
        level: levelIntervals,
        mine: mineIntervals,
        treasury: treasuryIntervals,
      },
      lastIntervals: {
        baseStats: baseStatsIntervals[baseStatsIntervals.length - 1],
        level: levelIntervals[levelIntervals.length - 1],
        mine: mineIntervals[mineIntervals.length - 1],
        treasury: treasuryIntervals[treasuryIntervals.length - 1],
      },
      baseStatsPerDayYear,
      levelPerDayYear,
      minePerDayYear,
      treasuryPerDayYear,
      coverage: {
        points: player.points.length,
        days: coverageDays,
      },
      windowMetrics,
      bestInterval,
      worstInterval,
      percentiles: {
        baseStats: 0,
        level: 0,
        mine: 0,
        treasury: 0,
        resource: 0,
      },
      score: 0,
      rank: 0,
      recommendation: 'None',
      tags: {
        strengths: [],
        weaknesses: [],
      },
    })
  })

  const guilds: GuildComputed[] = []
  Array.from(guildMap.values()).forEach((guild) => {
    guild.points.sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
    const intervals = buildGuildIntervals(guild.points)
    const baseStatsPerDayYear = weightedPerDay(intervals)
    const minePerDayYear = weightedPerDay(
      buildGuildMetricIntervals(guild.points, (point) => point.mineMedian),
    )
    const treasuryPerDayYear = weightedPerDay(
      buildGuildMetricIntervals(guild.points, (point) => point.treasuryMedian),
    )

    const lastPoint = guild.points[guild.points.length - 1]
    const sortedIntervals = [...intervals].sort((a, b) => b.perDay - a.perDay)
    const goodIntervals = sortedIntervals.slice(0, 3)
    const badIntervals = [...sortedIntervals].reverse().slice(0, 3)

    guilds.push({
      guildKey: guild.guildKey,
      guildName: guild.guildName,
      points: guild.points,
      intervals,
      baseStatsPerDayYear,
      minePerDayYear,
      treasuryPerDayYear,
      levelMedianLatest: lastPoint?.levelMedian ?? 0,
      baseStatsMedianLatest: lastPoint?.baseStatsMedian ?? 0,
      mineMedianLatest: lastPoint?.mineMedian ?? 0,
      treasuryMedianLatest: lastPoint?.treasuryMedian ?? 0,
      goodIntervals,
      badIntervals,
    })
  })

  const baseStatsPercentiles = computePercentiles(baseStatsValues)
  const levelPercentiles = computePercentiles(levelValues)
  const minePercentiles = computePercentiles(mineValues)
  const treasuryPercentiles = computePercentiles(treasuryValues)

  players.forEach((player) => {
    const baseStats = baseStatsPercentiles.get(player.playerKey) ?? 0
    const level = levelPercentiles.get(player.playerKey) ?? 0
    const mine = minePercentiles.get(player.playerKey) ?? 0
    const treasury = treasuryPercentiles.get(player.playerKey) ?? 0
    const resource = (mine + treasury) / 2
    player.percentiles = { baseStats, level, mine, treasury, resource }
    player.score = baseStats * 0.5 + level * 0.3 + resource * 0.2
  })

  players.sort((a, b) => b.score - a.score)
  players.forEach((player, index) => {
    player.rank = index + 1
    const strengths: string[] = []
    const weaknesses: string[] = []
    if (player.percentiles.baseStats >= 0.8) strengths.push('BaseStats Pace')
    if (player.percentiles.level >= 0.8) strengths.push('Leveling')
    if (player.percentiles.resource >= 0.8) strengths.push('Resource Pace')
    if (player.percentiles.baseStats <= 0.2) weaknesses.push('BaseStats Pace')
    if (player.percentiles.level <= 0.2) weaknesses.push('Leveling')
    if (player.percentiles.resource <= 0.2) weaknesses.push('Resource Pace')
    player.tags = { strengths, weaknesses }
  })

  const guildNameMap = new Map<string, string>()
  guilds.forEach((guild) => guildNameMap.set(guild.guildKey, guild.guildName))
  players.forEach((player) => {
    if (player.latestGuildKey) {
      player.latestGuildName = guildNameMap.get(player.latestGuildKey)
    }
  })

  const latestSnapshot = snapshots[snapshots.length - 1]?.snapshot
  const candidateKeys: string[] = []
  if (latestSnapshot) {
    latestSnapshot.guilds.forEach((guild) => {
      guild.members.slice(0, 50).forEach((member) => {
        candidateKeys.push(member.playerKey)
      })
    })
  }

  const uniqueCandidates = Array.from(new Set(candidateKeys))
  const candidatePlayers = players.filter((player) => uniqueCandidates.includes(player.playerKey))
  const sortedCandidates = [...candidatePlayers].sort((a, b) => b.score - a.score)
  const mainList = sortedCandidates.slice(0, 50).map((player) => player.playerKey)
  const wingList = sortedCandidates.slice(50).map((player) => player.playerKey)

  players.forEach((player) => {
    if (mainList.includes(player.playerKey)) {
      player.recommendation = 'Main'
    } else if (wingList.includes(player.playerKey)) {
      player.recommendation = 'Wing'
    }
  })

  const topMovers: WorkerResult['topMovers'] = {
    '1': [],
    '3': [],
    '6': [],
    '12': [],
  }
  WINDOW_KEYS.forEach((windowKey) => {
    const entries = players
      .map((player) => {
        const metric = player.windowMetrics.baseStats[windowKey]
        if (!metric) {
          return null
        }
        return {
          playerKey: player.playerKey,
          name: player.name,
          guildKey: player.latestGuildKey,
          perDay: metric.perDay,
          delta: metric.delta,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => b.perDay - a.perDay)
      .slice(0, 5)
    topMovers[windowKey] = entries
  })

  const rangeStart = snapshots[0]?.snapshot.scannedAt ?? ''
  const latestDate = snapshots[snapshots.length - 1]?.snapshot.scannedAt ?? ''

  return {
    datasetId,
    latestDate,
    rangeStart,
    snapshots: snapshotSummaries,
    players,
    guilds,
    topMovers,
    recommendations: {
      main: mainList,
      wing: wingList,
    },
  }
}
