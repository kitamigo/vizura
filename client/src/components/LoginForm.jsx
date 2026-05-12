import { Link } from 'react-router-dom'

function LoginForm() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow w-80">

      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: '#6D66C9' }}
      >
        Sign In
      </h1>

      <label className="text-sm text-gray-600 mb-1 block">
        Email
      </label>
      <input
        className="w-full mb-4 p-2 border border-gray-300 rounded-xl text-black"
        type="email"
        placeholder="Enter your email"
      />

      <label className="text-sm text-gray-600 mb-1 block">
        Password
      </label>
      <input
        className="w-full mb-1 p-2 border border-gray-300 rounded-xl text-black"
        type="password"
        placeholder="Enter your password"
      />

      <div className="flex justify-end mb-4">
        <Link 
            to="/forgot-password" 
            className="text-xs hover:underline"
            style={{ color: '#00AA9F' }}
        >
        Forgot password?
        </Link>
      </div>

      <button
      className="w-full p-2 rounded-xl text-white transition-colors"
      style={{ backgroundColor: '#6D66C9' }}
      >
        Sign In
        </button>

      <div className="flex items-center my-4">
        <div className="flex-grow h-px bg-gray-600"></div>
        <span className="px-2 text-xs text-gray-600">
          New to Vizura?
        </span>
        <div className="flex-grow h-px bg-gray-600"></div>
      </div>

      <p className="text-sm text-center text-black">
        No Account?{' '}
        <Link to="/register" 
        className="text-xs hover:underline"
        style={{ color: '#00AA9F' }}>
          Register
        </Link>
      </p>

    </div>
  )
}

export default LoginForm