import { useMemo, useState } from 'react'
import { useData } from '../data/store'
import type { WindowKey } from '../data/types'
import { formatDate, formatNumber } from '../ui/format'

const WINDOW_KEYS: WindowKey[] = ['1', '3', '6', '12']

export default function Dashboard() {
  const { result } = useData()
  const [windowKey, setWindowKey] = useState<WindowKey>('3')

  const rangeSummary = useMemo(() => {
    if (!result) {
      return 'No dataset loaded.'
    }
    return `${formatDate(result.rangeStart)} → ${formatDate(result.latestDate)} · ${
      result.snapshots.length
    } snapshots`
  }, [result])

  if (!result) {
    return (
      <div className="page">
        <h1 className="page-title">Dashboard</h1>
        <div className="card">
          Load a dataset in the Import tab to unlock analytics and rankings.
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{rangeSummary}</p>
        </div>
      </div>

      <section className="grid three-col">
        <div className="card">
          <h2 className="card-title">Latest Scan</h2>
          <div className="metric">{formatDate(result.latestDate)}</div>
          <div className="muted">{result.snapshots.at(-1)?.label}</div>
        </div>
        <div className="card">
          <h2 className="card-title">Coverage</h2>
          <div className="metric">{result.players.length} players</div>
          <div className="muted">Across {result.guilds.length} guilds</div>
        </div>
        <div className="card">
          <h2 className="card-title">Main / Wing Split</h2>
          <div className="metric">{result.recommendations.main.length} Main</div>
          <div className="muted">{result.recommendations.wing.length} Wing</div>
        </div>
      </section>

      <section className="grid two-col">
        {result.guilds.map((guild) => (
          <div key={guild.guildKey} className="card">
            <h2 className="card-title">{guild.guildName}</h2>
            <div className="stat-grid">
              <div>
                <div className="stat-label">BaseStats/Day Median</div>
                <div className="stat-value">{formatNumber(guild.baseStatsPerDayYear, 1)}</div>
              </div>
              <div>
                <div className="stat-label">Level Median</div>
                <div className="stat-value">{formatNumber(guild.levelMedianLatest, 0)}</div>
              </div>
              <div>
                <div className="stat-label">Mine Pace</div>
                <div className="stat-value">{formatNumber(guild.minePerDayYear, 1)}</div>
              </div>
              <div>
                <div className="stat-label">Treasury Pace</div>
                <div className="stat-value">{formatNumber(guild.treasuryPerDayYear, 1)}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid two-col">
        {result.guilds.map((guild) => (
          <div key={`${guild.guildKey}-intervals`} className="card">
            <h2 className="card-title">Good / Bad Months · {guild.guildName}</h2>
            <div className="interval-grid">
              <div>
                <div className="interval-title">Top 3</div>
                {guild.goodIntervals.map((interval) => (
                  <div key={`${interval.startDate}-${interval.endDate}`} className="interval-item">
                    <span>{formatDate(interval.endDate)}</span>
                    <span>{formatNumber(interval.perDay, 1)} / day</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="interval-title">Bottom 3</div>
                {guild.badIntervals.map((interval) => (
                  <div key={`${interval.startDate}-${interval.endDate}`} className="interval-item">
                    <span>{formatDate(interval.endDate)}</span>
                    <span>{formatNumber(interval.perDay, 1)} / day</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Top Movers (BaseStats/Day)</h2>
          <div className="tabs">
            {WINDOW_KEYS.map((key) => (
              <button
                key={key}
                className={`tab ${windowKey === key ? 'active' : ''}`}
                onClick={() => setWindowKey(key)}
              >
                {key} mo
              </button>
            ))}
          </div>
        </div>
        <div className="list">
          {result.topMovers[windowKey].map((entry) => (
            <div key={entry.playerKey} className="list-item">
              <div>
                <div className="list-title">{entry.name}</div>
                <div className="list-sub">{entry.guildKey ?? '—'}</div>
              </div>
              <div className="metric-inline">
                {formatNumber(entry.perDay, 1)} / day
                <span className="muted">{formatNumber(entry.delta, 0)} total</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
