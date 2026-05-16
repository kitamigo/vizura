import { useState } from 'react'
import axios from 'axios'

function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'manager',
    business_name: ''
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData)
      setMessage(response.data.message)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div>
      <h1>Create your account</h1>
      <form onSubmit={handleRegister}>
        <div>
          <label>First name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Kita"
          />
        </div>
        <div>
          <label>Last name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Jones"
          />
        </div>
        <div>
          <label>Business name</label>
          <input
            type="text"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            placeholder="Your Business Ltd"
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@yourbusiness.co.nz"
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>
        <button type="submit">Create account</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default Register