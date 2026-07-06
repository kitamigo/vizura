import { useEffect, useMemo, useState } from 'react'
import {
  fetchAnomalies,
  fetchNlqHistory,
  fetchSavedForecast,
  runForecast,
  runNlqQuery,
  uploadAnalyticsCsv,
} from '../../services/analyticsApi'

export function getDateRangePayload(dateRange) {
  return {
    startDate: dateRange.startDate ? dateRange.startDate.toISOString().split('T')[0] : null,
    endDate: dateRange.endDate ? dateRange.endDate.toISOString().split('T')[0] : null,
  }
}

function zipForecastPoints(forecast) {
  if (!forecast || !Array.isArray(forecast.dates)) return []

  return forecast.dates.map((date, i) => ({
    date,
    predicted_revenue: forecast.ensemble_forecast?.[i] ?? forecast.xgboost_forecast?.[i] ?? 0,
    yhat_lower: forecast.lower_bound?.[i] ?? 0,
    yhat_upper: forecast.upper_bound?.[i] ?? 0,
  }))
}

function normalizeAnomalyItems(anomalies) {
  if (!anomalies?.anomalies?.length) return []
  if (!Array.isArray(anomalies.anomalies)) return []

  return anomalies.anomalies.map((a) => ({
    date: a.date,
    type: a.method || a.explanation?.split(':')[0] || 'unknown',
    severity: a.severity || 'warning',
    value: a.value,
    expected_value: a.expected_value,
    deviation_pct: a.deviation_pct,
    explanation: a.explanation,
  }))
}

function normalizeAnalyticsPayload(payload) {
  const forecast = Array.isArray(payload?.forecast)
    ? payload.forecast
    : zipForecastPoints(payload?.forecast)

  const anomalies = payload?.anomalies?.anomalies
    ? normalizeAnomalyItems(payload)
    : Array.isArray(payload?.anomalies)
      ? normalizeAnomalyItems({ anomalies: payload.anomalies })
      : []

  return {
    forecast,
    anomalies,
    fileName: payload?.fileName || null,
    uploadedAt: payload?.uploadedAt || null,
  }
}

function normalizeNlqResult(payload) {
  return {
    question: payload?.question || '',
    sql: payload?.sql || '',
    confidence: typeof payload?.confidence === 'number' ? payload.confidence : 0,
    method: payload?.method || 'rule_based',
    rows: Array.isArray(payload?.rows) ? payload.rows : [],
    row_count: typeof payload?.row_count === 'number' ? payload.row_count : 0,
  }
}

