import logo from '../../assets/logo_dark.svg'
import toggleIcon from '../../assets/toggle_dark_mode.svg'
import { useAuth } from '../../context/AuthContext'

function Header() {

  const { user } = useAuth()

  const employerTheme = user?.role === 'employer'

  const headerBg = employerTheme
  ? 'bg-violet-300'
  : 'bg-slate-700'



  return (
    <header
      className={`
        fixed top-0 left-0 w-full h-16
        ${employerTheme ? 'bg-violet-300' : 'bg-stone-200'}
        border-b border-slate-300
        flex items-center justify-between px-6 z-50
      `}
    >

      {/* Left: Logo */}
      <div className="flex items-center">
        <img src={logo} alt="Vizura" className="h-12" />
      </div>

      {/* Right: Toggle icon */}
      <div className="flex items-center">
        <button>
          <img
            src={toggleIcon}
            alt="Toggle Theme"
            className="h-12 w-12 cursor-pointer"
          />
        </button>
      </div>

    </header>
  )
}

export default Header