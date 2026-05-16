import { useNavigate } from 'react-router-dom'
import RegisterForm from '../../components/auth/RegisterForm'
import { useAuth } from '../../context/AuthContext'

function Register() {

  const navigate = useNavigate()

  const { register } = useAuth()

  const handleRegister = async (formData) => {

    try {

      await register(formData)

      navigate('/app/dashboard')

    } catch (err) {

      console.error(err)

      alert('Registration failed')
    }
  }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] mt-16 bg-stone-300">
      <RegisterForm onSubmit={handleRegister} />
    </div>
  )
}

export default Register