import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'

function EmployeeRoster() {
    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Today's Shift" value="9:00am - 5:00pm" />
                <ActionCard title="Request Shift Swap" />
                <ActionCard title="Roster Conflict Fix Request" />
            </div>

            <div className="grid min-h-120 grid-cols-1 md:grid-cols-1 gap-6">
                <ViewCard title="WEEKLY ROSTER SHOWN HERE" />
            </div>
        </div>
    )
}

export default EmployeeRoster