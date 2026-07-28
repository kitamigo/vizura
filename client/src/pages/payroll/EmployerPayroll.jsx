import { useState } from 'react'
import { generatePayslip } from '../../services/payrollApi'
import StatCard from '../../components/ui/StatCard'
import ActionCard from '../../components/ui/ActionCard'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import GeneratePayslipForm from './GeneratePayslipForm'

function EmployerPayroll() {
  const [showModal, setShowModal] = useState(false)
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [employeeIds, setEmployeeIds] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGeneratePayslip = () => {
    setShowModal(true)
    setError('')
  }

  const handleRangeChange = ({ startDate: start, endDate: end }) => {
    setStartDate(start)
    setEndDate(end)
  }

  const handleSubmit = async () => {
    setError('')

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.')
      return
    }

    if (!employeeIds.trim()) {
      setError('Please enter at least one employee ID.')
      return
    }

    const ids = employeeIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))

    if (ids.length === 0) {
      setError('Please enter valid employee ID(s).')
      return
    }

    const start = startDate.toISOString().split('T')[0]
    const end = endDate.toISOString().split('T')[0]
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    const weeks = Math.max(1, Math.round((diffDays / 7) * 10) / 10)

    setLoading(true)

    try {
      const response = await generatePayslip(ids, { start, end, weeks })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'payslips.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setShowModal(false)
      setEmployeeIds('')
      setStartDate(null)
      setEndDate(null)
    } catch (err) {
      const message =
        err.response?.data?.error || err.response?.data?.message || 'Failed to generate payslip PDF.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid min-h-70 grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Days Till Next PayDay" value="4" />
        <ActionCard title="Check Leave Requests | 1 Request Pending" />
      </div>

      <div className="grid min-h-70 grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Generate Payslip(s) from Pay Run"
          onClick={handleGeneratePayslip}
        />
        <ActionCard title="Send Payslips" />
        <ActionCard
          title="Quick Payslip (No Pay Run)"
          onClick={() => setShowQuickModal(true)}
        />
      </div>

      {/* Modal: from saved pay run */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
              Generate Payslip PDF
            </h2>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pay Period
              </label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeChange={handleRangeChange}
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Employee ID(s)
              </label>
              <input
                type="text"
                value={employeeIds}
                onChange={(e) => setEmployeeIds(e.target.value)}
                placeholder="e.g. 1, 2, 3"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Separate multiple IDs with commas
              </p>
            </div>

            {error && (
              <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: quick ad-hoc payslip, no saved pay run */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 relative">
            <button
              onClick={() => setShowQuickModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
            <GeneratePayslipForm onSuccess={() => setShowQuickModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployerPayroll