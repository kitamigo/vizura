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

  //temporary user values while no DB access
  const [user, setUser] = useState({
    id: 1,
    name: 'Jay Test',
    role: 'employer'
  })

  //Temporary stasis while testing user systems without DB access
  // LOAD USER ON REFRESH
  //useEffect(() => {
  //  const storedUser = localStorage.getItem('user')
  //
  //if (storedUser) {
  //    setUser(JSON.parse(storedUser))
  //  }
  //}, [])

  // LOGIN
  const login = async (email, password) => {

    const data = await loginUser(email, password)

    setUser(data.user)

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    )

    return data
  }

  // REGISTER
  const register = async (userData) => {

    const data = await registerUser(userData)

    setUser(data.user)

    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    )

    return data
  }

  // LOGOUT
  const logout = () => {
    setUser(null)

    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}