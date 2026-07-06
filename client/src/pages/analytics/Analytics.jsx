import { Button } from "flowbite-react";
import DashboardCard from '../../components/dashboard/DashboardCard'
import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import ViewCard from '../../components/ui/ViewCard'
import DatePicker from '../../components/ui/DateRangePicker'


function analyticsLayout() {
  return (
  <div className="space-y-6">

      <div className="grid grid-cols-1 min-h-30 md:grid-cols-2 gap-6">
        <DatePicker></DatePicker>
        <Button className="cursor-pointer bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:bg-gradient-to-bl" size="xl">Upload Data</Button>
      </div>

      <div className="grid grid-cols-1 min-h-60 md:grid-cols-3 gap-6">
        <StatCard title="Staff Total" value="19" />
        <StatCard title="On Shift Today" value="7" />
        <StatCard title="Pending Requests" value="1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-wrap gap-2">
      
    </div>
        <ActionCard title="Edit/Delete Existing User" />
        <ActionCard title="Show Staff List" />
      </div>

      <div className=" md:grid-cols-1 gap-6">
        <ViewCard title="ROSTER WILL APPEAR HERE" />
      </div>

    </div>
  )
}

export default analyticsLayout