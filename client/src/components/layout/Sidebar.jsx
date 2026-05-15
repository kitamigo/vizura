import { NavLink } from 'react-router-dom'

function Sidebar() {
  const navLinkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`

   return (
    <aside className="w-64 h-[calc(100vh-64px)] bg-white border-r border-slate-300 flex flex-col">

      {/* Navigation */}
      <div className="flex-1 px-4 py-15">

        {/* GENERAL */}
        <div className="mb-8">

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            General
          </h2>

          <div className="space-y-1">
            <NavLink
              to="/app/dashboard"
              className={navLinkClass}
            >
              Dashboard
            </NavLink>
          </div>

        </div>

        {/* MODULES */}
        <div className="mb-8">

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Modules
          </h2>

          <div className="space-y-1">

            <NavLink
              to="/app/analytics"
              className={navLinkClass}
            >
              Analytics
            </NavLink>

            <NavLink
              to="/app/roster"
              className={navLinkClass}
            >
              Rostering
            </NavLink>

            <NavLink
              to="/app/payroll"
              className={navLinkClass}
            >
              Payroll
            </NavLink>

            <NavLink
              to="/app/employee"
              className={navLinkClass}
            >
              Employee
            </NavLink>

          </div>

        </div>

        {/* SYSTEM */}
        <div className="mb-8">

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            System
          </h2>

          <div className="space-y-1">

            <NavLink
              to="/app/settings"
              className={navLinkClass}
            >
              Settings
            </NavLink>

          </div>

        </div>

      </div>

      {/* Bottom User Profile */}
      <div className="border-t border-slate-600 px-5 pt-4 pb-6">

        <div className="flex items-center gap-3">

          {/* Profile Image */}
          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">

            {/* Later replace with actual image */}
            <img
              src="https://placehold.co/100x100"
              alt="Profile"
              className="w-full h-full object-cover"
            />

          </div>

          {/* User Info */}
          <div>

            <p className="font-medium text-sm text-gray-800">
              Joe Beans
            </p>

            <p className="text-xs text-gray-500">
              Manager
            </p>

          </div>

        </div>

      </div>

    </aside>
  )
}

export default Sidebar