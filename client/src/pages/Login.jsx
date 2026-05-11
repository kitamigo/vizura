import { Link } from 'react-router-dom'

function Login() {
    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow w-80">

                <h1 className="text-2xl font-bold mb-6">Login</h1>

                <input
                className ="w-full mb-3 p-2 border rounded"
                type="email"
                placeholder="Email"
                />

                <input
                className ="w-full mb-3 p-2 border rounded"
                type="password"
                placeholder="Password"
                />

                <button className="w-full bg-blue-600 text-white p-2 rounded">
                    Login
                </button>

                <p className="mt-4 text-sm">
                    No Account? <Link to="/register" className="text-blue-500">
                    Register</Link>
                </p>

            </div>
        </div>
    )
}

export default Login