function ViewCard({ title }) {
  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-slate-400
        shadow-sm
        p-6
        min-h-[250px]
      "
    >
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        {title}
      </h2>
    </div>
  )
}

export default ViewCard