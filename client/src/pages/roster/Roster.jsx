import EmployeeRoster from '../../pages/roster/EmployeeRoster'
import EmployerRoster from '../../pages/roster/EmployerRoster'
import { useAuth } from '../../context/AuthContext'

function Roster() {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Rostering
      </h1>

      {user?.role === 'employer' && (
        <EmployerRoster />
      )}

      {user?.role === 'employee' && (
        <EmployeeRoster />
      )}
    </div>
  )
}

export default Roster