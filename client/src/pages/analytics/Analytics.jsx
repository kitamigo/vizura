import { useState } from 'react'
import AnalyticsShell from './AnalyticsShell'

function Analytics() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  })

  return <AnalyticsShell dateRange={dateRange} setDateRange={setDateRange} />
}

export async function fetchRevenueTrend(params) {
  const { data } = await api.get('/analytics/revenue-trend', { params })
  return data
}

export default Analytics
