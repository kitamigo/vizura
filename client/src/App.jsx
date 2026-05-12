import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Header from './components/Header'

function App() {

  const [darkMode, setDarkMode] = useState(false)

  return (
    <div
      className={
        darkMode
          ? 'bg-stone-800 text-white min-h-screen'
          : 'bg-stone-300 text-black min-h-screen'
        } 
    >

      <Header 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

    </div>
  )
}

export default App
