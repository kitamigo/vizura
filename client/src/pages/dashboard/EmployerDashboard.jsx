import DashboardCard from '../../components/dashboard/DashboardCard'
import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'

function EmployerDashboard() {
  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 min-h-60 md:grid-cols-3 gap-6">
        <StatCard title="Revenue This Month" value="$45,618.28" />
        <StatCard title="On Shift Today" value="7" />
        <StatCard title="Pending Requests" value="1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard title="Add Shift" />
        <ActionCard title="Run Payroll" />
        <ActionCard title="Upload Data" />
      </div>

      <div className="grid min-h-80 grid-cols-1 md:grid-cols-2 gap-6">
        <ViewCard title="Revenue Trend" />
        <ViewCard title="Today's Roster" />
      </div>

      <ActionCard title="Post to Bulletin Board" />

    </div>
  )
}

export default EmployerDashboard