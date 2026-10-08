import { Navigate, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Recap } from './pages/Recap'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/u/:username" element={<Recap />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
