import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ReportStray from './pages/ReportStray.jsx'
import Adopt from './pages/Adopt.jsx'
import AnimalDetail from './pages/AnimalDetail.jsx'
import Volunteer from './pages/Volunteer.jsx'
import About from './pages/About.jsx'
import Analytics from './pages/Analytics.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/report" element={<ReportStray />} />
      <Route path="/adopt" element={<Adopt />} />
      <Route path="/adopt/:id" element={<AnimalDetail />} />
      <Route path="/volunteer" element={<Volunteer />} />
      <Route path="/about" element={<About />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  )
}