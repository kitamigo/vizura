import { useState } from 'react'

function RegisterForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'employee',
    business_name: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 p-10 rounded-lg shadow transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-4 text-indigo-500 dark:text-indigo-400">Register</h2>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">

        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />

        <span className="text-sm text-gray-700 dark:text-gray-400 whitespace-nowrap">
          Haere Mai - Welcome to Vizura
        </span>

        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />

      </div>

      {error && (
        <p className="text-red-500 mb-3 text-sm">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        <input
          name="first_name"
          placeholder="First Name"
          className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded"
          value={formData.first_name}
          onChange={handleChange}
          required
        />

        <input
          name="last_name"
          placeholder="Last Name"
          className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded"
          value={formData.last_name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Role selector */}
        <select
          name="role"
          className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>

        {/* Only show business name if manager */}
        {formData.role === 'manager' && (
          <input
            name="business_name"
            placeholder="Business Name"
            className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded"
            value={formData.business_name}
            onChange={handleChange}
            required
          />
        )}


        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 dark:bg-green-600 text-white py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

      </form>
    </div>
  )
}

export default RegisterForm