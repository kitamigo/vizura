import EmployeePayroll from '../../pages/payroll/EmployeePayroll'
import EmployerPayroll from '../../pages/payroll/EmployerPayroll'
import { useAuth } from '../../context/AuthContext'

function Payroll() {
  const { user } = useAuth()

  if (loading) return null;

  return (
    <div className="p-6">
      <h1 className="text-3xl text-text font-bold mb-4">
        Payroll
      </h1>

      {user?.role === 'employer' && (
        <EmployerPayroll />
      )}

      {user?.role === 'employee' && (
        <EmployeePayroll />
      )}
    </div>
  )
}

export default Payroll