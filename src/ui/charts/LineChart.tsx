import { useMemo } from 'react'

type LinePoint = {
  date: string
  value: number
}

type LineChartProps = {
  points: LinePoint[]
  height?: number
  color?: string
}

export default function LineChart({ points, height = 160, color = '#61d8ba' }: LineChartProps) {
  const { path, minValue, maxValue } = useMemo(() => {
    if (points.length < 2) {
      return { path: '', minValue: 0, maxValue: 0 }
    }
    const values = points.map((point) => point.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const span = maxValue - minValue || 1
    const width = 1000
    const heightPx = 1000
    const stepX = width / (points.length - 1)
    const segments = points.map((point, index) => {
      const x = index * stepX
      const y = heightPx - ((point.value - minValue) / span) * heightPx
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    return { path: segments.join(' '), minValue, maxValue }
  }, [points])

  if (points.length < 2) {
    return <div className="chart-empty">Not enough data points.</div>
  }

  return (
    <div className="chart-wrapper" style={{ height }}>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" />
      </svg>
      <div className="chart-range">
        <span>{minValue.toFixed(0)}</span>
        <span>{maxValue.toFixed(0)}</span>
      </div>
    </div>
  )
}
