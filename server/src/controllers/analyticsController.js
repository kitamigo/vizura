const axios = require('axios')

let latestAnalyticsSnapshot = null
let latestUpload = null
let latestCsvContent = null

function getLatestCsvContent() {
  return latestCsvContent
}

// -- AI SERVICE BASE URL -- //

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'
const AI_SERVICE_TIMEOUT = Number(process.env.AI_SERVICE_TIMEOUT_MS || 60000)

function aiHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = process.env.AI_SERVICE_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

// -- HELPERS -- //
function createEmptySnapshot() {
  return {
    forecast: [],
    anomalies: [],
    fileName: null,
    uploadedAt: null,
  }
}

// Parser for AI service (Converts CSV to data points) //
function parseCsvToDataPoints(csvString) {
  const lines = csvString.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].toLowerCase().split(',')
  const dateIdx = headers.findIndex(h => h.trim() === 'date')
  const revIdx = headers.findIndex(h => {
    const hh = h.trim()
    return hh === 'revenue' || hh === 'sales' || hh === 'amount' || hh === 'value'
  })

  if (dateIdx === -1 || revIdx === -1) return []

  const points = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const date = cols[dateIdx]?.trim()
    const revenue = parseFloat(cols[revIdx])
    if (date && !isNaN(revenue)) {
      points.push({ date, revenue })
    }
  }
  return points
}

// Normalizes the FastAPI forecast response //
function normalizeForecast(payload) {
  const src = payload?.data || payload || {}
  return {
    dates: src.dates || [],
    ensemble_forecast: src.ensemble_forecast || [],
    lower_bound: src.lower_bound || [],
    upper_bound: src.upper_bound || [],
    weights: {
      xgboost: src.xgb_weight ?? null,
      prophet: src.prophet_weight ?? null,
    },
    rmse: {
      xgboost: src.rmse_xgb ?? null,
      prophet: src.rmse_prophet ?? null,
    },
  }
}

// Normalizes the FastAPI anomaly response //
function normalizeAnomalies(payload) {
  const src = payload?.data || payload || {}
  return {
    total_points: src.total_points || 0,
    anomalies_found: src.anomalies_found || 0,
    anomaly_rate: src.anomaly_rate || 0,
    summary: src.summary || '',
    anomalies: (src.anomalies || []).map(a => ({
      date: a.date,
      value: a.value,
      expected_value: a.expected_value,
      deviation_pct: a.deviation_pct,
      severity: a.severity,
      method: a.method,
      explanation: a.explanation,
    })),
  }
}

// -- AI SERVICE CALLS -- //
async function callForecastService(dataPoints) {
  const url = `${AI_SERVICE_URL}/forecast/predict`
  const response = await axios.post(
    url,
    { data: dataPoints, days: 30 },
    { headers: aiHeaders(), timeout: AI_SERVICE_TIMEOUT },
  )
  return normalizeForecast(response.data)
}

async function callAnomalyService(dataPoints) {
  const url = `${AI_SERVICE_URL}/anomaly/detect`
  const response = await axios.post(
    url,
    { data: dataPoints },
    { headers: aiHeaders(), timeout: AI_SERVICE_TIMEOUT },
  )
  return normalizeAnomalies(response.data)
}

// -- SNAPSHOT LOOKUP -- //
function ensureSnapshot() {
  if (!latestAnalyticsSnapshot) {
    return null
  }

  return {
    ...latestAnalyticsSnapshot,
    fileName: latestUpload?.fileName || latestAnalyticsSnapshot.fileName || null,
    uploadedAt: latestUpload?.uploadedAt || latestAnalyticsSnapshot.uploadedAt || null,
  }
}

// -- ANALYTICS ENDPOINTS -- //
async function getSavedForecast(req, res) {
  const snapshot = ensureSnapshot()

  if (!snapshot) {
    return res.status(404).json({ message: 'Upload a CSV file to generate analytics.' })
  }

  res.json(snapshot)
}

async function runForecast(req, res) {
  const snapshot = ensureSnapshot()

  if (!snapshot) {
    return res.status(404).json({ message: 'Upload a CSV file before running a forecast.' })
  }

  res.json({
    forecast: snapshot.forecast,
    fileName: snapshot.fileName,
    uploadedAt: snapshot.uploadedAt,
  })
}

async function getAnomalies(req, res) {
  const snapshot = ensureSnapshot()

  if (!snapshot) {
    return res.status(404).json({ message: 'Upload a CSV file before checking anomalies.' })
  }

  res.json({
    anomalies: snapshot.anomalies,
    fileName: snapshot.fileName,
    uploadedAt: snapshot.uploadedAt,
  })
}

// -- CSV UPLOAD -- //
async function uploadCsv(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' })
  }

  const uploadedAt = new Date().toISOString()
  const csvContent = req.file.buffer.toString('utf8')

  latestCsvContent = csvContent
  latestUpload = {
    fileName: req.file.originalname,
    uploadedAt,
  }

  // Parses CSV to data points for the AI service //
  const dataPoints = parseCsvToDataPoints(csvContent)

  if (dataPoints.length < 10) {
    return res.status(400).json({
      error: 'CSV must contain at least 10 valid data rows with date and revenue columns.',
      found: dataPoints.length,
    })
  }

  try {
    // Calls forecast and anomaly detection in parallel //
    const [forecastResult, anomalyResult] = await Promise.all([
      callForecastService(dataPoints).catch(err => {
        console.error('forecast service error:', err.message)
        return null
      }),
      callAnomalyService(dataPoints).catch(err => {
        console.error('anomaly service error:', err.message)
        return null
      }),
    ])

    // Build snapshot from results //
    latestAnalyticsSnapshot = {
      forecast: forecastResult || { dates: [], ensemble_forecast: [], lower_bound: [], upper_bound: [] },
      anomalies: anomalyResult || { anomalies: [], summary: '', anomalies_found: 0 },
      fileName: req.file.originalname,
      uploadedAt,
    }

    if (forecastResult || anomalyResult) {
      return res.status(200).json({
        message: 'CSV uploaded and analytics generated.',
        ...latestAnalyticsSnapshot,
      })
    }

    // AI service unreachable returns parsed data with empty analytics //
    latestAnalyticsSnapshot = {
      ...createEmptySnapshot(),
      fileName: req.file.originalname,
      uploadedAt,
      dataPoints: dataPoints.length,
    }

    return res.status(202).json({
      message: 'CSV uploaded. Start the AI service (ai-service/) to generate analytics.',
      ...latestAnalyticsSnapshot,
    })
  } catch (error) {
    console.error('analytics upload error:', error.message)
    latestAnalyticsSnapshot = createEmptySnapshot()

    return res.status(502).json({
      message: 'CSV uploaded but analytics processing failed.',
      error: error.message,
      ...latestAnalyticsSnapshot,
      fileName: req.file.originalname,
      uploadedAt,
    })
  }
}

module.exports = {
  getSavedForecast,
  runForecast,
  getAnomalies,
  uploadCsv,
  getLatestCsvContent,
}
