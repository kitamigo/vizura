function StatCard({ title, value }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-400 dark:border-slate-600 text-center shadow-sm p-10 transition-colors duration-200">

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-15">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </h2>

    </div>
  )
}

export default StatCard