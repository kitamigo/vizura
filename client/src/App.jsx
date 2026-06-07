import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout.jsx'
import Header from './components/layout/Header.jsx'

import Dashboard from './pages/dashboard/Dashboard.jsx'
import Employee from './pages/employee/Employee.jsx'
import Payroll from './pages/payroll/Payroll.jsx'
import Roster from './pages/roster/Roster.jsx'
import Analytics from './pages/analytics/Analytics.jsx'

import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

function App() {
  return (
    <>
    <Header />

      <Routes>

        {/* Authentication pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

       {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" />}/>

        {/* App shell */}
        <Route path="/app" element={<MainLayout />}>

          <Route
            path="dashboard" 
            element={
              <ProtectedRoute allowedRoles={['employer', 'employee']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="employee" 
            element={
              <ProtectedRoute allowedRoles={['employer', 'employee']}>
                <Employee />
              </ProtectedRoute>
            } 
          />

          <Route
            path="payroll" 
            element={
              <ProtectedRoute allowedRoles={['employee', 'employer']}> 
                <Payroll />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="roster" 
            element={
              <ProtectedRoute allowedRoles={['employee', 'employer']}>
                <Roster />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="analytics" 
            element={
              <ProtectedRoute allowedRoles={['employee', 'employer']}>
                <Analytics />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<div>404 Not Found </div>} />

      </Routes>
    </>
  )
}

export default App