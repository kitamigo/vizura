import { createContext, useContext, useState } from 'react'

import {
  loginUser,
  registerUser
} from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)

  // LOGIN
  const login = async (email, password) => {

    const data = await loginUser(email, password)

    setUser(data.user)

    return data
  }

  // REGISTER
  const register = async (userData) => {

    const data = await registerUser(userData)

    setUser(data.user)

    return data
  }

  // LOGOUT
  const logout = () => {
    setUser(null)
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