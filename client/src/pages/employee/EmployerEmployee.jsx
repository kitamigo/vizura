import DashboardCard from '../../components/dashboard/DashboardCard'
import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'

function EmployerEmployee() {
    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActionCard title="Leave Application" />
                <ActionCard title="View Older Payslips"/>
            </div>


        </div>
  )
}

export default EmployerEmployee