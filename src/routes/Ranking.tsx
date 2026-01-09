import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../data/store'
import type { PlayerComputed, WindowKey } from '../data/types'
import RankingTable from '../ui/tables/RankingTable'

type SortKey = 'score' | 'baseStats' | 'level' | 'mine' | 'treasury'

const WINDOW_KEYS: WindowKey[] = ['1', '3', '6', '12']

export default function Ranking() {
  const { result } = useData()
  const navigate = useNavigate()
  const [windowKey, setWindowKey] = useState<WindowKey>('6')
  const [selectedGuild, setSelectedGuild] = useState<string>('all')
  const [selectedRec, setSelectedRec] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')

  const guildOptions = useMemo(
    () => result?.guilds.map((guild) => ({ key: guild.guildKey, label: guild.guildName })) ?? [],
    [result],
  )

  const filteredPlayers = useMemo(() => {
    if (!result) {
      return []
    }
    let players = result.players
    if (selectedGuild !== 'all') {
      players = players.filter((player) => player.latestGuildKey === selectedGuild)
    }
    if (selectedRec !== 'all') {
      players = players.filter((player) => player.recommendation === selectedRec)
    }
    const sorted = [...players].sort((a, b) => {
      const value = (player: PlayerComputed) => {
        switch (sortKey) {
          case 'baseStats':
            return player.baseStatsPerDayYear
          case 'level':
            return player.windowMetrics.level[windowKey]?.delta ?? 0
          case 'mine':
            return player.windowMetrics.mine[windowKey]?.perDay ?? 0
          case 'treasury':
            return player.windowMetrics.treasury[windowKey]?.perDay ?? 0
          case 'score':
          default:
            return player.score
        }
      }
      return value(b) - value(a)
    })
    return sorted
  }, [result, selectedGuild, selectedRec, sortKey, windowKey])

  if (!result) {
    return (
      <div className="page">
        <h1 className="page-title">Ranking</h1>
        <div className="card">Load a dataset to see rankings and recommendations.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ranking</h1>
          <p className="page-subtitle">Scores, recommendations, and performance windows.</p>
        </div>
        <div className="filters">
          <label className="filter">
            <span>Guild</span>
            <select
              className="select"
              value={selectedGuild}
              onChange={(event) => setSelectedGuild(event.target.value)}
            >
              <option value="all">All</option>
              {guildOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="filter">
            <span>Recommendation</span>
            <select
              className="select"
              value={selectedRec}
              onChange={(event) => setSelectedRec(event.target.value)}
            >
              <option value="all">All</option>
              <option value="Main">Main</option>
              <option value="Wing">Wing</option>
              <option value="None">None</option>
            </select>
          </label>
          <label className="filter">
            <span>Window</span>
            <select
              className="select"
              value={windowKey}
              onChange={(event) => setWindowKey(event.target.value as WindowKey)}
            >
              {WINDOW_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key} mo
                </option>
              ))}
            </select>
          </label>
          <label className="filter">
            <span>Sort</span>
            <select
              className="select"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="score">Score</option>
              <option value="baseStats">BaseStats/Day (Year)</option>
              <option value="level">Level Δ (Window)</option>
              <option value="mine">Mine/Day</option>
              <option value="treasury">Treasury/Day</option>
            </select>
          </label>
        </div>
      </div>

      <RankingTable
        players={filteredPlayers}
        windowKey={windowKey}
        onRowClick={(playerKey) => navigate(`/player/${encodeURIComponent(playerKey)}`)}
      />
    </div>
  )
}