export function useAnalyticsData(dateRange) {
  const [forecastData, setForecastData] = useState({ forecast: [], anomalies: [] })
  const [anomalies, setAnomalies] = useState([])
  const [csvFile, setCsvFile] = useState(null)
  const [loadingForecast, setLoadingForecast] = useState(false)
  const [loadingAnomalies, setLoadingAnomalies] = useState(false)
  const [loadingUpload, setLoadingUpload] = useState(false)
  const [loadingQuery, setLoadingQuery] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [queryHistory, setQueryHistory] = useState([])
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const forecastPts = forecastData.forecast || []
  const hasData = forecastPts.length > 0 || anomalies.length > 0

  const queryCols = useMemo(() => {
    if (!queryResult?.rows?.length) {
      return []
    }

    return Object.keys(queryResult.rows[0])
  }, [queryResult])

  useEffect(() => {
    let cancelled = false

    async function loadSavedAnalytics() {
      try {
        const res = await fetchSavedForecast()

        if (cancelled) return

        const norm = normalizeAnalyticsPayload(res)
        setForecastData((cur) => ({ ...cur, ...norm }))
        setAnomalies(norm.anomalies)
      } catch (error) {
        if (!cancelled) {
          setForecastData({ forecast: [], anomalies: [] })
          setAnomalies([])
        }
      }
    }

    loadSavedAnalytics()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      try {
        const res = await fetchNlqHistory()

        if (cancelled) return

        setQueryHistory(Array.isArray(res?.history) ? res.history : [])
      } catch (error) {
        if (!cancelled) {
          setQueryHistory([])
        }
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [])

  const runSavedForecast = async () => {
    if (!hasData) {
      setErrorMsg('Upload a CSV first so the model has data to forecast.')
      return
    }

    setLoadingForecast(true)
    setStatusMsg('')
    setErrorMsg('')

    try {
      const res = await runForecast(getDateRangePayload(dateRange))
      const norm = normalizeAnalyticsPayload(res)
      setForecastData((cur) => ({ ...cur, ...norm }))
      setAnomalies(norm.anomalies.length ? norm.anomalies : anomalies)
      setStatusMsg('Forecast updated from the model output.')
    } catch (error) {
      setErrorMsg('Forecast endpoint is not ready yet or returned no data.')
    } finally {
      setLoadingForecast(false)
    }
  }

  const refreshAnomalies = async () => {
    if (!hasData) {
      setErrorMsg('Upload a CSV first so anomaly flags can be generated.')
      return
    }

    setLoadingAnomalies(true)
    setStatusMsg('')
    setErrorMsg('')

    try {
      const res = await fetchAnomalies(getDateRangePayload(dateRange))
      const norm = normalizeAnalyticsPayload(res)
      setAnomalies(norm.anomalies)
      if (norm.forecast.length) {
        setForecastData((cur) => ({ ...cur, ...norm }))
      }
      setStatusMsg('Anomalies refreshed from the model output.')
    } catch (error) {
      setErrorMsg('Anomaly endpoint is not ready yet or returned no data.')
    } finally {
      setLoadingAnomalies(false)
    }
  }

  const uploadCsv = async (file) => {
    if (!file) {
      setErrorMsg('Choose a CSV file first.')
      return
    }

    setLoadingUpload(true)
    setStatusMsg('')
    setErrorMsg('')

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadAnalyticsCsv(fd)
      const norm = normalizeAnalyticsPayload(res)
      setForecastData((cur) => ({ ...cur, ...norm }))
      setAnomalies(norm.anomalies)
      setStatusMsg(res.message || 'CSV uploaded successfully. Model output received.')
      setCsvFile(null)
    } catch (error) {
      setErrorMsg('Upload failed or the model endpoint did not return analytics data.')
    } finally {
      setLoadingUpload(false)
    }
  }

  const submitQuery = async (question) => {
    const q = String(question || queryText).trim()

    if (!q) {
      setErrorMsg('Ask a question first.')
      return
    }

    setLoadingQuery(true)
    setStatusMsg('')
    setErrorMsg('')

    try {
      const res = await runNlqQuery({ question: q })
      const norm = normalizeNlqResult(res)

      setQueryResult(norm)
      setQueryText(norm.question)
      setQueryHistory((current) => {
        const nextHist = [
          {
            question: norm.question,
            timestamp: new Date().toISOString(),
            row_count: norm.row_count,
            method: norm.method,
          },
          ...current.filter((item) => item.question !== norm.question),
        ]

        return nextHist.slice(0, 10)
      })

      setStatusMsg('Query executed.')
    } catch (error) {
      setErrorMsg('NLQ endpoint is not ready yet or returned an error.')
      setQueryResult({
        question: q,
        sql: '',
        confidence: 0,
        method: 'error',
        rows: [],
        row_count: 0,
      })
    } finally {
      setLoadingQuery(false)
    }
  }

  const loadHistoryQuery = (item) => {
    setQueryText(item.question)
    submitQuery(item.question)
  }

  return {
    anomalies,
    csvFile,
    errorMsg,
    forecastPts,
    hasData,
    loadingAnomalies,
    loadingForecast,
    loadingQuery,
    loadingUpload,
    queryCols,
    queryHistory,
    queryResult,
    queryText,
    refreshAnomalies,
    runSavedForecast,
    setCsvFile,
    setErrorMsg,
    setQueryText,
    setStatusMsg,
    statusMsg,
    submitQuery,
    loadHistoryQuery,
    uploadCsv,
  }
}