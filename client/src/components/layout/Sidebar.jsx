import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'


function Sidebar() {

  const { user } = useAuth()

<<<<<<< Updated upstream
  const navLinkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary text-bright'
        : 'text-text hover:bg-background'
=======
  const navCls = ({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
>>>>>>> Stashed changes
    }`

   return (
    <aside
      className={`
<<<<<<< Updated upstream
        fixed left-0 top-16 w-64 h-[calc(100vh-64px)]
        bg-surface
        border-r
        border-border
        flex 
        flex-col
=======
        fixed left-0 top-18 w-64 h-[calc(98vh-64px)] z-40
      overflow-hidden rounded-r-[20px]
      bg-sky-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100
      border border-l-0 border-sky-200 dark:border-slate-800
      flex flex-col
      shadow-[2px_0_15px_rgba(15,23,42,0.14)]
      transition-colors duration-200
>>>>>>> Stashed changes
      `}
    >
      {/* Navigation */}
      <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-15 pr-2">

        {/* GENERAL */}
        <div className="mb-8">

<<<<<<< Updated upstream
          <h2 className="text-xs font-semibold text-text uppercase tracking-wider mb-3 px-2">
=======
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 px-2 dark:text-slate-400">
>>>>>>> Stashed changes
            General
          </h2>

          <div className="space-y-1">
            <NavLink
              to="/app/dashboard"
              className={navCls}
            >
              Dashboard
            </NavLink>
          </div>

        </div>

        {/* MODULES */}
        <div className="mb-8">

<<<<<<< Updated upstream
          <h2 className="text-xs font-semibold text-text uppercase tracking-wider mb-3 px-2">
=======
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 px-2 dark:text-slate-400">
>>>>>>> Stashed changes
            Modules
          </h2>

          <div className="space-y-1">

            <NavLink
              to="/app/analytics"
              className={navCls}
            >
              Analytics
            </NavLink>

            <NavLink
              to="/app/roster"
              className={navCls}
            >
              Rostering
            </NavLink>

            <NavLink
              to="/app/payroll"
              className={navCls}
            >
              Payroll
            </NavLink>


          </div>

        </div>

        {/* SYSTEM */}
        <div className="mb-8">

<<<<<<< Updated upstream
          <h2 className="text-xs font-semibold text-text uppercase tracking-wider mb-3 px-2">
=======
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 px-2 dark:text-slate-400">
>>>>>>> Stashed changes
            System
          </h2>

          <div className="space-y-1">

            <NavLink
              to="/app/settings"
              className={navCls}
            >
              Settings
            </NavLink>

          </div>

        </div>

  </div>

      {/* Bottom User Profile */}
<<<<<<< Updated upstream
      <div className="border-t border-border px-5 pt-4 pb-6">
=======
      <div className="shrink-0 border-t border-slate-300 px-5 pt-4 pb-6 dark:border-slate-800">
>>>>>>> Stashed changes

        <div className="flex items-center gap-3">

          {/* Profile Image */}
          <div className="w-10 h-10 rounded-full bg-background overflow-hidden">

            {/* Later replace with actual image */}
            <img
              src="https://placehold.co/100x100"
              alt="Profile"
              className="w-full h-full object-cover"
            />

          </div>

          {/* User Info */}
          <div>

<<<<<<< Updated upstream
            <p className="font-medium text-sm text-text">
              {user?.name || 'User'}
            </p>

            <p className="text-xs text-text">
=======
            <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
              {user?.name || 'User'}
            </p>

            <p className="text-xs text-slate-600 dark:text-slate-400">
>>>>>>> Stashed changes
              {user?.role || 'Member'}
            </p>

          </div>

        </div>

      </div>

    </aside>
  )
}

export default Sidebar