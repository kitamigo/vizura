import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'

function EmployeePayroll() {
  return (
    <div className="space-y-6">

      <div className="grid min-h-70 grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Days Till Next PayDay" value="4" />
        <ActionCard title="Check Latest Payslip" />
      </div>

      <div className="grid min-h-70 grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard title="Check Leave Statistics" />
        <ActionCard title="Apply For Leave" />
      </div>

    </div>
  )
}

export default EmployeePayroll