function DashboardCard({ title }) {
    return(
        <div className="bg-white rounded 2x1 shadow-sm border border-slate-200 p-6 min-h-[140px] dark:bg-slate-900 dark:border-slate-700 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {title}
            </h2>
        </div>
    )
}

export default DashboardCard