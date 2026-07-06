import { useState } from 'react'
import AnalyticsShell from './AnalyticsShell'

function Analytics() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  })

  return <AnalyticsShell dateRange={dateRange} setDateRange={setDateRange} />
}

export default Analytics