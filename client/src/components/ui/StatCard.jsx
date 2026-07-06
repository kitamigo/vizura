function StatCard({ title, value }) {
<<<<<<< Updated upstream

  return (
    <div 
      className="
        bg-surface 
        rounded-2xl 
        border-2 
        border-primary 
        text-center
        shadow-sm 
        p-10
      "
    >

      <p className="text-sm text-text mb-15">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-text">
=======
  return (
    <div className="bg-white rounded-2xl border border-slate-300 text-center shadow-sm p-10 transition-colors duration-200 dark:bg-slate-900 dark:border-slate-700">

      <p className="text-sm text-slate-500 mb-15 dark:text-slate-400">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
>>>>>>> Stashed changes
        {value}
      </h2>

    </div>
  )
}

export default StatCard