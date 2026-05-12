import ThemeToggle from "./ThemeToggle"
import logoDark from '../assets/logo_dark.svg'
import logoLight from '../assets/logo_light.svg'

function Header({ darkMode, setDarkMode}) {
    
  return (
    <header 
    className={
        darkMode
            ? 'bg-stone-700 text-white border border-white px-8 py-4 flex items-center justify-between'
            : 'bg-white text-black px-8 py-4 flex items-center justify-between'
        }
    >

        <img
            src={darkMode ? logoLight : logoDark}
            alt="VIZURA Logo"
            className="h-12"
        />

      <ThemeToggle 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

    </header>
  )
}

export default Header