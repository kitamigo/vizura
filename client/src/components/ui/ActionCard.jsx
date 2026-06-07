function ActionCard({ title }) {
  return (
    <button
      className="
        w-full
        bg-white
        rounded-2xl
        border
        border-slate-400
        shadow-sm
        p-6
        text-center
        hover:shadow-md
        transition
      "
    >
      <h2 className="text-lg font-semibold text-slate-800">
        {title}
      </h2>
    </button>
  )
}

export default ActionCard