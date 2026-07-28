import { useState } from 'react'
import EmployerPayroll from '../../pages/payroll/EmployerPayroll'
import GeneratePayslipForm from '../../pages/payroll/GeneratePayslipForm'

function Payroll() {
  const [showPayslipModal, setShowPayslipModal] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payroll</h1>
        <button
          onClick={() => setShowPayslipModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Generate Quick Payslip
        </button>
      </div>

      <EmployerPayroll />

      {showPayslipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowPayslipModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
            <GeneratePayslipForm onSuccess={() => setShowPayslipModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Payroll