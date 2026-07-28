import { useMemo } from 'react'
import DatePicker from '../../components/ui/DateRangePicker'
import { Button } from 'flowbite-react'
import { AnalyticsNlqPanel } from './AnalyticsNlqPanel'
import { ForecastBandChart, ForecastTrendChart, formatDDMMYY } from './AnalyticsCharts'
import { useAnalyticsData } from './useAnalyticsData'

const analyticsButtonClass = 'cursor-pointer rounded-2xl border border-transparent bg-sky-500 px-4 py-2 text-white shadow-sm transition hover:bg-sky-400 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:translate-y-px active:shadow-[inset_0_2px_10px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed'
const analyticsOutlineButtonClass = 'cursor-pointer rounded-2xl border border-transparent bg-white px-4 py-2 text-sky-900 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:translate-y-px active:shadow-[inset_0_2px_10px_rgba(15,23,42,0.14)] disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-100 dark:hover:border-white/10 dark:hover:bg-slate-800'

function formatDate(date) {
  if (!date) return 'Any time'

  return new Intl.DateTimeFormat('en-NZ', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function AnalyticsShell({ dateRange, setDateRange }) {
  const {
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
    revenueTrendPts,
    runSavedForecast,
    setCsvFile,
    setQueryText,
    statusMsg,
    submitQuery,
    loadHistoryQuery,
    uploadCsv,
  } = useAnalyticsData(dateRange)

  const rangeLbl =
    dateRange.startDate || dateRange.endDate
      ? `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
      : 'Select a date range to focus the dashboard'

  const prompts = useMemo(
    () => [
      'Total revenue this month',
      'Show revenue forecast for next month',
      'Detect anomalies in revenue',
      'Which day had the highest revenue?',
    ],
    []
  )

  return (
    <div className="relative min-h-full overflow-x-hidden px-4 pt-2 pb-4 text-slate-900 sm:px-6 lg:px-8 dark:text-slate-100">
      <div className="relative z-10 space-y-6">
        <section className="flex flex-col gap-4 border-y border-sky-200/70 bg-white/85 px-4 py-5 shadow-none backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-slate-900/35 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold uppercase tracking-[0.1em] text-sky-700 dark:text-sky-200/90">
              Analytics overview
            </h1>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-900 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-sky-50">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(14,165,233,0.6)] dark:bg-cyan-300 dark:shadow-[0_0_12px_rgba(103,232,249,0.95)]" />
            Current range: {rangeLbl}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="relative z-50 overflow-visible rounded-[26px] border border-sky-200/80 bg-white/80 p-4 shadow-lg shadow-sky-200/40 backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Date filter</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-sky-100/70">
                  Select a date range to view analytics for that period.
                </p>
              </div>
            </div>

            <div className="relative z-50 mt-4 overflow-visible">
              <DatePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onRangeChange={setDateRange}
              />
            </div>
          </article>

          <article className="rounded-[26px] border border-sky-200/80 bg-white/80 p-4 shadow-lg shadow-sky-200/40 backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">CSV upload</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-sky-100/75">
              Upload a CSV to refresh the analytics inputs.
            </p>

            <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-sky-300 bg-sky-50/80 p-4 text-sm text-sky-800 transition hover:bg-sky-100 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/60">
              <span className="block font-medium">Choose CSV file</span>
              <span className="mt-1 block text-xs text-sky-700/80 dark:text-slate-400">
                {csvFile ? csvFile.name : 'No file selected yet'}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
              />
            </label>

            <Button
              className={`mt-4 w-full ${analyticsButtonClass}`}
              size="md"
              onClick={() => uploadCsv(csvFile)}
              disabled={loadingUpload}
            >
              {loadingUpload ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </article>

          <article className="rounded-[26px] border border-sky-200/80 bg-white/80 p-4 shadow-lg shadow-sky-200/40 backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Anomaly flags</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-sky-100/75">
              Dates and types flagged from the anomaly service.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" className={analyticsButtonClass} onClick={refreshAnomalies} disabled={loadingAnomalies || !hasData}>
                {loadingAnomalies ? 'Refreshing...' : 'Refresh anomalies'}
              </Button>
            </div>
           <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100 dark:border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-sky-50 text-sky-900 dark:bg-slate-900/70 dark:text-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Revenue</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Severity</th>
                  </tr>
                </thead>
              </table>
              <div className="max-h-[220px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-sky-100 bg-white dark:divide-white/10 dark:bg-slate-950/40">
                    {anomalies.length ? anomalies.map((it) => (
                      <tr key={`${it.date}-${it.type}`} className={it.severity === 'high' ? 'bg-rose-50/70 dark:bg-rose-950/20' : ''}>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{formatDDMMYY(it.date)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          ${it.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{it.holiday_name || '—'}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{it.severity}</td>
                      </tr>
                    )) : null}
                  </tbody>
                </table>
              </div>
              {!anomalies.length ? (
                <div className="border-t border-sky-100 bg-white px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                  Upload a CSV to generate anomaly flags from your model.
                </div>
              ) : null}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[26px] border border-sky-200/80 bg-white/80 p-5 shadow-lg shadow-sky-200/40 backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Revenue trend</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-sky-100/70">
                  Revenue trend across the selected date range.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-sky-50/70 p-4 dark:bg-slate-900/40">
              <ForecastTrendChart data={revenueTrendPts} />
            </div>
          </article>

          <article className="rounded-[26px] border border-sky-200/80 bg-white/80 p-5 shadow-lg shadow-sky-200/40 backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Forecast chart</h2>
                  <span
                    className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-sky-200 text-[10px] font-bold text-sky-800 dark:bg-sky-800 dark:text-sky-100"
                    title="The confidence band (shaded area) shows the range the model expects actual revenue to fall within. A narrower band means the model is more certain; a wider band means more uncertainty in that prediction."
                  >
                    ?
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-sky-100/70">
                  Predicted revenue with confidence band.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className={analyticsButtonClass} onClick={runSavedForecast} disabled={loadingForecast || !forecastPts.length}>
                  {loadingForecast ? 'Running...' : 'Run forecast'}
                </Button>
                <Button size="sm" className={analyticsOutlineButtonClass} onClick={runSavedForecast} disabled={loadingForecast || !forecastPts.length}>
                  Load saved
                </Button>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-sky-50/70 p-4 dark:bg-slate-900/40">
              <ForecastBandChart data={forecastPts} />
            </div>
          </article>
        </section>

        <AnalyticsNlqPanel
          loadingQuery={loadingQuery}
          promptChips={prompts}
          queryColumns={queryCols}
          queryHistory={queryHistory}
          queryResult={queryResult}
          queryText={queryText}
          onChipClick={(question) => submitQuery(question)}
          onHistoryClick={loadHistoryQuery}
          onQueryTextChange={setQueryText}
          onSubmitQuery={submitQuery}
        />

      </div>
    </div>
  )
}

export default AnalyticsShell