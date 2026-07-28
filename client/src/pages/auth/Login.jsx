import { useNavigate } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import { useAuth } from '../../context/AuthContext'

function Login() {

  const navigate = useNavigate()

  const { login } = useAuth()

  const handleLogin = async ({ email, password }) => {

    try {

      const data = await login(email, password)
      
    
        navigate('/app/dashboard')
      

    } catch (err) {

      console.error(err)

      console.log(err.response)
      console.log(err.response?.data)
    }
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] mt-16 bg-stone-300 dark:bg-slate-900 transition-colors duration-200">
      <LoginForm onSubmit={handleLogin} />
    </div>
  )
}

export default Login