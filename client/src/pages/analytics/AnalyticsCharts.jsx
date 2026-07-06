export function ForecastTrendChart({ data }) {
  if (!data.length) {
    return <div className="text-sm text-slate-500 dark:text-slate-300">Upload a CSV to see the revenue trend.</div>
  }

  // Graph layout consts //
  const width = 640
  const height = 260
  const padding = 28
  const vals = data.map((item) => item.predicted_revenue)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const rng = max - min || 1
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0
  const scaleY = (value) => height - padding - ((value - min) / rng) * (height - padding * 2)
  const scaleX = (index) => padding + index * xStep
  const linePts = data.map((item, index) => `${scaleX(index)},${scaleY(item.predicted_revenue)}`).join(' ')

  // Gradient and polyline for the trend line/fill area for visualization //
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polyline
        points={`${linePts} ${padding},${height - padding} ${width - padding},${height - padding}`}
        fill="url(#trend-fill)"
        stroke="none"
      />
      <polyline points={linePts} fill="none" stroke="#0369a1" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((item, index) => (
        <g key={item.date}>
          <circle cx={scaleX(index)} cy={scaleY(item.predicted_revenue)} r="4" fill="#0f172a" className="dark:fill-white" />
        </g>
      ))}
    </svg>
  )
}

export function ForecastBandChart({ data }) {
  if (!data.length) {
    return <div className="text-sm text-slate-500 dark:text-slate-300">No forecast data available.</div>
  }

  const width = 640
  const height = 260
  const padding = 28
  const vals = data.flatMap((item) => [item.yhat_lower, item.predicted_revenue, item.yhat_upper])
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const rng = max - min || 1
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0

  const scaleY = (value) => height - padding - ((value - min) / rng) * (height - padding * 2)
  const scaleX = (index) => padding + index * xStep

  const upperPts = data.map((item, index) => `${scaleX(index)},${scaleY(item.yhat_upper)}`).join(' ')
  const lowerPts = data
    .slice()
    .reverse()
    .map((item, index) => `${scaleX(data.length - 1 - index)},${scaleY(item.yhat_lower)}`)
    .join(' ')
  const linePts = data.map((item, index) => `${scaleX(index)},${scaleY(item.predicted_revenue)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
      <defs>
        <linearGradient id="forecast-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polyline points={`${upperPts} ${lowerPts}`} fill="url(#forecast-band)" stroke="none" />
      <polyline points={linePts} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((item, index) => (
        <g key={item.date}>
          <circle cx={scaleX(index)} cy={scaleY(item.predicted_revenue)} r="4" fill="#0f172a" className="dark:fill-white" />
          <text x={scaleX(index)} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[10px] dark:fill-slate-300">
            {item.date.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  )
}