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
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm">

      {/* Heading */}
      <h1 className="text-2xl font-bold mb-2 text-indigo-500">
        Sign In
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          {/* Forgot Password */}
          <div className="flex justify-end mt-2">

            <button
              type="button"
              className="text-sm text-green-700 hover:text-indigo-700"
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

        <div className="flex-1 h-px bg-gray-700" />

        <span className="text-sm text-gray-700 whitespace-nowrap">
          New to Vizura?
        </span>

        <div className="flex-1 h-px bg-gray-700" />

      </div>

      {/* Create Account */}
      <Link
        to="/register"
        className="block text-center py-3 rounded-xl font-medium text-green-700 hover:text-indigo-600 transition-colors"
      >
        Create Account
      </Link>

    </div>
  )
}

export default LoginForm