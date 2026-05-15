import { useNavigate } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import { useAuth } from '../../context/AuthContext'

function Login() {

  const navigate = useNavigate()

  const { login } = useAuth()

  const handleLogin = async ({ email, password }) => {

    try {

      await login(email, password)

      navigate('/app/dashboard')

    } catch (err) {

      console.error(err)

      alert('Login failed')
    }
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] mt-16 bg-stone-300">
      <LoginForm onSubmit={handleLogin} />
    </div>
  )
}

export default Login