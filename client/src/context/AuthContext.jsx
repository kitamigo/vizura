import { 
  createContext, 
  useContext, 
  useEffect, 
  useState 
} from 'react'

import {
  loginUser,
  registerUser
} from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)
  const [token, setToken] =useState(null)
  const [loading, setLoading] = useState(true)

  //load user on app sart
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch (err) {
        console.error("Failed to parse stored user:", err)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }

    setLoading(false);
  }, [])


  // LOGIN
  const login = async (email, password) => {
    const data = await loginUser(email, password)

    setUser(data.user)
    setToken(data.token)

    localStorage.setItem("user", JSON.stringify(data.user))
    localStorage.setItem("token", data.token)

    return data
  }

  // REGISTER
  const register = async (userData) => {
    const data = await registerUser(userData)

    setUser(data.user)
    setToken(data.token)

    localStorage.setItem("user", JSON.stringify(data.user))
    localStorage.setItem("token", data.token)

    return data
  }

  // LOGOUT
  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}