import { useState } from 'react'
import { Link } from 'react-router-dom'

function LoginForm({ onSubmit }) {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      email,
      password
    })
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm transition-colors duration-200">

      {/* Heading */}
      <h1 className="text-2xl font-bold mb-2 text-indigo-500 dark:text-indigo-400">
        Sign In
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Password
          </label>

            <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          {/* Forgot Password */}
          <div className="flex justify-end mt-2">

            <button
              type="button"
              className="text-sm text-green-700 dark:text-green-400 hover:text-indigo-700 dark:hover:text-indigo-400"
            >
              Forgot Password?
            </button>

          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </button>

      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">

        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />

        <span className="text-sm text-gray-700 dark:text-gray-400 whitespace-nowrap">
          New to Vizura?
        </span>

        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />

      </div>

      {/* Create Account */}
      <Link
        to="/register"
        className="block text-center py-3 rounded-xl font-medium text-green-700 dark:text-green-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        Create Account
      </Link>

    </div>
  )
}

export default LoginForm