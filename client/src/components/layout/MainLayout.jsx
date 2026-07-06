import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'

function MainLayout() {

  return (
<<<<<<< Updated upstream
    <div className="flex min-h-[calc(100vh-64px)]">
      
      {/* Sidebar */}
=======
    <div className="flex h-screen overflow-hidden bg-fixed bg-sky-50 pt-16 text-slate-900 transition-colors duration-200 dark:bg-fixed dark:bg-[linear-gradient(180deg,#0b4a77_0%,#0d5f95_45%,#083152_100%)] dark:text-slate-100">
>>>>>>> Stashed changes
      <Sidebar />

      <div className="page-scrollbar flex-1 min-h-0 overflow-y-auto ml-64 px-6 pt-4 pb-6 pr-8">
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout