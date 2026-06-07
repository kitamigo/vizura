import DashboardCard from '../../components/dashboard/DashboardCard'
import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'

function EmployerPayroll() {
  return (
    <div className="space-y-6">

      <div className="grid min-h-70 grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Days Till Next PayDay" value="4" />
        <ActionCard title="Check Leave Requests | 1 Request Pending" />
      </div>

      <div className="grid min-h-70 grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard title="Generate Payslip(s)" />
        <ActionCard title="Send Payslips" />
        <ActionCard title="Download Payslip(s) - PDF" />
      </div>

    </div>
  )
}

export default EmployerPayroll