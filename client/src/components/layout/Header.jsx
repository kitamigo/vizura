import logo from '../../assets/logo_dark.svg'
import toggleDarkIcon from '../../assets/toggle_dark_mode.svg'
import toggleLightIcon from '../../assets/toggle_light_mode.svg'

function Header() {
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-300 flex items-center justify-between px-6 z-50">

      {/* Left: Logo */}
      <div className="flex items-center">
        <img src={logo} alt="Vizura" className="h-12" />
      </div>

      {/* Right: Toggle icon */}
      return (  
        <div className="flex items-center">
          <button>
            {/* Toggle light mode*/}
            <img
              src={toggleDarkIcon}
              alt="Dark Mode Toggle"
              className="block dark:hidden w-full max-w-md cursor-pointer"
            />
            {/* Toggle light mode*/}
            <img
              src={toggleLightIcon}
              alt="Light Mode Toggle"
              className="hidden dark:block w-full max-w-md cursor-pointer"
            />
          </button>
        </div>
      );
      

    </header>
  )
}

export default Header