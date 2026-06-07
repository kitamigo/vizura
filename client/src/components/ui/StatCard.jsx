function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-400 text-center shadow-sm p-10">

      <p className="text-sm text-slate-500 mb-15">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-slate-800">
        {value}
      </h2>

    </div>
  )
}

export default StatCard