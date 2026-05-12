import darkToggle from '../assets/toggle_dark_mode.svg'
import lightToggle from '../assets/toggle_light_mode.svg'

function ThemeToggle({ darkMode, setDarkMode }) {

  const handleToggle = () => {
    setDarkMode(!darkMode)
  }

  return (
    <button
      onClick={handleToggle}
      className="cursor-pointer"
    >
      <img
        src={darkMode ? lightToggle : darkToggle}
        alt="Theme Toggle"
        className="w-15 h-10"
      />
    </button>
  )
}

export default ThemeToggle