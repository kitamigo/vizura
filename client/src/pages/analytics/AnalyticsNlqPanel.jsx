import { Button } from 'flowbite-react'

function formatHistoryTime(timestamp) {
  if (!timestamp) {
    return ''
  }

  return new Intl.DateTimeFormat('en-NZ', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function AnalyticsNlqPanel({
  loadingQuery,
  promptChips,
  queryColumns,
  queryHistory,
  queryResult,
  queryText,
  onChipClick,
  onHistoryClick,
  onQueryTextChange,
  onSubmitQuery,
}) {
  return (
    <>
      <section className="rounded-[26px] border border-sky-200/80 bg-white/85 p-5 shadow-lg shadow-sky-200/40 backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Ask revenue & forecast questions</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {promptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-900 transition hover:bg-sky-100 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800"
                  onClick={() => onChipClick(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={queryText}
                onChange={(event) => onQueryTextChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    onSubmitQuery()
                  }
                }}
                placeholder="Ask about revenue or forecasts..."
                className="min-w-0 flex-1 rounded-2xl border border-sky-200 bg-white px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-400"
              />
              <Button
                className="cursor-pointer rounded-2xl bg-sky-500 px-6 text-white shadow-sm transition hover:bg-sky-400 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:shadow-[inset_0_2px_10px_rgba(15,23,42,0.22)] active:translate-y-px disabled:cursor-not-allowed"
                onClick={() => onSubmitQuery()}
                disabled={loadingQuery}
                size="lg"
              >
                {loadingQuery ? 'Thinking...' : 'Ask →'}
              </Button>
            </div>
          </div>

          <aside className="w-full max-w-sm rounded-[24px] border border-sky-100 bg-sky-50/70 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-200/90">Query history</h3>
              <span className="text-xs text-slate-500 dark:text-slate-300">Last 10</span>
            </div>
            <div className="mt-3 space-y-2">
              {queryHistory.length ? queryHistory.map((item) => (
                <button
                  key={`${item.question}-${item.timestamp}`}
                  type="button"
                  className="w-full rounded-2xl border border-transparent bg-white px-3 py-3 text-left text-sm shadow-sm transition hover:border-sky-200 hover:bg-sky-50 dark:bg-slate-950/60 dark:text-slate-100 dark:hover:border-white/10 dark:hover:bg-slate-900/80"
                  onClick={() => onHistoryClick(item)}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{item.question}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    {formatHistoryTime(item.timestamp)} · {item.row_count ?? 0} rows · {item.method || 'rule_based'}
                  </div>
                </button>
              )) : (
                <div className="rounded-2xl border border-dashed border-sky-200 bg-white px-3 py-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                  No query history yet.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {queryResult ? (
        <section className="rounded-[26px] border border-sky-200/80 bg-white/85 p-5 shadow-lg shadow-sky-200/40 backdrop-blur-md transition-colors duration-200 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {queryResult.question || 'Query result'}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-sky-100/75">
                {queryResult.row_count === 0
                  ? 'No results found for that question.'
                  : `${queryResult.row_count} results · ${queryResult.method === 'ai_model' ? 'AI Model' : 'Rule-based'}`}
              </p>
            </div>
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${queryResult.method === 'ai_model' ? 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-100' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100'}`}>
              {queryResult.method === 'ai_model' ? 'AI Model' : 'Rule-based'}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-sky-100 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-sky-50 text-sky-900 dark:bg-slate-900/70 dark:text-slate-200">
                <tr>
                  {queryColumns.map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 bg-white dark:divide-white/10 dark:bg-slate-950/40">
                {queryResult.rows.length ? queryResult.rows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {queryColumns.map((col) => (
                      <td key={col} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {String(row?.[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-300" colSpan={Math.max(queryColumns.length, 1)}>
                      No results found for that question.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <details className="mt-4 rounded-2xl border border-sky-100 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/40">
            <summary className="cursor-pointer text-sm font-semibold text-sky-800 dark:text-sky-100">View SQL</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">{queryResult.sql || 'No SQL returned yet.'}</pre>
          </details>
        </section>
      ) : null}
    </>
  )
}
