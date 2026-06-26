function ActionCard({ title }) {

  return (
    <button
      className="
        w-full
        bg-surface
        rounded-2xl
        border-2
        border-primary
        shadow-sm
        p-6
        text-center
        hover:shadow-md
      "
    >
      <h2 className="text-lg font-semibold text-text">
        {title}
      </h2>
    </button>
  )
}

export default ActionCard