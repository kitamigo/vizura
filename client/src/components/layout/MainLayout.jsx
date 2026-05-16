import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="flex h-[calc(100vh-64px)] mt-16 bg-stone-300">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 p-6">
        <Outlet />
      </div>

    </div>
  )
}

export default MainLayout