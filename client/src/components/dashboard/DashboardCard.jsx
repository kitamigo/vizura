function DashboardCard({ title }) {
    return(
        <div className="bg-white rounded 2x1 shadow-sm border border-slate-200 p-6 min-h-[140px]">
            <h2 className="text-lg font-semibold text-slate-800">
                {title}
            </h2>
        </div>
    )
}

export default DashboardCard