import EmployeeDashboard from '../../pages/dashboard/EmployeeDashboard'
import EmployerDashboard from '../../pages/dashboard/EmployerDashboard'
import { useAuth } from '../../context/AuthContext'

function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Dashboard
      </h1>

      {user?.role === 'employer' && (
        <EmployerDashboard />
      )}

      {user?.role === 'employee' && (
        <EmployeeDashboard />
      )}
    </div>
  )
}

export default Dashboard