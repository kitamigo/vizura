import { useEffect, useState } from 'react'
import logoDark from '../../assets/logo_dark.svg'
import logoLight from '../../assets/logo_light.svg'
import toggleDarkIcon from '../../assets/toggle_dark_mode.svg'
import toggleLightIcon from '../../assets/toggle_light_mode.svg'

function Header() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const theme = window.localStorage.getItem('theme')
    if (theme === 'dark') {
      return true
    }

    if (theme === 'light') {
      return false
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const docRoot = document.documentElement
    docRoot.classList.toggle('dark', isDarkMode)
    window.localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const logo = isDarkMode ? logoLight : logoDark
  const toggleIcon = isDarkMode ? toggleLightIcon : toggleDarkIcon

  return (
    <header
      className={`
        fixed top-0 left-0 w-full h-16
        bg-sky-200 text-slate-900 dark:bg-slate-900 dark:text-slate-100
        border-b border-slate-300 dark:border-slate-800
        flex items-center justify-between px-6 z-50
        transition-colors duration-200
      `}
    >

      <div className="flex items-center">
        <img src={logo} alt="Vizura" className="h-12" />
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsDarkMode((cur) => !cur)}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDarkMode}
          className="rounded-full p-1 transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          <img
            src={toggleIcon}
            alt=""
            aria-hidden="true"
            className="h-12 w-12 cursor-pointer"
          />
        </button>
      </div>

    </header>
  )
}

export default Header