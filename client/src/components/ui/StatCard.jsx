function StatCard({ title, value }) {

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
        {value}
      </h2>

    </div>
  )
}

export default StatCard