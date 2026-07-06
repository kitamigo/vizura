<<<<<<< Updated upstream
function ActionCard({ title }) {

=======
function ActionCard({ title, onClick }) {
>>>>>>> Stashed changes
  return (
    <button
      onClick={onClick}
      className="
        w-full
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
        text-center
        hover:shadow-md
<<<<<<< Updated upstream
      "
    >
      <h2 className="text-lg font-semibold text-text">
=======
        transition-colors duration-200
      "
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
>>>>>>> Stashed changes
        {title}
      </h2>
    </button>
  )
}

export default ActionCard