import type { PlayerComputed, WindowKey } from '../../data/types'
import { formatInt, formatNumber } from '../format'

type RankingTableProps = {
  players: PlayerComputed[]
  windowKey: WindowKey
  onRowClick?: (playerKey: string) => void
}

export default function RankingTable({ players, windowKey, onRowClick }: RankingTableProps) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Guild</th>
            <th>BaseStats/Day (Year)</th>
            <th>BaseStats/Day (Last)</th>
            <th>Level (Latest / Δ)</th>
            <th>Mine/Day</th>
            <th>Treasury/Day</th>
            <th>Coverage</th>
            <th>Score</th>
            <th>Rec</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const latest = player.points[player.points.length - 1]
            const baseWindow = player.windowMetrics.baseStats[windowKey]
            const levelWindow = player.windowMetrics.level[windowKey]
            const mineWindow = player.windowMetrics.mine[windowKey]
            const treasuryWindow = player.windowMetrics.treasury[windowKey]
            return (
              <tr
                key={player.playerKey}
                className={onRowClick ? 'row-clickable' : undefined}
                onClick={() => onRowClick?.(player.playerKey)}
              >
                <td>
                  <div className="table-main">{player.name}</div>
                  <div className="table-sub">{player.server}</div>
                </td>
                <td>{player.latestGuildName ?? player.latestGuildKey ?? '—'}</td>
                <td>{formatNumber(player.baseStatsPerDayYear, 1)}</td>
                <td>{formatNumber(player.lastIntervals.baseStats?.perDay ?? 0, 1)}</td>
                <td>
                  <div className="table-main">{formatInt(latest?.level ?? 0)}</div>
                  <div className="table-sub">{formatInt(levelWindow?.delta ?? 0)}</div>
                </td>
                <td>{formatNumber(mineWindow?.perDay ?? 0, 1)}</td>
                <td>{formatNumber(treasuryWindow?.perDay ?? 0, 1)}</td>
                <td>
                  {player.coverage.points} pts · {player.coverage.days}d
                </td>
                <td>
                  <div className="table-main">{formatNumber(player.score, 3)}</div>
                  <div className="table-sub">#{player.rank}</div>
                </td>
                <td>
                  <span className={`badge badge-${player.recommendation.toLowerCase()}`}>
                    {player.recommendation}
                  </span>
                </td>
                <td>
                  <div className="tag-list">
                    {player.tags.strengths.map((tag) => (
                      <span key={`s-${player.playerKey}-${tag}`} className="tag tag-strong">
                        {tag}
                      </span>
                    ))}
                    {player.tags.weaknesses.map((tag) => (
                      <span key={`w-${player.playerKey}-${tag}`} className="tag tag-weak">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
