import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'

function EmployeeDashboard() {
  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Today's Shift" value="9:00am - 5:00pm" />
        <ActionCard title="Clock In" />
      </div>


      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <ViewCard title="Weekly Roster" />
        <ViewCard title="Bulletin Board" />
      </div>

    </div>
  )
}

export default EmployeeDashboard