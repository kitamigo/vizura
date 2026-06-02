import EmployeeEmployee from '../../pages/employee/EmployeeEmployee'
import EmployerEmployee from '../../pages/employee/EmployerEmployee'
import { useAuth } from '../../context/AuthContext'

function Employee() {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Employee Management
      </h1>

      {user?.role === 'employer' && (
        <EmployerEmployee />
      )}

      {user?.role === 'employee' && (
        <EmployeeEmployee />
      )}
    </div>
  )
}

export default Employee