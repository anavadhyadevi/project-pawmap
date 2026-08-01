import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ReportStray from './pages/ReportStray.jsx'
import Adopt from './pages/Adopt.jsx'
import AnimalDetail from './pages/AnimalDetail.jsx'
import Volunteer from './pages/Volunteer.jsx'
import VolunteerDashboard from './pages/VolunteerDashboard.jsx'
import VolunteerAnalytics from './pages/VolunteerAnalytics.jsx'
import NgoDashboard from './pages/NgoDashboard.jsx'
import NgoAnalytics from './pages/NgoAnalytics.jsx'
import MedicalRecords from './pages/MedicalRecords.jsx'
import About from './pages/About.jsx'
import Analytics from './pages/Analytics.jsx'
import LostFound from './pages/LostFound.jsx'
import ReportLostFound from './pages/ReportLostFound.jsx'

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
      <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
      <Route path="/volunteer/analytics" element={<VolunteerAnalytics />} />
      <Route path="/ngo/dashboard" element={<NgoDashboard />} />
      <Route path="/ngo/analytics" element={<NgoAnalytics />} />
      <Route path="/medical" element={<MedicalRecords />} />
      <Route path="/about" element={<About />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/lost-found" element={<LostFound />} />
      <Route path="/lost-found/report" element={<ReportLostFound />} />
    </Routes>
  )
}