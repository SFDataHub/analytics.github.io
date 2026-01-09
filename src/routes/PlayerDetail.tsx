import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../data/store'
import BarChart from '../ui/charts/BarChart'
import LineChart from '../ui/charts/LineChart'
import { formatDate, formatNumber } from '../ui/format'

export default function PlayerDetail() {
  const { playerKey } = useParams()
  const navigate = useNavigate()
  const { result } = useData()
  const decodedKey = playerKey ? decodeURIComponent(playerKey) : ''

  const player = useMemo(
    () => result?.players.find((entry) => entry.playerKey === decodedKey) ?? null,
    [result, decodedKey],
  )

  if (!result || !player) {
    return (
      <div className="page">
        <h1 className="page-title">Player Detail</h1>
        <div className="card">
          Player not found. Select a player from the ranking table.
          <button className="btn ghost" onClick={() => navigate('/ranking')}>
            Back to Ranking
          </button>
        </div>
      </div>
    )
  }

  const firstPoint = player.points[0]
  const lastPoint = player.points[player.points.length - 1]
  const baseIntervals = player.intervals.baseStats.map((interval) => ({
    label: formatDate(interval.endDate),
    value: interval.perDay,
  }))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{player.name}</h1>
          <p className="page-subtitle">
            {player.server} · {player.latestGuildName ?? player.latestGuildKey ?? '—'}
          </p>
        </div>
        <button className="btn ghost" onClick={() => navigate('/ranking')}>
          Back to Ranking
        </button>
      </div>

      <section className="grid three-col">
        <div className="card">
          <h2 className="card-title">BaseStats/Day (Year)</h2>
          <div className="metric">{formatNumber(player.baseStatsPerDayYear, 1)}</div>
          <div className="muted">
            Best: {formatNumber(player.bestInterval?.perDay ?? 0, 1)} · Worst:{' '}
            {formatNumber(player.worstInterval?.perDay ?? 0, 1)}
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">Coverage</h2>
          <div className="metric">
            {player.coverage.points} pts · {player.coverage.days}d
          </div>
          <div className="muted">
            {formatDate(firstPoint?.date)} → {formatDate(lastPoint?.date)}
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">Recommendation</h2>
          <div className="metric">{player.recommendation}</div>
          <div className="muted">Score {formatNumber(player.score, 3)}</div>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">BaseStats Progress</h2>
        <LineChart
          points={player.points.map((point) => ({ date: point.date, value: point.baseStats }))}
        />
        <div className="chart-subtitle">Interval BaseStats/Day</div>
        <BarChart points={baseIntervals} />
      </section>

      <section className="grid two-col">
        <div className="card">
          <h2 className="card-title">Level Progress</h2>
          <LineChart
            points={player.points.map((point) => ({ date: point.date, value: point.level }))}
            color="#8ec5ff"
          />
          <div className="muted">
            Δ {formatNumber((lastPoint?.level ?? 0) - (firstPoint?.level ?? 0), 0)}
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">Mine Progress</h2>
          <LineChart
            points={player.points.map((point) => ({ date: point.date, value: point.mine }))}
            color="#f6b26b"
          />
          <div className="muted">
            Δ {formatNumber((lastPoint?.mine ?? 0) - (firstPoint?.mine ?? 0), 0)}
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Treasury Progress</h2>
        <LineChart
          points={player.points.map((point) => ({ date: point.date, value: point.treasury }))}
          color="#d17cff"
        />
        <div className="muted">
          Δ {formatNumber((lastPoint?.treasury ?? 0) - (firstPoint?.treasury ?? 0), 0)}
        </div>
      </section>
    </div>
  )
}
