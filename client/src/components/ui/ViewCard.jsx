function ViewCard({ title }) {
  return (
    <div
      className="
        bg-white dark:bg-slate-800
        rounded-2xl
        border
        border-slate-400 dark:border-slate-600
        shadow-sm
        p-6
        min-h-[250px]
        transition-colors duration-200
      "
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
        {title}
      </h2>
    </div>
  )
}

export default ViewCard