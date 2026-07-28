const axios = require('axios')
const Database = require('better-sqlite3')

const queryHistory = []

// -- HISTORY HELPERS -- //
function pushHistoryEntry(entry) {
  queryHistory.unshift(entry)
  queryHistory.splice(10)
}

// Builds an in-memory SQLite database from the uploaded CSV //
function buildDatabaseFromCsv(csvContent) {
  if (!csvContent) return null

  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return null

  const db = new Database(':memory:')

  // Used first line as column headers
  const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
  const dataRows = lines.slice(1)

  // Creates sales table with all CSV columns as text
  const colDefs = rawHeaders.map(h => `${h} TEXT`).join(', ')
  db.exec(`CREATE TABLE sales (${colDefs})`)

  // Inserts data rows
  const placeholders = rawHeaders.map(() => '?').join(', ')
  const insertStmt = db.prepare(`INSERT INTO sales VALUES (${placeholders})`)

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      let cols = row.split(',')
      while (cols.length < rawHeaders.length) cols.push('')
      if (cols.length > rawHeaders.length) {
        cols = cols.slice(0, rawHeaders.length - 1).concat(cols.slice(rawHeaders.length - 1).join(','))
      }
      insertStmt.run(...cols.map(c => c.trim()))
    }
  })

  insertMany(dataRows)
  return db
}

// Executes SQL against the in-memory DB and returns rows //
function executeQuery(db, sql) {
  if (!db || !sql) return []

  try {
    const trimmed = sql.trim().toUpperCase()
    if (!trimmed.startsWith('SELECT')) {
      return []
    }

    const stmt = db.prepare(sql)
    const rows = stmt.all()
    return rows
  } catch (err) {
    console.error('SQL execution error:', err.message)
    return []
  }
}

// Formats query results into a readable answer //
function formatAnswer(question, rows, sql) {
  if (!rows || rows.length === 0) {
    return `No data found for: "${question}"`
  }

  if (rows.length === 1) {
    const row = rows[0]
    const keys = Object.keys(row)
    if (keys.length === 1) {
      const val = row[keys[0]]
      return typeof val === 'number'
        ? `Result: ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `Result: ${val}`
    }
    return `Result: ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')}`
  }

  return `Found ${rows.length} records matching your query.`
}

// Normalizes the model response into the app shape //
function normalizeNlqResponse(source, question) {
  return {
    question: source.question || question || '',
    sql: source.sql || '',
    answer: source.answer || '',
    confidence: source.confidence ?? (source.mode === 't5' ? 0.85 : 0.6),
    method: source.mode || 'rule_based',
    rows: Array.isArray(source.rows) ? source.rows : [],
    row_count: source.row_count ?? (Array.isArray(source.rows) ? source.rows.length : 0),
  }
}

// Calls the AI service NLQ endpoint
async function callNlqModel(question) {
  const modelUrl = process.env.NLQ_MODEL_URL || 'http://localhost:8000/nlquery/query'

  if (!modelUrl) {
    return null
  }

  const headers = {
    'Content-Type': 'application/json',
  }

  const token = process.env.NLQ_MODEL_TOKEN || process.env.HF_NLQ_TOKEN

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const timeout = Number(process.env.NLQ_MODEL_TIMEOUT_MS || 60000)

  const response = await axios.post(
    modelUrl,
    {
      question,
      table_name: 'sales',
    },
    { headers, timeout },
  )
  return response.data
}

// Handles NLQ requests //
async function queryNlq(req, res) {
  const question = String(req.body?.question || '').trim()

  if (!question) {
    return res.status(400).json({ error: 'question is required' })
  }

  try {
    const modelResponse = await callNlqModel(question)

    // Returns a pending response when the model is not connected
    if (!modelResponse) {
      return res.status(202).json({
        question,
        sql: '',
        confidence: 0,
        method: 'pending_model',
        rows: [],
        row_count: 0,
        message: 'Configure NLQ_MODEL_URL or HF_NLQ_URL to connect your model.',
      })
    }

    const source = modelResponse?.data || modelResponse || {}
    const generatedSql = source.sql || ''

    // Execute SQL against in-memory DB built from the uploaded CSV
    let rows = []
    let answer = source.answer || ''

    if (generatedSql) {
      const { getLatestCsvContent } = require('./analyticsController')
      const csvContent = getLatestCsvContent()

      if (csvContent) {
        const db = buildDatabaseFromCsv(csvContent)
        if (db) {
          const columnMap = {
            revenue: 'revenue_nzd',
            amount: 'revenue_nzd',
            value: 'revenue_nzd',
            payslip: 'payslip_total_nzd',
            payslip_amount: 'payslip_total_nzd',
            shift_hours: 'total_shift_hours',
            hours: 'total_shift_hours',
            staff: 'staff_count',
            employees: 'staff_count',
            public_holiday: 'is_public_holiday',
            holiday: 'holiday_name',
            anomaly: 'is_anomaly',
            labour_cost: 'labour_cost_pct',
            labor_cost: 'labour_cost_pct',
          }
          let fixedSql = generatedSql
          for (const [generic, actual] of Object.entries(columnMap)) {
            fixedSql = fixedSql.replace(new RegExp(`\\b${generic}\\b`, 'gi'), actual)
          }

          rows = executeQuery(db, fixedSql)
          db.close()
        }
      }
    }

    // Overrides the answer if rows are found
    if (rows.length > 0) {
      answer = formatAnswer(question, rows, generatedSql)
    } else if (!answer) {
      answer = source.answer || 'No data found for your question.'
    }

    const normalized = {
      question: source.question || question,
      sql: generatedSql,
      answer,
      confidence: source.confidence ?? (source.mode === 't5' ? 0.85 : 0.6),
      method: source.mode || 'rule_based',
      rows,
      row_count: rows.length,
    }

    // Saves the latest query in history //
    pushHistoryEntry({
      question: normalized.question,
      timestamp: new Date().toISOString(),
      row_count: normalized.row_count,
      method: normalized.method,
    })

    return res.json(normalized)
  } catch (error) {
    // Returns a safe error response //
    return res.status(502).json({
      question,
      sql: '',
      confidence: 0,
      method: 'error',
      rows: [],
      row_count: 0,
      error: error.message,
    })
  }
}

// Returns the recent query history //
async function getNlqHistory(req, res) {
  res.json({ history: queryHistory })
}

module.exports = {
  queryNlq,
  getNlqHistory,
}