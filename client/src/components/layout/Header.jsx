import darkLogo from '../../assets/logo_dark.svg'
import lightLogo from '../../assets/logo_light.svg'
import darkIcon from '../../assets/toggle_dark_mode.svg'
import lightIcon from '../../assets/toggle_light_mode.svg'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'

function Header() {

  const { user } = useAuth()

  const { darkMode, toggleTheme } = useTheme();

  return (
    <header
      className={`
        fixed top-0 left-0 w-full h-16
        bg-surface
        border-b
        border-border
        flex items-center justify-between px-6 z-50
      `}
    >

      {/* Left: Logo */}
      <div className="flex items-center">
        <img src={darkMode ? lightLogo : darkLogo} alt="Vizura" className="h-12" />
      </div>

      {/* Right: Toggle icon */}
      <div className="flex items-center">
        <button onClick={toggleTheme}>
          <img
            src={darkMode ? lightIcon : darkIcon}
            alt="Toggle Theme"
            className="h-12 w-12 cursor-pointer transition-transform duration-300 hover:scale-110"
          />
        </button>
      </div>

    </header>
  )
}

export default Header