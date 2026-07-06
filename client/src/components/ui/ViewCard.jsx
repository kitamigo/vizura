function ViewCard({ title }) {

  return (
    <div
      className="
<<<<<<< Updated upstream
        bg-surface
        rounded-2xl
        border-2
        border-primary
=======
        bg-white dark:bg-slate-900
        rounded-2xl
        border
        border-slate-300 dark:border-slate-700
>>>>>>> Stashed changes
        shadow-sm
        p-6
        min-h-[250px]
        transition-colors duration-200
      "
    >
<<<<<<< Updated upstream
      <h2 className="text-lg font-semibold text-text mb-4">
=======
      <h2 className="text-lg font-semibold text-slate-800 mb-4 dark:text-slate-100">
>>>>>>> Stashed changes
        {title}
      </h2>
    </div>
  )
}

export default ViewCard