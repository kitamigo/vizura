import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'

function EmployeeEmployee() {
    return (
        <div className="space-y-6">

            <div className="grid min-h-120 grid-cols-1 md:grid-cols-1 gap-6">
                <ViewCard title="User Data Widget SHOWN HERE" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActionCard title="Leave Application" />
                <ActionCard title="View Older Payslips"/>
            </div>


        </div>
  )
}

export default EmployeeEmployee