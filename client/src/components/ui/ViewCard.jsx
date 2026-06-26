function ViewCard({ title }) {

  return (
    <div
      className="
        bg-surface
        rounded-2xl
        border-2
        border-primary
        shadow-sm
        p-6
        min-h-[250px]
      "
    >
      <h2 className="text-lg font-semibold text-text mb-4">
        {title}
      </h2>
    </div>
  )
}

export default ViewCard