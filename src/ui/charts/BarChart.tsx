type BarPoint = {
  label: string
  value: number
}

type BarChartProps = {
  points: BarPoint[]
  height?: number
}

export default function BarChart({ points, height = 120 }: BarChartProps) {
  if (!points.length) {
    return <div className="chart-empty">No intervals available.</div>
  }

  const maxAbs = Math.max(...points.map((point) => Math.abs(point.value)), 1)

  return (
    <div className="bar-chart" style={{ height }}>
      {points.map((point) => {
        const normalized = Math.abs(point.value) / maxAbs
        const barHeight = Math.max(4, normalized * (height - 24))
        const isPositive = point.value >= 0
        return (
          <div key={point.label} className="bar-item">
            <div
              className={`bar ${isPositive ? 'bar-positive' : 'bar-negative'}`}
              style={{ height: `${barHeight}px` }}
            />
            <span className="bar-label">{point.label}</span>
          </div>
        )
      })}
    </div>
  )
}
