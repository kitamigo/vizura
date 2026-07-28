function ActionCard({ title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full
        bg-white dark:bg-slate-800
        rounded-2xl
        border
        border-slate-400 dark:border-slate-600
        shadow-sm
        p-6
        text-center
        hover:shadow-md
        transition-colors duration-200
        cursor-pointer
      "
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
    </button>
  )
}

export default ActionCard
