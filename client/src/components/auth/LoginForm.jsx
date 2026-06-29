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
    <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-sm">

      {/* Heading */}
      <h1 className="text-2xl font-bold mb-2 text-primary">
        Sign In
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-text">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-2 text-text">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            required
          />

          {/* Forgot Password */}
          <div className="flex justify-end mt-2">

            <button
              type="button"
              className="text-sm text-tertiary hover:text-primary"
            >
              Forgot Password?
            </button>

          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-primary text-text py-3 rounded-xl font-medium hover:bg-primary2 transition-colors"
        >
          Sign In
        </button>

      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">

        <div className="flex-1 h-px bg-text" />

        <span className="text-sm text-text whitespace-nowrap">
          New to Vizura?
        </span>

        <div className="flex-1 h-px bg-text" />

      </div>

      {/* Create Account */}
      <Link
        to="/register"
        className="block text-center py-3 rounded-xl font-medium text-tertiary hover:text-primary transition-colors"
      >
        Create Account
      </Link>

    </div>
  )
}

export default LoginForm